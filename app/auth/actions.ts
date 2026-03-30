'use server';

import { revalidatePath } from 'next/cache';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { sendNewSignupNotificationToAdmin } from '@/lib/emails';
import { env } from '@/lib/env';
import {
  startSubscriptionCheckout,
  verifyCheckoutUser,
  type SubscriptionPlanKey,
} from '@/lib/payments';
import { checkRateLimitBucket, checkSignupRateLimit } from '@/lib/server/rate-limit-signup';
import { ensureUserProfile } from '@/lib/server/ensure-user-profile';
import { deleteSupabaseAuthCookieChunks } from '@/lib/supabase/auth-cookie';
import { createServiceRoleClient } from '@/lib/supabase/admin';
import { createClient, createLoginClient } from '@/lib/supabase/server';

/** Reject auth.users rows older than this when verifying signup notifications. */
const SIGNUP_MAX_AGE_MS = 2 * 60 * 60 * 1000;

/**
 * Email/password sign-in on the server so session cookies are written via `setAll`
 * (avoids client-only storage that middleware cannot see).
 */
export async function signInWithPasswordAction(
  formData: FormData
): Promise<{ error?: string } | void> {
  const cookieStore = cookies();
  deleteSupabaseAuthCookieChunks((name) => cookieStore.delete(name));

  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '').trim();
  const remember = formData.get('remember') === 'on';
  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  // 30-day persistent cookie when "Remember me" is checked; session cookie otherwise.
  const supabase = createLoginClient(remember ? 30 * 24 * 60 * 60 : undefined);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: error.message };
  }
  if (!data.user) {
    return { error: 'Sign in failed.' };
  }

  const ensured = await ensureUserProfile(supabase, data.user);
  if (!ensured.ok) {
    return { error: `Profile setup failed: ${ensured.message}` };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, status')
    .eq('id', data.user.id)
    .maybeSingle();

  if (profile?.status === 'suspended') {
    await supabase.auth.signOut();
    return { error: 'Your account has been suspended. Contact support.' };
  }

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}

/**
 * Called after `signUp` succeeds. Uses the service role to confirm the user exists in `auth.users`
 * and matches the given email (works even when email confirmation is on and there is no session).
 * Rate-limited by IP and email; optional shared secret when `SIGNUP_NOTIFY_SECRET` is set.
 */
export async function notifyAdminOfSignup(input: {
  userId: string;
  email: string;
  fullName: string;
  profile_type: string;
  signup_access_type?: string;
  signup_plan_key?: string;
  /** When `SIGNUP_NOTIFY_SECRET` is set, must match it (typically same value as `NEXT_PUBLIC_SIGNUP_NOTIFY_TOKEN`). */
  clientSecret?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const email = input.email.trim().toLowerCase();
  const fullName = input.fullName.trim();
  const profile_type = input.profile_type.trim();
  const signup_access_type = input.signup_access_type?.trim() ?? '';
  const signup_plan_key = input.signup_plan_key?.trim() ?? '';

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

  const h = headers();
  const forwarded = h.get('x-forwarded-for');
  const ip = (forwarded?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown').slice(0, 128);

  const ipRl = await checkRateLimitBucket(`signup-notify-ip:${ip}`, 20, 60 * 60 * 1000);
  if (!ipRl.allowed) {
    return { ok: false, error: 'Too many requests' };
  }
  const emailRl = await checkSignupRateLimit(email);
  if (!emailRl.allowed) {
    return { ok: false, error: 'Too many requests' };
  }

  let admin;
  try {
    admin = createServiceRoleClient();
  } catch {
    return { ok: false, error: 'Server misconfigured' };
  }

  const { data: userData, error: userErr } = await admin.auth.admin.getUserById(input.userId);
  if (userErr || !userData.user) {
    return { ok: false, error: 'Invalid signup' };
  }

  const u = userData.user;
  if (u.email?.toLowerCase() !== email) {
    return { ok: false, error: 'Invalid signup' };
  }

  const createdAt = u.created_at ? new Date(u.created_at).getTime() : 0;
  if (!createdAt || Date.now() - createdAt > SIGNUP_MAX_AGE_MS) {
    return { ok: false, error: 'Invalid signup' };
  }

  const adminEmail = env.adminNotificationEmail;
  if (!adminEmail) {
    return { ok: true };
  }

  if (!process.env.RESEND_API_KEY) {
    console.warn('notifyAdminOfSignup: RESEND_API_KEY not set; skipping email');
    return { ok: true };
  }

  try {
    await sendNewSignupNotificationToAdmin({
      adminEmail,
      memberEmail: email,
      fullName,
      profileType: profile_type,
      accessType: signup_access_type,
      planKey: signup_plan_key,
    });
  } catch (e) {
    console.error('notifyAdminOfSignup email error:', e);
    return { ok: false, error: 'Failed to send notification' };
  }

  return { ok: true };
}

/**
 * Provider-agnostic subscription checkout after sign-up. Verifies the user, then delegates to
 * `startSubscriptionCheckout` (Stripe in test mode by default; swap via `PAYMENT_PROVIDER`).
 */
export async function handleCheckout(input: {
  userId: string;
  email: string;
  planKey: SubscriptionPlanKey;
  /** When `SIGNUP_NOTIFY_SECRET` is set, must match (same pattern as `notifyAdminOfSignup`). */
  clientSecret?: string;
}): Promise<{ url?: string; error?: string }> {
  const verified = await verifyCheckoutUser({
    userId: input.userId,
    email: input.email,
    clientSecret: input.clientSecret,
  });
  if (!verified.ok) {
    return { error: verified.error };
  }
  return startSubscriptionCheckout({
    userId: input.userId,
    email: input.email,
    planKey: input.planKey,
  });
}
