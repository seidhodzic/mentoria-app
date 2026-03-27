import { redirect } from 'next/navigation';
import DashboardShell from '@/components/DashboardShell';
import { createClient } from '@/lib/supabase-server';
import { normalizeRole } from '@/lib/role';

export default async function AdminPage() {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) redirect('/login');
  if (normalizeRole(user.user_metadata.role as string | undefined) !== 'admin') redirect('/dashboard');

  return (
    <DashboardShell
      title="Admin Dashboard"
      subtitle="Manage users, mentors, subscriptions, materials, and platform operations."
      stats={[
        { label: 'New registrations', value: '12' },
        { label: 'Active mentors', value: '5' },
        { label: 'Paid subscriptions', value: '31' }
      ]}
    >
      <div className="cards">
        <div className="card"><h3>User Management</h3><p>Approve users, assign roles, and review account status.</p></div>
        <div className="card"><h3>Content Control</h3><p>Upload learning materials, modules, and quizzes.</p></div>
        <div className="card"><h3>Billing Monitor</h3><p>Track subscription lifecycle and payment exceptions.</p></div>
      </div>
    </DashboardShell>
  );
}
