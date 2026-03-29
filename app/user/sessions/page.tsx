import UserSessionsClient from '@/features/sessions/components/UserSessionsClient';
import { requireUser } from '@/lib/server/auth';
import { throwIfSupabaseError } from '@/lib/server/supabase-query';

export default async function UserSessionsPage() {
  const { supabase, user } = await requireUser();

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', user.id)
    .single();

  throwIfSupabaseError(profileError, 'profile', { ignoreCodes: ['PGRST116'] });

  const { data: mySessions, error: mySessionsError } = await supabase
    .from('sessions')
    .select('*, profiles!sessions_mentor_id_fkey(full_name, email)')
    .eq('user_id', user.id)
    .order('scheduled_at', { ascending: true });

  throwIfSupabaseError(mySessionsError, 'sessions');

  const { data: groupSessions, error: groupSessionsError } = await supabase
    .from('sessions')
    .select('*, profiles!sessions_mentor_id_fkey(full_name, email)')
    .eq('type', 'group')
    .eq('status', 'scheduled')
    .order('scheduled_at', { ascending: true });

  throwIfSupabaseError(groupSessionsError, 'group sessions');

  const { data: myRequests, error: myRequestsError } = await supabase
    .from('session_requests')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  throwIfSupabaseError(myRequestsError, 'session_requests');

  const { data: mentors, error: mentorsError } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('role', 'mentor')
    .eq('status', 'active');

  throwIfSupabaseError(mentorsError, 'mentors');

  return (
    <UserSessionsClient
      userId={user.id}
      userName={profile?.full_name ?? ''}
      mySessions={mySessions ?? []}
      groupSessions={groupSessions ?? []}
      myRequests={myRequests ?? []}
      mentors={mentors ?? []}
    />
  );
}
