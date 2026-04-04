import AdminUsersClient from '@/features/admin-users/components/AdminUsersClient';
import { buildAdminUserRows } from '@/lib/admin-user-display';
import { getDashboardPath, normalizeRole } from '@/lib/role';
import { requireUser } from '@/lib/server/auth';
import { throwIfSupabaseError } from '@/lib/server/supabase-query';
import type { AdminSubscriptionSnapshot } from '@/features/admin-users/types';
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

  const { data: users, error: usersError } = await supabase
    .from('profiles')
    .select(
      'id, email, full_name, role, status, profile_type, position, signup_access_type, signup_plan_key, is_active, stripe_customer_id, stripe_price_id, subscription_status, subscription_current_period_end, created_at, updated_at'
    )
    .order('created_at', { ascending: false });

  throwIfSupabaseError(usersError, 'users');

  const { data: subs, error: subsError } = await supabase
    .from('subscriptions')
    .select('user_id, plan, status, stripe_subscription_id, stripe_customer_id, current_period_end');

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

  const rows = buildAdminUserRows(users ?? [], map);

  const userDeletionEnabled = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

  return (
    <AdminUsersClient
      users={rows}
      currentAdminId={user.id}
      userDeletionEnabled={userDeletionEnabled}
    />
  );
}
