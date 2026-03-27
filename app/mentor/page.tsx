import { redirect } from 'next/navigation';
import DashboardShell from '@/components/DashboardShell';
import { createClient } from '@/lib/supabase-server';
import { normalizeRole } from '@/lib/role';

export default async function MentorPage() {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) redirect('/login');
  if (normalizeRole(user.user_metadata.role as string | undefined) !== 'mentor') redirect('/dashboard');

  return (
    <DashboardShell
      title="Mentor Dashboard"
      subtitle="Manage mentees, resources, and session planning."
      stats={[
        { label: 'Assigned users', value: '18' },
        { label: 'Upcoming sessions', value: '4' },
        { label: 'Published resources', value: '23' }
      ]}
    >
      <div className="cards">
        <div className="card"><h3>Mentee Overview</h3><p>Review athlete progress, notes, and next actions.</p></div>
        <div className="card"><h3>Content Publishing</h3><p>Upload materials and assign resources by topic.</p></div>
        <div className="card"><h3>Scheduling</h3><p>Prepare sessions, office hours, and follow-up tasks.</p></div>
      </div>
    </DashboardShell>
  );
}
