import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { normalizeRole } from '@/lib/role';
import DashboardShell from '@/components/DashboardShell';
import { throwIfSupabaseError } from '@/lib/server/supabase-query';

const ADMIN_NAV = [
  { label: 'Overview', href: '/admin' },
  { label: 'Users', href: '/admin/users' },
  { label: 'Materials', href: '/admin/materials' },
  { label: 'Courses', href: '/admin/courses' },
  { label: 'Quizzes', href: '/admin/quizzes' },
  { label: 'Subscriptions', href: '/admin/subscriptions' },
];

export default async function AdminPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, full_name, status')
    .eq('id', user.id)
    .single();

  throwIfSupabaseError(profileError, 'profile', { ignoreCodes: ['PGRST116'] });

  if (normalizeRole(profile?.role) !== 'admin') {
    redirect('/dashboard');
  }

  const [
    { count: totalUsers, error: totalUsersError },
    { count: pendingUsers, error: pendingUsersError },
    { count: totalMaterials, error: totalMaterialsError },
    { count: totalQuizzes, error: totalQuizzesError },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('materials').select('*', { count: 'exact', head: true }),
    supabase.from('quizzes').select('*', { count: 'exact', head: true }),
  ]);

  throwIfSupabaseError(totalUsersError, 'profiles count');
  throwIfSupabaseError(pendingUsersError, 'pending profiles count');
  throwIfSupabaseError(totalMaterialsError, 'materials count');
  throwIfSupabaseError(totalQuizzesError, 'quizzes count');

  const { data: recentUsers, error: recentUsersError } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, status, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  throwIfSupabaseError(recentUsersError, 'recent users');

  return (
    <DashboardShell
      title="Admin Dashboard"
      eyebrow="Platform Management"
      subtitle="Manage users, content, subscriptions and platform operations."
      userName={profile?.full_name ?? user.email ?? ''}
      userRole="admin"
      navItems={ADMIN_NAV}
      activeNav="/admin"
      stats={[
        { label: 'Total Members', value: String(totalUsers ?? 0), sub: 'registered accounts' },
        { label: 'Pending Approval', value: String(pendingUsers ?? 0), sub: 'awaiting activation' },
        { label: 'Materials', value: String(totalMaterials ?? 0), sub: 'uploaded resources' },
        { label: 'Quizzes', value: String(totalQuizzes ?? 0), sub: 'active quizzes' },
      ]}
    >
      <div className="section-header" style={{ marginBottom: 16 }}>
        <h2>Quick Actions</h2>
      </div>
      <div className="cards-grid" style={{ marginBottom: 36 }}>
        <a href="/admin/users" className="action-card">
          <div className="icon-wrap">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F7BC15" strokeWidth="1.8" strokeLinecap="round">
              <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
            </svg>
          </div>
          <h3>User Management</h3>
          <p>Approve registrations, assign roles, manage account status.</p>
        </a>
        <a href="/admin/materials" className="action-card">
          <div className="icon-wrap">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F7BC15" strokeWidth="1.8" strokeLinecap="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="8" y1="13" x2="16" y2="13"/>
              <line x1="8" y1="17" x2="12" y2="17"/>
            </svg>
          </div>
          <h3>Content Control</h3>
          <p>Upload learning materials, modules and resources.</p>
        </a>
        <a href="/admin/quizzes" className="action-card">
          <div className="icon-wrap">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F7BC15" strokeWidth="1.8" strokeLinecap="round">
              <circle cx="12" cy="12" r="9"/>
              <path d="M9.5 9a2.5 2.5 0 015 0c0 2-2.5 3-2.5 4"/>
              <circle cx="12" cy="17" r=".5" fill="#F7BC15"/>
            </svg>
          </div>
          <h3>Quiz Builder</h3>
          <p>Create and manage quizzes assigned to courses.</p>
        </a>
        <a href="/admin/subscriptions" className="action-card">
          <div className="icon-wrap">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F7BC15" strokeWidth="1.8" strokeLinecap="round">
              <rect x="2" y="5" width="20" height="14" rx="2"/>
              <line x1="2" y1="10" x2="22" y2="10"/>
            </svg>
          </div>
          <h3>Billing Monitor</h3>
          <p>Track subscriptions, payments and plan changes.</p>
        </a>
      </div>

      <div className="section-header">
        <h2>Recent Registrations</h2>
        <a href="/admin/users" className="btn btn-outline btn-sm">View All</a>
      </div>
      <div className="table-wrap">
        {recentUsers && recentUsers.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers.map((u) => (
                <tr key={u.id}>
                  <td>{u.full_name ?? '—'}</td>
                  <td>{u.email}</td>
                  <td><span className={`badge badge-${u.role}`}>{u.role}</span></td>
                  <td><span className={`badge badge-${u.status}`}>{u.status}</span></td>
                  <td style={{ fontFamily: "'Saira', sans-serif", color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 400 }}>
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <h3>No users yet</h3>
            <p>New registrations will appear here.</p>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
