import MentorSessionsClient from '@/features/sessions/components/MentorSessionsClient';
import { normalizeRole } from '@/lib/role';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/server/auth';

export default async function MentorSessionsPage() {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase.from('profiles').select('role, full_name').eq('id', user.id).single();
  if (normalizeRole(profile?.role) !== 'mentor' && normalizeRole(profile?.role) !== 'admin') redirect('/dashboard');

  const { data: sessions } = await supabase
    .from('sessions')
    .select('*, profiles!sessions_user_id_fkey(full_name, email)')
    .eq('mentor_id', user.id)
    .order('scheduled_at', { ascending: true });

  const { data: requests } = await supabase
    .from('session_requests')
    .select('*, profiles!session_requests_user_id_fkey(full_name, email)')
    .eq('mentor_id', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  const { data: allUsers } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('role', 'user')
    .eq('status', 'active');

  return (
    <MentorSessionsClient
      mentorId={user.id}
      mentorName={profile?.full_name ?? ''}
      sessions={sessions ?? []}
      requests={requests ?? []}
      users={allUsers ?? []}
    />
  );
}
