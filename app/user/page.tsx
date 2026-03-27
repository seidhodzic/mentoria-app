import { redirect } from 'next/navigation';
import DashboardShell from '@/components/DashboardShell';
import { createClient } from '@/lib/supabase-server';

export default async function UserPage() {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) redirect('/login');

  return (
    <DashboardShell
      title="User Dashboard"
      subtitle="Access modules, track progress, and manage your career journey."
      stats={[
        { label: 'Modules completed', value: '7' },
        { label: 'Quizzes pending', value: '3' },
        { label: 'Subscription status', value: 'Active' }
      ]}
    >
      <div className="cards">
        <div className="card"><h3>Learning Materials</h3><p>Open courses, guides, and templates.</p></div>
        <div className="card"><h3>Career Plan</h3><p>Track short-term and post-career development goals.</p></div>
        <div className="card"><h3>Account & Billing</h3><p>Update profile details and review subscription settings.</p></div>
      </div>
    </DashboardShell>
  );
}
