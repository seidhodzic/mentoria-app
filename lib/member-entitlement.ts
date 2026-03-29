export function memberHasPremiumAccess(
  profile: {
    role?: string | null;
    signup_access_type?: string | null;
    status?: string | null;
    is_active?: boolean | null;
  } | null,
  latestSubStatus: string | null
): boolean {
  if (!profile) return false;
  if (profile.role === 'admin' || profile.role === 'mentor') return true;
  if (profile.status === 'suspended') return false;
  if (latestSubStatus === 'active' || latestSubStatus === 'trialing') return true;
  if (profile.signup_access_type === 'one_time' && profile.is_active === true) return true;
  if (profile.status === 'active' && profile.is_active === true) return true;
  return false;
}
