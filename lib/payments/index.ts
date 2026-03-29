import { createStripeCheckoutSession } from '@/lib/payments/stripe-provider';
import type { CheckoutInput, CheckoutResult } from '@/lib/payments/types';

export type {
  CheckoutInput,
  CheckoutResult,
  PaymentProviderId,
  SubscriptionPlanKey,
} from '@/lib/payments/types';

export { createStripeCheckoutSession } from '@/lib/payments/stripe-provider';
export { verifyCheckoutUser } from '@/lib/payments/verify-checkout-user';

/**
 * Entry point for subscription checkout. Switch `PAYMENT_PROVIDER` to add Paddle / Lemon Squeezy later.
 *
 * - `stripe` (default) — uses `lib/payments/stripe-provider.ts`
 * - `paddle` | `lemonsqueezy` — stub until implemented
 *
 * Test: `PAYMENT_PROVIDER=stripe` + `STRIPE_SECRET_KEY=sk_test_…` in `.env.local`.
 */
export async function startSubscriptionCheckout(input: CheckoutInput): Promise<CheckoutResult> {
  const provider = (process.env.PAYMENT_PROVIDER || 'stripe').toLowerCase();

  switch (provider) {
    case 'stripe':
      return createStripeCheckoutSession(input);
    case 'paddle':
    case 'lemonsqueezy':
      return {
        error: `Payment provider "${provider}" is not implemented yet. Use PAYMENT_PROVIDER=stripe or add lib/payments/${provider}-provider.ts.`,
      };
    default:
      return {
        error: `Unknown PAYMENT_PROVIDER="${provider}". Use stripe, paddle, or lemonsqueezy.`,
      };
  }
}
