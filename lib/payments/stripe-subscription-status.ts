import type Stripe from 'stripe';

/**
 * Map Stripe subscription status to `public.subscriptions.status` CHECK values:
 * trialing | active | past_due | cancelled | inactive
 */
export function stripeSubscriptionStatusForDb(
  status: Stripe.Subscription.Status
): 'trialing' | 'active' | 'past_due' | 'cancelled' | 'inactive' {
  switch (status) {
    case 'trialing':
      return 'trialing';
    case 'active':
      return 'active';
    case 'past_due':
      return 'past_due';
    case 'canceled':
    case 'unpaid':
      return 'cancelled';
    case 'paused':
      return 'active';
    case 'incomplete':
    case 'incomplete_expired':
      return 'inactive';
    default:
      return 'inactive';
  }
}

/** Human-readable mirror on `profiles.subscription_status` (same string as subscriptions.status). */
export function profileSubscriptionStatusFromStripe(
  status: Stripe.Subscription.Status
): string {
  return stripeSubscriptionStatusForDb(status);
}

export function isPremiumStripeSubscriptionStatus(
  status: Stripe.Subscription.Status
): boolean {
  return status === 'active' || status === 'trialing' || status === 'paused';
}
