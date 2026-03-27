import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { getDashboardPath, normalizeRole } from '@/lib/role';

export default async function DashboardRouterPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const role = normalizeRole(profile?.role ?? user.user_metadata?.role);
  redirect(getDashboardPath(role));
}
