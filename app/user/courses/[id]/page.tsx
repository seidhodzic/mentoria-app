import CoursePlayer from '@/features/courses/components/CoursePlayer';
import { memberHasPremiumAccess } from '@/lib/member-entitlement';
import { requireUser } from '@/lib/server/auth';
import { throwIfSupabaseError } from '@/lib/server/supabase-query';
import { redirect } from 'next/navigation';

export default async function CoursePage({ params }: { params: { id: string } }) {
  const { supabase, user } = await requireUser();

  const { data: profileRow, error: profileErr } = await supabase
    .from('profiles')
    .select('role, signup_access_type, status, is_active, subscription_status')
    .eq('id', user.id)
    .single();

  throwIfSupabaseError(profileErr, 'profile', { ignoreCodes: ['PGRST116'] });

  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('*')
    .eq('id', params.id)
    .eq('is_published', true)
    .single();

  throwIfSupabaseError(courseError, 'course', { ignoreCodes: ['PGRST116'] });
  if (!course) redirect('/user/courses');

  const { data: lessons, error: lessonsError } = await supabase
    .from('lessons')
    .select('*')
    .eq('course_id', params.id)
    .order('sort_order');

  throwIfSupabaseError(lessonsError, 'lessons');

  const { data: progressRows, error: progressError } = await supabase
    .from('progress')
    .select('*')
    .eq('user_id', user.id);

  throwIfSupabaseError(progressError, 'progress');

  const { data: subRows, error: subError } = await supabase
    .from('subscriptions')
    .select('status')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1);

  throwIfSupabaseError(subError, 'subscriptions');

  const subscriptionActive = memberHasPremiumAccess(profileRow, subRows?.[0]?.status ?? null);

  return (
    <CoursePlayer
      course={course}
      lessons={lessons ?? []}
      initialProgress={progressRows ?? []}
      subscriptionActive={subscriptionActive}
    />
  );
}
