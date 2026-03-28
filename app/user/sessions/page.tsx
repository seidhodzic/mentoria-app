import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import UserSessionsClient from './UserSessionsClient';

export default async function UserSessionsPage() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('full_name, email').eq('id', session.user.id).single();

  const { data: mySessions } = await supabase
    .from('sessions')
    .select('*, profiles!sessions_mentor_id_fkey(full_name, email)')
    .eq('user_id', session.user.id)
    .order('scheduled_at', { ascending: true });

  const { data: groupSessions } = await supabase
    .from('sessions')
    .select('*, profiles!sessions_mentor_id_fkey(full_name, email)')
    .eq('type', 'group')
    .eq('status', 'scheduled')
    .order('scheduled_at', { ascending: true });

  const { data: myRequests } = await supabase
    .from('session_requests')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false });

  const { data: mentors } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('role', 'mentor')
    .eq('status', 'active');

  return <UserSessionsClient
    userId={session.user.id}
    userName={profile?.full_name ?? ''}
    mySessions={mySessions ?? []}
    groupSessions={groupSessions ?? []}
    myRequests={myRequests ?? []}
    mentors={mentors ?? []}
  />;
}
