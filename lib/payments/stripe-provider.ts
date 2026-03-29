import { env } from '@/lib/env';
import { getStripe } from '@/lib/stripe';
import { getSubscriptionPriceId } from '@/lib/payments/stripe-prices';
import type { CheckoutInput, CheckoutResult } from '@/lib/payments/types';

/**
 * Stripe Checkout Session (subscription).
 * Works with **Test Mode** (`STRIPE_SECRET_KEY=sk_test_…`, test price IDs) or Live keys — same API.
 * Always attach `metadata.supabase_user_id` so `app/api/webhook/stripe/route.ts` stays stable.
 */
export async function createStripeCheckoutSession(input: CheckoutInput): Promise<CheckoutResult> {
  if (!env.stripeSecretKey) {
    return { error: 'Payments are not configured (missing STRIPE_SECRET_KEY).' };
  }

  let priceId: string;
  try {
    priceId = getSubscriptionPriceId(input.planKey);
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Invalid price configuration' };
  }

  const email = input.email.trim().toLowerCase();
  const base = env.siteUrl.replace(/\/$/, '');

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      success_url: `${base}/login?checkout=success`,
      cancel_url: `${base}/register?checkout=cancel`,
      metadata: {
        supabase_user_id: input.userId,
      },
      subscription_data: {
        metadata: {
          supabase_user_id: input.userId,
        },
      },
    });

    if (!session.url) {
      return { error: 'Could not start checkout' };
    }
    return { url: session.url };
  } catch (e) {
    console.error('createStripeCheckoutSession:', e);
    return { error: e instanceof Error ? e.message : 'Checkout failed' };
  }
}
