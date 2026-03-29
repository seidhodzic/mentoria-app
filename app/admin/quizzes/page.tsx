import DashboardHeader from '@/components/layout/DashboardHeader';
import SignOutButton from '@/components/SignOutButton';
import { normalizeRole } from '@/lib/role';
import { requireUser } from '@/lib/server/auth';
import { throwIfSupabaseError } from '@/lib/server/supabase-query';
import { redirect } from 'next/navigation';

export default async function AdminQuizzesPage() {
  const { supabase, user } = await requireUser();
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  throwIfSupabaseError(profileError, 'profile', { ignoreCodes: ['PGRST116'] });

  if (normalizeRole(profile?.role) !== 'admin') redirect('/dashboard');

  const { data: attempts, error: attemptsError } = await supabase
    .from('quiz_attempts')
    .select('*, profiles(email, full_name)')
    .order('created_at', { ascending: false })
    .limit(50);

  throwIfSupabaseError(attemptsError, 'quiz_attempts');

  const totalAttempts = attempts?.length ?? 0;
  const avgScore =
    attempts && attempts.length > 0
      ? Math.round(attempts.reduce((sum, a) => sum + Math.round((a.score / a.total) * 100), 0) / attempts.length)
      : 0;
  const passRate =
    attempts && attempts.length > 0
      ? Math.round((attempts.filter((a) => Math.round((a.score / a.total) * 100) >= 70).length / attempts.length) * 100)
      : 0;

  const ADMIN_NAV = [
    { label: 'Overview', href: '/admin' },
    { label: 'Users', href: '/admin/users' },
    { label: 'Materials', href: '/admin/materials' },
    { label: 'Courses', href: '/admin/courses' },
    { label: 'Quizzes', href: '/admin/quizzes' },
    { label: 'Subscriptions', href: '/admin/subscriptions' },
  ];

  return (
    <div className="dash-layout">
      <DashboardHeader navItems={ADMIN_NAV} activeNav="/admin/quizzes">
        <SignOutButton />
      </DashboardHeader>
      <div className="dash-content">
        <div className="page-header">
          <div className="eyebrow">Admin — Quiz Analytics</div>
          <h1>Quiz Performance</h1>
          <p>Monitor member quiz attempts and performance across the platform.</p>
        </div>

        <div className="stats-grid" style={{ marginBottom: 28 }}>
          <div className="stat-card">
            <div className="stat-label">Total Attempts</div>
            <div className="stat-value">{totalAttempts}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Average Score</div>
            <div className="stat-value">{avgScore}%</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Pass Rate (≥70%)</div>
            <div className="stat-value">{passRate}%</div>
          </div>
        </div>

        <div className="table-wrap">
          {attempts && attempts.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Score</th>
                  <th>Result</th>
                  <th>Questions</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((a) => {
                  const p = Math.round((a.score / a.total) * 100);
                  const profile = a.profiles as any;
                  return (
                    <tr key={a.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{profile?.full_name ?? '—'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{profile?.email}</div>
                      </td>
                      <td style={{ fontWeight: 700 }}>
                        {a.score}/{a.total}
                      </td>
                      <td>
                        <span className={`badge ${p >= 70 ? 'badge-active' : p >= 50 ? 'badge-pending' : 'badge-suspended'}`}>{p}%</span>
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>{a.total}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{new Date(a.created_at).toLocaleDateString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <h3>No quiz attempts yet</h3>
              <p>Attempts will appear here once members start taking quizzes.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
