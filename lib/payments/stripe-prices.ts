import type { SubscriptionPlanKey } from './types';

export const STRIPE_PRICES = {
  monthly: process.env.STRIPE_PRICE_MONTHLY ?? 'price_monthly_placeholder',
  annual: process.env.STRIPE_PRICE_ANNUAL ?? 'price_annual_placeholder',
  fifa_exam: process.env.STRIPE_PRICE_FIFA_EXAM ?? 'price_fifa_placeholder',
  investment_masterclass: process.env.STRIPE_PRICE_INVESTMENT ?? 'price_investment_placeholder',
  advisory_session: process.env.STRIPE_PRICE_SESSION ?? 'price_session_placeholder',
} as const;

export type StripePriceId = (typeof STRIPE_PRICES)[keyof typeof STRIPE_PRICES];

/** Used by {@link createStripeCheckoutSession} for subscription plan keys. */
export function getSubscriptionPriceId(key: SubscriptionPlanKey): string {
  const id =
    key === 'subscription_monthly' ? STRIPE_PRICES.monthly : STRIPE_PRICES.annual;
  if (!id || id.includes('placeholder')) {
    throw new Error(
      `Missing Stripe price ID for "${key}". Set STRIPE_PRICE_MONTHLY / STRIPE_PRICE_ANNUAL in .env.`,
    );
  }
  const trimmed = id.trim();
  if (trimmed.startsWith('prod_')) {
    throw new Error(
      `Stripe Checkout needs a Price ID (price_…), not a Product ID (prod_…).`,
    );
  }
  if (!trimmed.startsWith('price_')) {
    throw new Error(
      `Invalid Stripe price ID for "${key}": expected a string starting with "price_".`,
    );
  }
  return trimmed;
}
