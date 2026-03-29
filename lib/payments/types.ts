/**
 * Provider-agnostic payment types. Webhooks should read `supabase_user_id` from provider metadata
 * (Stripe already sends it on `checkout.session.completed`).
 */

export type SubscriptionPlanKey = 'subscription_monthly' | 'subscription_annual';

/** Passed into any subscription checkout implementation (Stripe, Paddle, Lemon Squeezy, …). */
export type CheckoutInput = {
  userId: string;
  email: string;
  planKey: SubscriptionPlanKey;
};

/** UI only needs a redirect URL or an error message. */
export type CheckoutResult = { url?: string; error?: string };

export type PaymentProviderId = 'stripe' | 'paddle' | 'lemonsqueezy';
