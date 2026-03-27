import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import Link from 'next/link';
import CourseLessonClient from './CourseLessonClient';

export default async function CoursePage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');

  const { data: course } = await supabase.from('courses').select('*').eq('id', params.id).eq('is_published', true).single();
  if (!course) redirect('/user/courses');

  const { data: lessons } = await supabase.from('lessons').select('*').eq('course_id', params.id).order('sort_order');
  const { data: progressRows } = await supabase.from('progress').select('*').eq('user_id', session.user.id);

  return (
    <CourseLessonClient
      course={course}
      lessons={lessons ?? []}
      progressRows={progressRows ?? []}
      userId={session.user.id}
    />
  );
}
