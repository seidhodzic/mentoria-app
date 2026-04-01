/**
 * Checkout plan identifiers — safe to import from Client Components (no env, no Stripe IDs).
 * Price IDs are resolved on the server via `lib/payments/stripe-prices.ts`.
 */
export const CHECKOUT_PLAN_KEYS = [
  'monthly',
  'annual',
  'fifa_exam',
  'investment_masterclass',
  'advisory_session',
] as const;

export type CheckoutPlanKey = (typeof CHECKOUT_PLAN_KEYS)[number];

export function isCheckoutPlanKey(value: string): value is CheckoutPlanKey {
  return (CHECKOUT_PLAN_KEYS as readonly string[]).includes(value);
}

export function checkoutModeForPlan(key: CheckoutPlanKey): 'subscription' | 'payment' {
  return key === 'monthly' || key === 'annual' ? 'subscription' : 'payment';
}
