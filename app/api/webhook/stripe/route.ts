import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { env } from '@/lib/env';
import { getStripe } from '@/lib/stripe';
import { createServiceRoleClient } from '@/lib/supabase/admin';
import type { Database } from '@/types/supabase';

type SubStatus = Database['public']['Tables']['subscriptions']['Row']['status'];

function mapStripeSubscriptionStatus(s: Stripe.Subscription.Status): SubStatus {
  switch (s) {
    case 'trialing':
      return 'trialing';
    case 'active':
      return 'active';
    case 'past_due':
      return 'past_due';
    case 'canceled':
      return 'cancelled';
    case 'unpaid':
      return 'cancelled';
    default:
      return 'inactive';
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Stripe webhook — `checkout.session.completed` sets `profiles.is_active` + `status: active` on successful payment.
 * Subscription rows mirror Stripe for reporting; member UI gating uses the profile flags for subscription signups.
 * Configure: Dashboard → Webhooks → `https://<your-domain>/api/webhook/stripe`
 */
export async function POST(request: Request) {
  if (!env.stripeWebhookSecret) {
    return NextResponse.json({ error: 'STRIPE_WEBHOOK_SECRET not configured' }, { status: 500 });
  }

  const rawBody = await request.text();
  const sig = request.headers.get('stripe-signature');
  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, sig, env.stripeWebhookSecret);
  } catch (err) {
    console.error('Stripe webhook verify:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.supabase_user_id;
    const customer = session.customer;
    const customerId = typeof customer === 'string' ? customer : customer?.id ?? null;
    const subscriptionRef = session.subscription;
    const subscriptionId =
      typeof subscriptionRef === 'string' ? subscriptionRef : subscriptionRef?.id ?? null;

    if (userId && customerId) {
      try {
        const admin = createServiceRoleClient();
        const { error } = await admin
          .from('profiles')
          .update({
            is_active: true,
            status: 'active',
            stripe_customer_id: customerId,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);

        if (error) {
          console.error('Webhook profiles update:', error);
          return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
        }

        if (subscriptionId) {
          const stripe = getStripe();
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          const status = mapStripeSubscriptionStatus(sub.status);
          const periodEnd = sub.current_period_end
            ? new Date(sub.current_period_end * 1000).toISOString()
            : null;

          const row = {
            user_id: userId,
            plan: 'starter',
            stripe_customer_id: customerId,
            stripe_subscription_id: sub.id,
            status,
            current_period_end: periodEnd,
          };

          const { data: existing } = await admin
            .from('subscriptions')
            .select('id')
            .eq('stripe_subscription_id', sub.id)
            .maybeSingle();

          const { error: subErr } = existing
            ? await admin.from('subscriptions').update(row).eq('id', existing.id)
            : await admin.from('subscriptions').insert(row);

          if (subErr) {
            console.error('Webhook subscriptions upsert:', subErr);
            return NextResponse.json({ error: 'Subscription row failed' }, { status: 500 });
          }
        }
      } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
      }
    }
  }

  if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription;
    const status =
      event.type === 'customer.subscription.deleted'
        ? ('cancelled' as const)
        : mapStripeSubscriptionStatus(sub.status);
    const periodEnd =
      event.type === 'customer.subscription.deleted'
        ? null
        : sub.current_period_end
          ? new Date(sub.current_period_end * 1000).toISOString()
          : null;
    try {
      const admin = createServiceRoleClient();
      const { error } = await admin
        .from('subscriptions')
        .update({
          status,
          current_period_end: periodEnd,
        })
        .eq('stripe_subscription_id', sub.id);
      if (error) {
        console.error('Webhook subscription sync:', error);
      }
    } catch (e) {
      console.error(e);
    }
  }

  return NextResponse.json({ received: true });
}
