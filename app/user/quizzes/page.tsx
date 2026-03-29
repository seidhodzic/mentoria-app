import UserQuizzesClient from '@/features/quizzes/components/UserQuizzesClient';
import { requireUser } from '@/lib/server/auth';
import { throwIfSupabaseError } from '@/lib/server/supabase-query';

export default async function UserQuizzesPage() {
  const { supabase, user } = await requireUser();

  const { data: attempts, error: attemptsError } = await supabase
    .from('quiz_attempts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10);

  throwIfSupabaseError(attemptsError, 'quiz_attempts');

  return <UserQuizzesClient userId={user.id} attempts={attempts ?? []} />;
}
