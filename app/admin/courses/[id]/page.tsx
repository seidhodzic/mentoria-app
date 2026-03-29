import AdminLessonsClient from '@/features/courses/components/AdminLessonsClient';
import { getDashboardPath, normalizeRole } from '@/lib/role';
import { requireUser } from '@/lib/server/auth';
import { throwIfSupabaseError } from '@/lib/server/supabase-query';
import { redirect } from 'next/navigation';

export default async function AdminLessonsPage({ params }: { params: { id: string } }) {
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

  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('*')
    .eq('id', params.id)
    .single();

  throwIfSupabaseError(courseError, 'course', { ignoreCodes: ['PGRST116'] });
  if (!course) redirect('/admin/courses');

  const { data: lessons, error: lessonsError } = await supabase
    .from('lessons')
    .select('*')
    .eq('course_id', params.id)
    .order('sort_order');

  throwIfSupabaseError(lessonsError, 'lessons');

  return <AdminLessonsClient course={course} lessons={lessons ?? []} userId={user.id} />;
}
