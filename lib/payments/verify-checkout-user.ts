import type { User } from '@supabase/supabase-js';
import { env } from '@/lib/env';
import { createServiceRoleClient } from '@/lib/supabase/admin';

const SIGNUP_MAX_AGE_MS = 2 * 60 * 60 * 1000;

/** Prefer `user.email`; fall back to email provider identity (some projects populate only there). */
function resolveAuthUserEmail(u: User): string | null {
  const direct = u.email?.trim().toLowerCase();
  if (direct) return direct;
  for (const id of u.identities ?? []) {
    const raw = id.identity_data;
    if (raw && typeof raw === 'object' && 'email' in raw) {
      const em = String((raw as { email?: string }).email ?? '')
        .trim()
        .toLowerCase();
      if (em) return em;
    }
  }
  return null;
}

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
  if (userErr) {
    console.error('verifyCheckoutUser getUserById:', userErr.message);
    return {
      ok: false,
      error: 'Could not verify your account. Check SUPABASE_SERVICE_ROLE_KEY, then try signing up again.',
    };
  }
  if (!userData.user) {
    return { ok: false, error: 'Account not found. Please register again.' };
  }
  const u = userData.user;
  const authEmail = resolveAuthUserEmail(u);
  if (!authEmail) {
    return { ok: false, error: 'Your account has no email on file. Contact support.' };
  }
  if (authEmail !== email) {
    console.error('verifyCheckoutUser email mismatch', { authEmail, formEmail: email });
    return {
      ok: false,
      error: 'Email does not match this signup. Close the tab and register again with one email.',
    };
  }
  const createdAt = u.created_at ? new Date(u.created_at).getTime() : 0;
  if (!createdAt || Date.now() - createdAt > SIGNUP_MAX_AGE_MS) {
    return { ok: false, error: 'Session expired; please sign up again.' };
  }

  return { ok: true };
}
