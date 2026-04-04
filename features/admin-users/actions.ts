'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase-server';
import { createServiceRoleClient } from '@/lib/supabase/admin';
import type { UserRoleEnum, UserStatusEnum } from '@/lib/supabase-app-types';
import type { Database } from '@/types/supabase';

type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

const ADMIN_USERS_PATH = '/admin/users';

function isPremiumStripeLike(status: string | null | undefined): boolean {
  if (status == null || status === '') return false;
  const s = status.trim().toLowerCase();
  return s === 'active' || s === 'trialing';
}

async function assertCallerIsAdmin(): Promise<
  | { ok: true; supabase: ReturnType<typeof createClient>; callerId: string }
  | { ok: false; error: string }
> {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { ok: false, error: 'You must be signed in.' };
  }
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (error || !profile || profile.role !== 'admin') {
    return { ok: false, error: 'Forbidden.' };
  }
  return { ok: true, supabase, callerId: user.id };
}

async function countAdmins(supabase: ReturnType<typeof createClient>): Promise<number> {
  const { count, error } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'admin');
  if (error) return 0;
  return count ?? 0;
}

export async function adminUpdateProfileAction(input: {
  targetUserId: string;
  role?: UserRoleEnum;
  status?: UserStatusEnum;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const gate = await assertCallerIsAdmin();
  if (!gate.ok) return gate;

  const { supabase, callerId } = gate;
  const { targetUserId, role, status } = input;

  if (targetUserId === callerId && role != null && role !== 'admin') {
    const admins = await countAdmins(supabase);
    if (admins <= 1) {
      return { ok: false, error: 'Cannot remove the last admin account.' };
    }
  }

  if (role != null) {
    const { data: targetBefore } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', targetUserId)
      .maybeSingle();

    if (targetBefore?.role === 'admin' && role !== 'admin') {
      const admins = await countAdmins(supabase);
      if (admins <= 1) {
        return { ok: false, error: 'Cannot demote the last admin.' };
      }
    }
  }

  const patch: ProfileUpdate = {
    updated_at: new Date().toISOString(),
  };
  if (role != null) patch.role = role;
  if (status != null) patch.status = status;

  if (patch.role === undefined && patch.status === undefined) {
    return { ok: false, error: 'Nothing to update.' };
  }

  const { error } = await supabase.from('profiles').update(patch).eq('id', targetUserId);
  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath(ADMIN_USERS_PATH);
  return { ok: true };
}

export async function adminGrantPremiumAction(input: {
  targetUserId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const gate = await assertCallerIsAdmin();
  if (!gate.ok) return gate;
  const { supabase } = gate;
  const { targetUserId } = input;

  // Do not select/upsert `stripe_price_id` here — older DBs may not have that column yet (006 migration).
  const { data: sub, error: subErr } = await supabase
    .from('subscriptions')
    .select('plan, status, stripe_subscription_id, stripe_customer_id')
    .eq('user_id', targetUserId)
    .maybeSingle();

  if (subErr) {
    return { ok: false, error: subErr.message };
  }

  if (sub?.stripe_subscription_id && sub.plan === 'subscription') {
    return {
      ok: false,
      error:
        'This member has a Stripe-linked subscription row. Resolve or remove it in Stripe before applying an admin grant.',
    };
  }

  if (sub?.plan === 'admin_grant' && isPremiumStripeLike(sub.status)) {
    revalidatePath(ADMIN_USERS_PATH);
    return { ok: true };
  }

  const now = new Date().toISOString();
  const periodEnd = new Date('2099-12-31T23:59:59.000Z').toISOString();

  const { error: upsertErr } = await supabase.from('subscriptions').upsert(
    {
      user_id: targetUserId,
      plan: 'admin_grant',
      status: 'active',
      stripe_subscription_id: null,
      stripe_customer_id: sub?.stripe_customer_id ?? null,
      current_period_end: periodEnd,
    },
    { onConflict: 'user_id' }
  );

  if (upsertErr) {
    return { ok: false, error: upsertErr.message };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('signup_access_type, status')
    .eq('id', targetUserId)
    .maybeSingle();

  const profilePatch: ProfileUpdate = {
    subscription_status: 'active',
    is_active: true,
    updated_at: now,
  };
  if (profile?.signup_access_type !== 'one_time') {
    profilePatch.signup_access_type = 'subscription';
  }
  if (profile?.status === 'pending') {
    profilePatch.status = 'active';
  }
  profilePatch.subscription_current_period_end = periodEnd;

  const { error: profErr } = await supabase.from('profiles').update(profilePatch).eq('id', targetUserId);
  if (profErr) {
    return { ok: false, error: profErr.message };
  }

  revalidatePath(ADMIN_USERS_PATH);
  return { ok: true };
}

export async function adminRevokePremiumAction(input: {
  targetUserId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const gate = await assertCallerIsAdmin();
  if (!gate.ok) return gate;
  const { supabase } = gate;
  const { targetUserId } = input;

  const { data: sub, error: subErr } = await supabase
    .from('subscriptions')
    .select('plan, status, stripe_subscription_id')
    .eq('user_id', targetUserId)
    .maybeSingle();

  if (subErr) {
    return { ok: false, error: subErr.message };
  }

  if (!sub || sub.plan !== 'admin_grant') {
    if (sub?.stripe_subscription_id) {
      return {
        ok: false,
        error: 'This subscription is tied to Stripe. Cancel or change it in Stripe or via the customer portal.',
      };
    }
    return { ok: false, error: 'No admin-granted premium to revoke.' };
  }

  const { data: profile, error: pErr } = await supabase
    .from('profiles')
    .select('signup_access_type, is_active')
    .eq('id', targetUserId)
    .maybeSingle();

  if (pErr) {
    return { ok: false, error: pErr.message };
  }

  const { error: upSubErr } = await supabase
    .from('subscriptions')
    .update({
      status: 'inactive',
      current_period_end: null,
    })
    .eq('user_id', targetUserId);

  if (upSubErr) {
    return { ok: false, error: upSubErr.message };
  }

  const profilePatch: ProfileUpdate = {
    subscription_status: 'inactive',
    subscription_current_period_end: null,
    updated_at: new Date().toISOString(),
  };

  if (profile?.signup_access_type === 'subscription') {
    profilePatch.is_active = false;
  }

  const { error: profErr } = await supabase.from('profiles').update(profilePatch).eq('id', targetUserId);
  if (profErr) {
    return { ok: false, error: profErr.message };
  }

  revalidatePath(ADMIN_USERS_PATH);
  return { ok: true };
}

export async function adminDeleteUserAction(input: {
  targetUserId: string;
  emailConfirmation: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const gate = await assertCallerIsAdmin();
  if (!gate.ok) return gate;

  const { supabase, callerId } = gate;
  const { targetUserId, emailConfirmation } = input;

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      ok: false,
      error: 'Server is missing SUPABASE_SERVICE_ROLE_KEY; user deletion is disabled.',
    };
  }

  if (targetUserId === callerId) {
    return { ok: false, error: 'You cannot delete your own account from this screen.' };
  }

  const { data: target, error: tErr } = await supabase
    .from('profiles')
    .select('email, role')
    .eq('id', targetUserId)
    .maybeSingle();

  if (tErr || !target) {
    return { ok: false, error: tErr?.message ?? 'User not found.' };
  }

  if (target.email.trim().toLowerCase() !== emailConfirmation.trim().toLowerCase()) {
    return { ok: false, error: 'Email confirmation does not match this member.' };
  }

  if (target.role === 'admin') {
    const admins = await countAdmins(supabase);
    if (admins <= 1) {
      return { ok: false, error: 'Cannot delete the last admin account.' };
    }
  }

  let adminApi: ReturnType<typeof createServiceRoleClient>;
  try {
    adminApi = createServiceRoleClient();
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Could not initialize admin client.',
    };
  }

  const { error: delErr } = await adminApi.auth.admin.deleteUser(targetUserId);
  if (delErr) {
    return { ok: false, error: delErr.message };
  }

  revalidatePath(ADMIN_USERS_PATH);
  return { ok: true };
}
