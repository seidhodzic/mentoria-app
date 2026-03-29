/**
 * Who may use member-only dashboard areas (courses, quizzes, materials, sessions).
 *
 * - **Subscription path:** Successful Stripe Checkout sets `profiles.is_active` + `status: active` — that is the source of truth (not Stripe `trialing`).
 * - **One-time purchase path:** profile is `active` at signup (no subscription row required).
 */

export type ProfileGateFields = {
  role: string | null;
  signup_access_type: string | null;
  status: string;
  is_active?: boolean | null;
};

export function memberHasPremiumAccess(
  profile: ProfileGateFields | null | undefined,
  latestSubscriptionStatus: string | null | undefined,
): boolean {
  if (!profile || profile.status === 'suspended') {
    return false;
  }
  if (profile.role === 'admin' || profile.role === 'mentor') {
    return true;
  }
  if (profile.signup_access_type === 'one_time' && profile.status === 'active') {
    return true;
  }
  if (profile.signup_access_type === 'subscription') {
    return profile.status === 'active' && profile.is_active === true;
  }
  return latestSubscriptionStatus === 'active';
}
