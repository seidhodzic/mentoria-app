import type { CheckoutPlanKey } from '@/lib/payments/checkout-plan-keys';
import type { SubscriptionPlanKey } from './types';

/**
 * Server-only Stripe Price ID resolution. Do not import from Client Components.
 */

function requireStripePriceId(envVar: string, label: string): string {
  const raw = process.env[envVar]?.trim();
  if (!raw) {
    throw new Error(`Missing ${envVar} for ${label}. Set it in the server environment.`);
  }
  if (raw.toLowerCase().includes('placeholder')) {
    throw new Error(`Invalid ${envVar}: placeholder values are not allowed.`);
  }
  if (raw.startsWith('prod_')) {
    throw new Error(`${label}: use a Stripe Price ID (price_…), not a Product ID (prod_…).`);
  }
  if (!raw.startsWith('price_')) {
    throw new Error(`${label}: expected a Stripe Price ID starting with price_.`);
  }
  return raw;
}

const CHECKOUT_PLAN_ENV: Record<CheckoutPlanKey, { env: string; label: string }> = {
  monthly: { env: 'STRIPE_PRICE_MONTHLY', label: 'monthly subscription' },
  annual: { env: 'STRIPE_PRICE_ANNUAL', label: 'annual subscription' },
  fifa_exam: { env: 'STRIPE_PRICE_FIFA_EXAM', label: 'FIFA exam prep' },
  investment_masterclass: { env: 'STRIPE_PRICE_INVESTMENT', label: 'investment masterclass' },
  advisory_session: { env: 'STRIPE_PRICE_SESSION', label: 'advisory session' },
};

/** Maps authenticated upgrade `planKey` → Stripe Price ID (server env). */
export function getStripePriceIdForCheckoutPlan(planKey: CheckoutPlanKey): string {
  const row = CHECKOUT_PLAN_ENV[planKey];
  return requireStripePriceId(row.env, row.label);
}

/** Sign-up / post-registration subscription checkout (`subscription_monthly` | `subscription_annual`). */
export function getSubscriptionPriceId(key: SubscriptionPlanKey): string {
  if (key === 'subscription_monthly') {
    return requireStripePriceId('STRIPE_PRICE_MONTHLY', 'subscription_monthly');
  }
  return requireStripePriceId('STRIPE_PRICE_ANNUAL', 'subscription_annual');
}
