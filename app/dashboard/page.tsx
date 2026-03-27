import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { getDashboardPath, normalizeRole } from '@/lib/role';

export default async function DashboardRouterPage() {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect('/login');
  }

  const role = normalizeRole((data.user.user_metadata.role as string | undefined) ?? 'user');
  redirect(getDashboardPath(role));
}
