import AdminUsersClient from '@/features/admin-users/components/AdminUsersClient';
import { buildAdminUserRows } from '@/lib/admin-user-display';
import { getDashboardPath, normalizeRole } from '@/lib/role';
import { requireUser } from '@/lib/server/auth';
import { throwIfSupabaseError } from '@/lib/server/supabase-query';
import type { AdminSubscriptionSnapshot } from '@/features/admin-users/types';
import type { Tables } from '@/types/supabase';
import { redirect } from 'next/navigation';

export default async function AdminUsersPage() {
  const { supabase, user } = await requireUser();

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  throwIfSupabaseError(profileError, 'profile', { ignoreCodes: ['PGRST116'] });

  if (normalizeRole(profile?.role) !== 'admin') {
    redirect(getDashboardPath(normalizeRole(profile?.role)));
  }

  // Use `*` so PostgREST returns whatever columns exist in the remote DB. A fixed column list
  // breaks production when migrations lag behind generated types (unknown column → 400 → throw).
  const { data: users, error: usersError } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  throwIfSupabaseError(usersError, 'users');

  const { data: subs, error: subsError } = await supabase.from('subscriptions').select('*');

  throwIfSupabaseError(subsError, 'subscriptions');

  const map = new Map<string, AdminSubscriptionSnapshot>();
  for (const row of subs ?? []) {
    map.set(row.user_id, {
      plan: row.plan,
      status: row.status,
      stripe_subscription_id: row.stripe_subscription_id,
      stripe_customer_id: row.stripe_customer_id,
      current_period_end: row.current_period_end,
    });
  }

  // Cast: omit optional columns (e.g. `position`) when DB schema lags generated types.
  const rows = buildAdminUserRows((users ?? []) as Tables<'profiles'>[], map);

  const userDeletionEnabled = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

  return (
    <AdminUsersClient
      users={rows}
      currentAdminId={user.id}
      userDeletionEnabled={userDeletionEnabled}
    />
  );
}
