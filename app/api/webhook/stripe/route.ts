import { NextRequest, NextResponse } from 'next/server';
import { stripe, Stripe } from '@/lib/payments/stripe-provider';
import { createClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function metadataUserId(meta: Stripe.Metadata | null | undefined): string | undefined {
  return meta?.userId ?? meta?.supabase_user_id;
}

function mapStripeSubscriptionStatus(s: Stripe.Subscription.Status): string {
  switch (s) {
    case 'trialing':
      return 'trialing';
    case 'active':
      return 'active';
    case 'past_due':
      return 'past_due';
    case 'canceled':
    case 'unpaid':
      return 'cancelled';
    default:
      return 'inactive';
  }
}

export async function POST(req: NextRequest) {
  // Read raw body — required for Stripe webhook signature verification
  // No config export needed in App Router; req.text() reads raw body natively
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    console.error('Webhook: missing signature or secret');
    return NextResponse.json({ error: 'Missing signature or secret' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Use admin client to bypass RLS — webhook runs server-side with no user session
  const supabase = createClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        // userId is always set in metadata by our checkout route (3.1 above)
        const userId = session.metadata?.userId;
        if (!userId) {
          console.error('Webhook checkout.session.completed: no userId in metadata');
          break;
        }

        const isSubscription = session.mode === 'subscription';
        const isOneTime = session.mode === 'payment';

        await supabase.from('subscriptions').upsert(
          {
            user_id: userId,
            stripe_customer_id: typeof session.customer === 'string' ? session.customer : null,
            stripe_subscription_id: isSubscription ? (session.subscription as string) : null,
            status: 'active',
            plan: isOneTime ? 'one_time' : 'subscription',
            current_period_end: null,
            created_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' },
        );

        await supabase
          .from('profiles')
          .update({
            is_active: true,
            status: 'active',
            signup_access_type: isOneTime ? 'one_time' : 'subscription',
          })
          .eq('id', userId);

        console.log(`Checkout completed for user ${userId}`);
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        // userId is in subscription metadata (set via subscription_data.metadata in checkout)
        const userId = sub.metadata?.userId;
        if (!userId) {
          console.warn('Webhook subscription.updated: no userId in subscription metadata');
          break;
        }

        const status = sub.status;
        const periodEnd = new Date(sub.current_period_end * 1000).toISOString();
        const isActive = status === 'active' || status === 'trialing';

        await supabase
          .from('subscriptions')
          .update({ status, current_period_end: periodEnd })
          .eq('stripe_subscription_id', sub.id);

        await supabase.from('profiles').update({ is_active: isActive }).eq('id', userId);

        console.log(`Subscription updated for user ${userId}: ${status}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const userId = metadataUserId(sub.metadata);
        if (!userId) {
          console.warn('Webhook subscription.deleted: no userId in metadata');
          break;
        }

        await supabase
          .from('subscriptions')
          .update({ status: 'cancelled' })
          .eq('stripe_subscription_id', sub.id);

        await supabase.from('profiles').update({ is_active: false }).eq('id', userId);

        console.log(`Subscription cancelled for user ${userId}`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          await supabase
            .from('subscriptions')
            .update({ status: 'past_due' })
            .eq('stripe_subscription_id', invoice.subscription as string);
          console.log(`Payment failed for subscription ${invoice.subscription}`);
        }
        break;
      }

      default:
        // Ignore unhandled events — do not log noise for every event type
        break;
    }
  } catch (err) {
    // Log the error but always return 200 so Stripe does not retry
    console.error(`Webhook handler error for ${event.type}:`, err);
  }

  // Always return 200 to Stripe
  return NextResponse.json({ received: true });
}
