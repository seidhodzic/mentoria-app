import { env } from '@/lib/env';
import { createServiceRoleClient } from '@/lib/supabase/admin';

const SIGNUP_MAX_AGE_MS = 2 * 60 * 60 * 1000;

/**
 * Ensures the user was just created and matches email before starting any provider checkout.
 */
export async function verifyCheckoutUser(input: {
  userId: string;
  email: string;
  clientSecret?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const email = input.email.trim().toLowerCase();

  if (!input.userId || !email) {
    return { ok: false, error: 'Invalid request' };
  }

  const requiredSecret = env.signupNotifySecret;
  if (requiredSecret) {
    const provided = input.clientSecret ?? '';
    if (provided !== requiredSecret) {
      return { ok: false, error: 'Unauthorized' };
    }
  }

  let admin;
  try {
    admin = createServiceRoleClient();
  } catch {
    return { ok: false, error: 'Server misconfigured' };
  }

  const { data: userData, error: userErr } = await admin.auth.admin.getUserById(input.userId);
  if (userErr || !userData.user) {
    return { ok: false, error: 'Invalid user' };
  }
  const u = userData.user;
  if (u.email?.toLowerCase() !== email) {
    return { ok: false, error: 'Invalid user' };
  }
  const createdAt = u.created_at ? new Date(u.created_at).getTime() : 0;
  if (!createdAt || Date.now() - createdAt > SIGNUP_MAX_AGE_MS) {
    return { ok: false, error: 'Session expired; please sign up again.' };
  }

  return { ok: true };
}
