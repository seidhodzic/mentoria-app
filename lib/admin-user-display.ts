import type { AdminSubscriptionSnapshot, AdminUserRow } from '@/features/admin-users/types';
import { memberHasPremiumAccess } from '@/lib/member-entitlement';
import type { Tables } from '@/types/supabase';

function isPremiumSubStatus(status: string | null | undefined): boolean {
  if (status == null || status === '') return false;
  const s = status.trim().toLowerCase();
  return s === 'active' || s === 'trialing';
}

function labelForProfileAndSub(
  profile: Tables<'profiles'>,
  sub: AdminSubscriptionSnapshot
): string {
  if (profile.role === 'admin' || profile.role === 'mentor') {
    return 'Staff (mentor/admin)';
  }
  if (sub?.stripe_subscription_id && isPremiumSubStatus(sub.status)) {
    return 'Stripe subscription';
  }
  if (sub?.plan === 'admin_grant' && isPremiumSubStatus(sub.status)) {
    return 'Admin grant';
  }
  if (profile.signup_access_type === 'one_time' && profile.is_active === true) {
    return 'One-time purchase';
  }
  if (memberHasPremiumAccess(profile, sub?.status ?? null, sub?.plan ?? null)) {
    return 'Active access';
  }
  return 'No premium access';
}

export function buildAdminUserRows(
  profiles: Tables<'profiles'>[],
  subscriptionsByUserId: Map<string, AdminSubscriptionSnapshot>
): AdminUserRow[] {
  return profiles.map((p) => {
    const sub = subscriptionsByUserId.get(p.id) ?? null;
    const latestStatus = sub?.status ?? null;
    const premiumAccess = memberHasPremiumAccess(p, latestStatus, sub?.plan ?? null);
    return {
      ...p,
      subscription: sub,
      premiumAccess,
      premiumSourceLabel: labelForProfileAndSub(p, sub),
    };
  });
}
