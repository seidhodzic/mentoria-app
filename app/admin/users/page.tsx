import AdminUsersClient from '@/features/admin-users/components/AdminUsersClient';
import { normalizeRole } from '@/lib/role';
import { requireUser } from '@/lib/server/auth';
import { throwIfSupabaseError } from '@/lib/server/supabase-query';
import { redirect } from 'next/navigation';

export default async function AdminUsersPage() {
  const { supabase, user } = await requireUser();

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  throwIfSupabaseError(profileError, 'profile', { ignoreCodes: ['PGRST116'] });

  if (normalizeRole(profile?.role) !== 'admin') redirect('/dashboard');

  const { data: users, error: usersError } = await supabase
    .from('profiles')
    .select(
      'id, email, full_name, role, status, profile_type, signup_access_type, signup_plan_key, is_active, stripe_customer_id, created_at, updated_at'
    )
    .order('created_at', { ascending: false });

  throwIfSupabaseError(usersError, 'users');

  return <AdminUsersClient users={users ?? []} />;
}
