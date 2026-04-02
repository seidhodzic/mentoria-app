function isStripePremiumStatus(raw: string | null | undefined): boolean {
  if (raw == null || raw === '') return false;
  const s = raw.trim().toLowerCase();
  return s === 'active' || s === 'trialing';
}

export function memberHasPremiumAccess(
  profile: {
    role?: string | null;
    signup_access_type?: string | null;
    status?: string | null;
    is_active?: boolean | null;
    subscription_status?: string | null;
  } | null,
  latestSubStatus: string | null
): boolean {
  if (!profile) return false;
  if (profile.role === 'admin' || profile.role === 'mentor') return true;
  if (profile.status === 'suspended') return false;
  if (isStripePremiumStatus(latestSubStatus)) return true;
  /**
   * Webhook mirrors Stripe on `profiles.subscription_status`. If the subscriptions row is missing
   * briefly (race) or not yet visible, use the mirror only when we have no row status yet — never
   * override an explicit non-premium row (e.g. past_due).
   */
  const hasSubRowStatus = latestSubStatus != null && String(latestSubStatus).trim() !== '';
  if (!hasSubRowStatus && isStripePremiumStatus(profile.subscription_status)) return true;
  if (profile.signup_access_type === 'one_time' && profile.is_active === true) return true;
  /** Subscription members: never grant from profile flags alone — they can lag billing (e.g. past_due). */
  if (profile.signup_access_type === 'subscription') {
    return false;
  }
  if (profile.status === 'active' && profile.is_active === true) return true;
  return false;
}
