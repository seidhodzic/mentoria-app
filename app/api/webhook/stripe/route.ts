import { NextRequest, NextResponse } from 'next/server';
import type { PostgrestError } from '@supabase/supabase-js';
import { getStripe, Stripe } from '@/lib/payments/stripe-provider';
import {
  isPremiumStripeSubscriptionStatus,
  profileSubscriptionStatusFromStripe,
  stripeSubscriptionStatusForDb,
} from '@/lib/payments/stripe-subscription-status';
import { createClient } from '@/lib/supabase/admin';
import type { Database } from '@/types/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

/** JSON lines for production log drains (grep `stripe_webhook`). */
function stripeLog(
  level: 'info' | 'warn' | 'error',
  payload: Record<string, unknown>
): void {
  const line = JSON.stringify({ scope: 'stripe_webhook', ts: new Date().toISOString(), ...payload });
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

function metadataUserId(meta: Stripe.Metadata | null | undefined): string | undefined {
  const v = meta?.userId ?? meta?.supabase_user_id;
  return typeof v === 'string' && v.length > 0 ? v : undefined;
}

async function userIdForSubscription(
  supabase: ReturnType<typeof createClient>,
  sub: Stripe.Subscription
): Promise<string | undefined> {
  const fromMeta = metadataUserId(sub.metadata);
  if (fromMeta) return fromMeta;
  const { data } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', sub.id)
    .maybeSingle();
  return data?.user_id ?? undefined;
}

function throwIfDbError(error: PostgrestError | null, context: string): void {
  if (error) {
    console.error(`[stripe webhook] ${context}:`, error.code, error.message);
    throw new Error(`${context}: ${error.message}`);
  }
}

async function updateProfileByUserId(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  patch: ProfileUpdate,
  context: string
): Promise<void> {
  const res = await supabase.from('profiles').update(patch).eq('id', userId).select('id');
  throwIfDbError(res.error, context);
  if (!res.data?.length) {
    stripeLog('error', { context, userId, msg: 'profile update affected 0 rows' });
    throw new Error(`${context}: profile row missing for user`);
  }
}

function checkoutCustomerId(session: Stripe.Checkout.Session): string | null {
  const c = session.customer;
  if (typeof c === 'string') return c;
  if (c && typeof c === 'object' && 'id' in c && typeof (c as { id: string }).id === 'string') {
    return (c as { id: string }).id;
  }
  return null;
}

function subscriptionCustomerId(sub: Stripe.Subscription): string | null {
  const c = sub.customer;
  if (typeof c === 'string') return c;
  if (c && typeof c === 'object' && 'id' in c && typeof (c as { id: string }).id === 'string') {
    return (c as { id: string }).id;
  }
  return null;
}

/** Invoice.subscription may be an id string or an expanded object (API version dependent). */
function invoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const sub = invoice.subscription;
  if (sub === null || sub === undefined) return null;
  if (typeof sub === 'string') return sub;
  if (typeof sub === 'object' && 'id' in sub && typeof (sub as Stripe.Subscription).id === 'string') {
    return (sub as Stripe.Subscription).id;
  }
  return null;
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    stripeLog('error', { msg: 'Missing stripe-signature header or STRIPE_WEBHOOK_SECRET' });
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    stripeLog('error', { msg: 'Signature verification failed', detail: String(err) });
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createClient();

  const { data: already } = await supabase
    .from('stripe_webhook_events')
    .select('id')
    .eq('id', event.id)
    .maybeSingle();

  if (already?.id) {
    stripeLog('info', {
      eventId: event.id,
      eventType: event.type,
      msg: 'duplicate delivery skipped (already in stripe_webhook_events)',
    });
    return NextResponse.json({ received: true, duplicate: true });
  }

  const stripe = getStripe();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId ?? session.metadata?.supabase_user_id;
        if (!userId || typeof userId !== 'string') {
          stripeLog('error', {
            eventId: event.id,
            eventType: event.type,
            sessionId: session.id,
            msg: 'missing userId in session metadata — ack to stop retries',
          });
          const ack = await supabase.from('stripe_webhook_events').insert({ id: event.id, event_type: event.type });
          if (ack.error && ack.error.code !== '23505') {
            throwIfDbError(ack.error, 'stripe_webhook_events insert (ignored checkout)');
          }
          return NextResponse.json({ received: true, ignored: true, reason: 'missing_user_metadata' });
        }

        const customerId = checkoutCustomerId(session);

        if (session.mode === 'subscription') {
          if (!session.subscription) {
            stripeLog('error', {
              eventId: event.id,
              eventType: event.type,
              sessionId: session.id,
              userId,
              msg: 'subscription mode but session.subscription missing — retry',
            });
            return NextResponse.json({ error: 'Subscription reference not ready on checkout session' }, { status: 500 });
          }
          const subId =
            typeof session.subscription === 'string'
              ? session.subscription
              : (session.subscription as Stripe.Subscription).id;
          const sub = await stripe.subscriptions.retrieve(subId);
          const priceId = sub.items.data[0]?.price?.id ?? null;
          const periodEnd = new Date(sub.current_period_end * 1000).toISOString();
          const dbStatus = stripeSubscriptionStatusForDb(sub.status);
          const premium = isPremiumStripeSubscriptionStatus(sub.status);

          const subRes = await supabase.from('subscriptions').upsert(
            {
              user_id: userId,
              stripe_customer_id: customerId,
              stripe_subscription_id: sub.id,
              stripe_price_id: priceId,
              status: dbStatus,
              current_period_end: periodEnd,
              plan: 'subscription',
            },
            { onConflict: 'user_id' }
          );
          throwIfDbError(subRes.error, 'subscriptions upsert (checkout subscription)');

          await updateProfileByUserId(
            supabase,
            userId,
            {
              is_active: premium,
              status: premium ? 'active' : 'pending',
              signup_access_type: 'subscription',
              stripe_customer_id: customerId,
              subscription_status: profileSubscriptionStatusFromStripe(sub.status),
              stripe_price_id: priceId,
              subscription_current_period_end: periodEnd,
            },
            'profiles update (checkout subscription)'
          );
        } else if (session.mode === 'payment') {
          const subRes = await supabase.from('subscriptions').upsert(
            {
              user_id: userId,
              stripe_customer_id: customerId,
              stripe_subscription_id: null,
              stripe_price_id: null,
              status: 'inactive',
              plan: 'one_time',
              current_period_end: null,
            },
            { onConflict: 'user_id' }
          );
          throwIfDbError(subRes.error, 'subscriptions upsert (checkout one_time)');

          await updateProfileByUserId(
            supabase,
            userId,
            {
              is_active: true,
              status: 'active',
              signup_access_type: 'one_time',
              stripe_customer_id: customerId,
              subscription_status: null,
              stripe_price_id: null,
              subscription_current_period_end: null,
            },
            'profiles update (checkout one_time)'
          );
        } else {
          stripeLog('warn', {
            eventId: event.id,
            eventType: event.type,
            sessionId: session.id,
            userId,
            mode: session.mode,
            msg: 'checkout mode not mapped to billing sync — event recorded only',
          });
        }

        stripeLog('info', {
          eventId: event.id,
          eventType: event.type,
          sessionId: session.id,
          userId,
          checkoutMode: session.mode,
          msg: 'checkout.session.completed handled',
        });
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const userId = await userIdForSubscription(supabase, sub);
        if (!userId) {
          stripeLog('error', {
            eventId: event.id,
            eventType: event.type,
            subscriptionId: sub.id,
            customerId: subscriptionCustomerId(sub),
            msg: 'could not resolve user id — retry for ordering',
          });
          return NextResponse.json({ error: 'User not linked yet' }, { status: 500 });
        }

        const priceId = sub.items.data[0]?.price?.id ?? null;
        const periodEnd = new Date(sub.current_period_end * 1000).toISOString();
        const dbStatus = stripeSubscriptionStatusForDb(sub.status);
        const premium = isPremiumStripeSubscriptionStatus(sub.status);
        const customerId = subscriptionCustomerId(sub);

        const subRes = await supabase.from('subscriptions').upsert(
          {
            user_id: userId,
            stripe_customer_id: customerId,
            stripe_subscription_id: sub.id,
            stripe_price_id: priceId,
            status: dbStatus,
            current_period_end: periodEnd,
            plan: 'subscription',
          },
          { onConflict: 'user_id' }
        );
        throwIfDbError(subRes.error, 'subscriptions upsert (subscription updated)');

        await updateProfileByUserId(
          supabase,
          userId,
          {
            is_active: premium,
            signup_access_type: 'subscription',
            stripe_customer_id: customerId,
            subscription_status: profileSubscriptionStatusFromStripe(sub.status),
            stripe_price_id: priceId,
            subscription_current_period_end: periodEnd,
            ...(premium ? { status: 'active' as const } : {}),
          },
          'profiles update (subscription updated)'
        );

        stripeLog('info', {
          eventId: event.id,
          eventType: event.type,
          subscriptionId: sub.id,
          userId,
          dbStatus,
          stripeStatus: sub.status,
          msg: 'subscription event applied',
        });
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const userId = await userIdForSubscription(supabase, sub);
        if (!userId) {
          stripeLog('error', {
            eventId: event.id,
            eventType: event.type,
            subscriptionId: sub.id,
            msg: 'could not resolve user — retry for ordering',
          });
          return NextResponse.json({ error: 'User not linked yet' }, { status: 500 });
        }

        const periodEnd = new Date(sub.current_period_end * 1000).toISOString();

        const subRes = await supabase
          .from('subscriptions')
          .update({
            status: 'cancelled',
            current_period_end: periodEnd,
          })
          .eq('stripe_subscription_id', sub.id)
          .select('user_id');
        throwIfDbError(subRes.error, 'subscriptions update (deleted)');
        if (!subRes.data?.length) {
          stripeLog('warn', {
            eventId: event.id,
            subscriptionId: sub.id,
            userId,
            msg: 'no subscriptions row matched stripe_subscription_id — profile still updated',
          });
        }

        await updateProfileByUserId(
          supabase,
          userId,
          {
            is_active: false,
            status: 'pending',
            subscription_status: 'cancelled',
            stripe_price_id: null,
            subscription_current_period_end: periodEnd,
          },
          'profiles update (deleted)'
        );

        stripeLog('info', {
          eventId: event.id,
          eventType: event.type,
          subscriptionId: sub.id,
          userId,
          msg: 'subscription deleted applied',
        });
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = invoiceSubscriptionId(invoice);
        if (subId) {
          const subUp = await supabase
            .from('subscriptions')
            .update({ status: 'past_due' })
            .eq('stripe_subscription_id', subId)
            .select('user_id');
          throwIfDbError(subUp.error, 'subscriptions update (payment_failed)');
          if (!subUp.data?.length) {
            stripeLog('warn', {
              eventId: event.id,
              eventType: event.type,
              subscriptionId: subId,
              invoiceId: invoice.id,
              msg: 'payment_failed but no subscriptions row for stripe_subscription_id',
            });
          }

          const { data: row, error: rowErr } = await supabase
            .from('subscriptions')
            .select('user_id')
            .eq('stripe_subscription_id', subId)
            .maybeSingle();
          throwIfDbError(rowErr, 'subscriptions select (payment_failed)');

          if (row?.user_id) {
            const profUp = await supabase
              .from('profiles')
              .update({ subscription_status: 'past_due' })
              .eq('id', row.user_id)
              .select('id');
            throwIfDbError(profUp.error, 'profiles update (payment_failed)');
            if (!profUp.data?.length) {
              stripeLog('warn', {
                eventId: event.id,
                userId: row.user_id,
                msg: 'payment_failed profile update affected 0 rows',
              });
            }
          }
          stripeLog('info', {
            eventId: event.id,
            eventType: event.type,
            subscriptionId: subId,
            invoiceId: invoice.id,
            userId: row?.user_id,
            msg: 'invoice.payment_failed applied',
          });
        }
        break;
      }

      default:
        break;
    }
  } catch (err) {
    stripeLog('error', {
      eventId: event.id,
      eventType: event.type,
      msg: err instanceof Error ? err.message : 'Webhook handler failed',
      errName: err instanceof Error ? err.name : typeof err,
    });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Webhook handler failed' },
      { status: 500 }
    );
  }

  const ins = await supabase.from('stripe_webhook_events').insert({ id: event.id, event_type: event.type });

  if (ins.error?.code === '23505') {
    stripeLog('info', {
      eventId: event.id,
      eventType: event.type,
      msg: 'insert race resolved as duplicate (23505)',
    });
    return NextResponse.json({ received: true, duplicate: true });
  }
  if (ins.error) {
    stripeLog('error', {
      eventId: event.id,
      eventType: event.type,
      code: ins.error.code,
      msg: ins.error.message,
      detail: 'stripe_webhook_events insert failed after successful handler',
    });
    return NextResponse.json({ error: 'Failed to record webhook event' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
