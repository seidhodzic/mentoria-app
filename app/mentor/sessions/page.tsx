import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { normalizeRole } from '@/lib/role';
import MentorSessionsClient from './MentorSessionsClient';

export default async function MentorSessionsPage() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');
  const { data: profile } = await supabase.from('profiles').select('role, full_name').eq('id', session.user.id).single();
  if (normalizeRole(profile?.role) !== 'mentor' && normalizeRole(profile?.role) !== 'admin') redirect('/dashboard');

  const { data: sessions } = await supabase
    .from('sessions')
    .select('*, profiles!sessions_user_id_fkey(full_name, email)')
    .eq('mentor_id', session.user.id)
    .order('scheduled_at', { ascending: true });

  const { data: requests } = await supabase
    .from('session_requests')
    .select('*, profiles!session_requests_user_id_fkey(full_name, email)')
    .eq('mentor_id', session.user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  const { data: allUsers } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('role', 'user')
    .eq('status', 'active');

  return <MentorSessionsClient
    mentorId={session.user.id}
    mentorName={profile?.full_name ?? ''}
    sessions={sessions ?? []}
    requests={requests ?? []}
    users={allUsers ?? []}
  />;
}
