import { NextRequest, NextResponse } from 'next/server';
import { getStripe, Stripe } from '@/lib/payments/stripe-provider';
import {
  isPremiumStripeSubscriptionStatus,
  profileSubscriptionStatusFromStripe,
  stripeSubscriptionStatusForDb,
} from '@/lib/payments/stripe-subscription-status';
import { createClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    console.error('[stripe webhook] Missing stripe-signature header or STRIPE_WEBHOOK_SECRET');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error('[stripe webhook] Signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createClient();

  try {
    const stripe = getStripe();

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

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId ?? session.metadata?.supabase_user_id;
        if (!userId || typeof userId !== 'string') {
          console.error('[stripe webhook] checkout.session.completed: missing userId in metadata');
          return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
        }

        const customerId = checkoutCustomerId(session);

        if (session.mode === 'subscription' && session.subscription) {
          const subId =
            typeof session.subscription === 'string'
              ? session.subscription
              : (session.subscription as Stripe.Subscription).id;
          const sub = await stripe.subscriptions.retrieve(subId);
          const priceId = sub.items.data[0]?.price?.id ?? null;
          const periodEnd = new Date(sub.current_period_end * 1000).toISOString();
          const dbStatus = stripeSubscriptionStatusForDb(sub.status);
          const premium = isPremiumStripeSubscriptionStatus(sub.status);

          await supabase.from('subscriptions').upsert(
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

          await supabase
            .from('profiles')
            .update({
              is_active: premium,
              status: premium ? 'active' : 'pending',
              signup_access_type: 'subscription',
              stripe_customer_id: customerId,
              subscription_status: profileSubscriptionStatusFromStripe(sub.status),
              stripe_price_id: priceId,
              subscription_current_period_end: periodEnd,
            })
            .eq('id', userId);
        } else if (session.mode === 'payment') {
          await supabase.from('subscriptions').upsert(
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

          await supabase
            .from('profiles')
            .update({
              is_active: true,
              status: 'active',
              signup_access_type: 'one_time',
              stripe_customer_id: customerId,
              subscription_status: null,
              stripe_price_id: null,
              subscription_current_period_end: null,
            })
            .eq('id', userId);
        }

        console.log(`[stripe webhook] checkout.session.completed user=${userId} mode=${session.mode}`);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const userId = await userIdForSubscription(supabase, sub);
        if (!userId) {
          console.error(`[stripe webhook] ${event.type}: could not resolve user id for subscription ${sub.id}`);
          return NextResponse.json({ error: 'User not linked' }, { status: 400 });
        }

        const priceId = sub.items.data[0]?.price?.id ?? null;
        const periodEnd = new Date(sub.current_period_end * 1000).toISOString();
        const dbStatus = stripeSubscriptionStatusForDb(sub.status);
        const premium = isPremiumStripeSubscriptionStatus(sub.status);
        const customerId = subscriptionCustomerId(sub);

        await supabase.from('subscriptions').upsert(
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

        await supabase
          .from('profiles')
          .update({
            is_active: premium,
            signup_access_type: 'subscription',
            stripe_customer_id: customerId,
            subscription_status: profileSubscriptionStatusFromStripe(sub.status),
            stripe_price_id: priceId,
            subscription_current_period_end: periodEnd,
            ...(premium ? { status: 'active' as const } : {}),
          })
          .eq('id', userId);

        console.log(`[stripe webhook] ${event.type} sub=${sub.id} user=${userId} status=${dbStatus}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const userId = await userIdForSubscription(supabase, sub);
        if (!userId) {
          console.error(`[stripe webhook] subscription.deleted: could not resolve user for ${sub.id}`);
          return NextResponse.json({ error: 'User not linked' }, { status: 400 });
        }

        await supabase
          .from('subscriptions')
          .update({
            status: 'cancelled',
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          })
          .eq('stripe_subscription_id', sub.id);

        await supabase
          .from('profiles')
          .update({
            is_active: false,
            subscription_status: 'cancelled',
            stripe_price_id: null,
            subscription_current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          })
          .eq('id', userId);

        console.log(`[stripe webhook] customer.subscription.deleted sub=${sub.id} user=${userId}`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          const subId = invoice.subscription as string;
          await supabase.from('subscriptions').update({ status: 'past_due' }).eq('stripe_subscription_id', subId);

          const { data: row } = await supabase
            .from('subscriptions')
            .select('user_id')
            .eq('stripe_subscription_id', subId)
            .maybeSingle();
          if (row?.user_id) {
            await supabase
              .from('profiles')
              .update({ subscription_status: 'past_due' })
              .eq('id', row.user_id);
          }
          console.log(`[stripe webhook] invoice.payment_failed sub=${subId}`);
        }
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error(`[stripe webhook] Handler error for ${event.type}:`, err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Webhook handler failed' },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
