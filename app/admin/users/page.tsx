import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { normalizeRole } from '@/lib/role';
import AdminUsersClient from './AdminUsersClient';

export default async function AdminUsersPage() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (normalizeRole(profile?.role) !== 'admin') redirect('/dashboard');

  const { data: users } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, status, created_at, updated_at')
    .order('created_at', { ascending: false });

  return <AdminUsersClient users={users ?? []} />;
}
