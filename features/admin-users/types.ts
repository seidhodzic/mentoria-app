import type { Tables } from '@/types/supabase';

export type AdminSubscriptionSnapshot = Pick<
  Tables<'subscriptions'>,
  'plan' | 'status' | 'stripe_subscription_id' | 'stripe_customer_id' | 'current_period_end'
> | null;

export type AdminUserRow = Tables<'profiles'> & {
  subscription: AdminSubscriptionSnapshot;
  premiumAccess: boolean;
  premiumSourceLabel: string;
};
