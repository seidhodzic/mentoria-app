import AdminCoursesClient from '@/features/courses/components/AdminCoursesClient';
import { getDashboardPath, normalizeRole } from '@/lib/role';
import { requireUser } from '@/lib/server/auth';
import { throwIfSupabaseError } from '@/lib/server/supabase-query';
import { redirect } from 'next/navigation';

export default async function AdminCoursesPage() {
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

  const { data: courses, error: coursesError } = await supabase
    .from('courses')
    .select('*, lessons(count)')
    .order('created_at', { ascending: false });

  throwIfSupabaseError(coursesError, 'courses');

  return <AdminCoursesClient courses={courses ?? []} userId={user.id} />;
}
