import Stripe from 'stripe';

/** Re-export for route handlers that need `Stripe.Event` / `Stripe.Metadata` without importing `stripe` directly. */
export { Stripe };
import { env } from '@/lib/env';
import { getSubscriptionPriceId } from '@/lib/payments/stripe-prices';
import type { CheckoutInput, CheckoutResult } from '@/lib/payments/types';

let stripeSingleton: Stripe | null = null;

/** Server-only Stripe client. Requires `STRIPE_SECRET_KEY`. */
export function getStripe(): Stripe {
  if (!env.stripeSecretKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  if (!stripeSingleton) {
    stripeSingleton = new Stripe(env.stripeSecretKey);
  }
  return stripeSingleton;
}

/** Lazily delegates to {@link getStripe} — supports `stripe.checkout.sessions.create(...)`. */
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    const client = getStripe();
    const value = Reflect.get(client as object, prop, client);
    return typeof value === 'function' ? (value as (...args: unknown[]) => unknown).bind(client) : value;
  },
});

/**
 * Stripe Checkout Session (subscription).
 * Works with **Test Mode** (`STRIPE_SECRET_KEY=sk_test_…`, test price IDs) or Live keys — same API.
 * Always attach `metadata.userId` (and legacy `supabase_user_id`) for webhooks.
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
        userId: input.userId,
        supabase_user_id: input.userId,
      },
      subscription_data: {
        metadata: {
          userId: input.userId,
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
