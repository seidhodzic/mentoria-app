import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { normalizeRole } from '@/lib/role';
import AdminCoursesClient from './AdminCoursesClient';

export default async function AdminCoursesPage() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
  if (normalizeRole(profile?.role) !== 'admin') redirect('/dashboard');
  const { data: courses } = await supabase
    .from('courses')
    .select('*, lessons(count)')
    .order('created_at', { ascending: false });
  return <AdminCoursesClient courses={courses ?? []} userId={session.user.id} />;
}
