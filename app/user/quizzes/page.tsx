import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import UserQuizzesClient from './UserQuizzesClient';

export default async function UserQuizzesPage() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');

  const { data: attempts } = await supabase
    .from('quiz_attempts')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })
    .limit(10);

  return <UserQuizzesClient userId={session.user.id} attempts={attempts ?? []} />;
}
