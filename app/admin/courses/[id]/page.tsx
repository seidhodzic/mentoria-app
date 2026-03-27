import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { normalizeRole } from '@/lib/role';
import AdminLessonsClient from './AdminLessonsClient';

export default async function AdminLessonsPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
  if (normalizeRole(profile?.role) !== 'admin') redirect('/dashboard');
  const { data: course } = await supabase.from('courses').select('*').eq('id', params.id).single();
  if (!course) redirect('/admin/courses');
  const { data: lessons } = await supabase.from('lessons').select('*').eq('course_id', params.id).order('sort_order');
  return <AdminLessonsClient course={course} lessons={lessons ?? []} userId={session.user.id} />;
}
