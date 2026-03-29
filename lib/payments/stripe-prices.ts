import type { SubscriptionPlanKey } from './types';

/**
 * Stripe Price IDs (Test Mode: use `price_…` from Test mode products in Dashboard).
 * Set `STRIPE_PRICE_SUBSCRIPTION_*` in `.env.local` alongside `STRIPE_SECRET_KEY=sk_test_…`.
 */
export const STRIPE_PRICE_IDS = {
  subscription_monthly: process.env.STRIPE_PRICE_SUBSCRIPTION_MONTHLY ?? '[YOUR_MONTHLY_PRICE_ID]',
  subscription_annual: process.env.STRIPE_PRICE_SUBSCRIPTION_ANNUAL ?? '[YOUR_ANNUAL_PRICE_ID]',
} as const;

export function getSubscriptionPriceId(key: SubscriptionPlanKey): string {
  const id = STRIPE_PRICE_IDS[key];
  if (!id || id.includes('[YOUR_')) {
    throw new Error(
      `Missing Stripe price ID for "${key}". Set STRIPE_PRICE_SUBSCRIPTION_MONTHLY / STRIPE_PRICE_SUBSCRIPTION_ANNUAL in .env or replace placeholders in lib/payments/stripe-prices.ts.`,
    );
  }
  const trimmed = id.trim();
  if (trimmed.startsWith('prod_')) {
    throw new Error(
      `Stripe Checkout needs a Price ID (price_…), not a Product ID (prod_…). In Dashboard → Product catalog → open the product → Pricing → copy the Price ID for "${key}".`,
    );
  }
  if (!trimmed.startsWith('price_')) {
    throw new Error(
      `Invalid Stripe price ID for "${key}": expected a string starting with "price_". Check STRIPE_PRICE_SUBSCRIPTION_* in .env.local.`,
    );
  }
  return trimmed;
}
