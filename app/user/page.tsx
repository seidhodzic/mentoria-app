import DashboardShell from '@/components/DashboardShell';
import { normalizeRole } from '@/lib/role';
import { ensureUserProfile } from '@/lib/server/ensure-user-profile';
import { requireUser } from '@/lib/server/auth';
import { throwIfSupabaseError } from '@/lib/server/supabase-query';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

const USER_NAV = [
  { label: 'Overview', href: '/user' },
  { label: 'Courses', href: '/user/courses' },
  { label: 'Quizzes', href: '/user/quizzes' },
  { label: 'Materials', href: '/user/materials' },
  { label: 'Sessions', href: '/user/sessions' },
];

export default async function UserPage({
  searchParams,
}: {
  searchParams?: { locked?: string };
}) {
  const { supabase, user } = await requireUser();

  const ensured = await ensureUserProfile(supabase, user);
  if (!ensured.ok) {
    throw new Error(
      `We could not load your member profile (${ensured.message}). Sign out and try again, or contact support.`
    );
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, status, email')
    .eq('id', user.id)
    .single();

  if (!profile) {
    throw new Error('Profile is still unavailable after setup. Please refresh or contact support.');
  }
  if (normalizeRole(profile.role) === 'admin') redirect('/admin');
  if (normalizeRole(profile.role) === 'mentor') redirect('/mentor');

  const { data: materials, error: materialsError } = await supabase
    .from('materials')
    .select('id, title, description')
    .limit(4);

  throwIfSupabaseError(materialsError, 'materials');

  return (
    <DashboardShell
      title={`Welcome, ${profile.full_name?.split(' ')[0] ?? 'Member'}`}
      eyebrow="Members Dashboard"
      subtitle="Access your courses, quizzes, materials and mentor sessions."
      userName={profile.full_name ?? profile.email ?? ''}
      userRole="user"
      navItems={USER_NAV}
      activeNav="/user"
      stats={[
        { label: 'Courses', value: '—', sub: 'coming in Phase 3' },
        { label: 'Quizzes Completed', value: '—', sub: 'coming in Phase 4' },
        { label: 'Materials', value: String(materials?.length ?? 0), sub: 'available to download' },
        { label: 'Sessions Booked', value: '—', sub: 'coming in Phase 6' },
      ]}
    >
      {searchParams?.locked === '1' && (
        <div className="alert alert-warning" style={{ marginBottom: 28 }}>
          Courses, quizzes, materials and sessions are part of full membership. Complete subscription checkout (from
          registration or billing) to unlock everything — you can apply a VIP promo code on the Stripe payment page when
          available.
        </div>
      )}
      {profile.status === 'pending' && (
        <div className="alert alert-warning" style={{ marginBottom: 28 }}>
          Your account is pending until subscription checkout completes. Use the same email to finish payment, or sign up
          again.
        </div>
      )}
      <div className="section-header" style={{ marginBottom: 16 }}>
        <h2>Platform Features</h2>
      </div>
      <div className="cards-grid">
        <a href="/user/courses" className="action-card">
          <div className="icon-wrap">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F7BC15" strokeWidth="1.8" strokeLinecap="round">
              <path d="M22 10H2M22 10V20a2 2 0 01-2 2H4a2 2 0 01-2-2V10M22 10L12 3 2 10" />
            </svg>
          </div>
          <h3>Courses</h3>
          <p>Access premium learning courses.</p>
        </a>
        <a href="/user/quizzes" className="action-card">
          <div className="icon-wrap">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F7BC15" strokeWidth="1.8" strokeLinecap="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M9.5 9a2.5 2.5 0 015 0c0 2-2.5 3-2.5 4" />
              <circle cx="12" cy="17" r=".5" fill="#F7BC15" />
            </svg>
          </div>
          <h3>Quizzes</h3>
          <p>Test your knowledge with expert quizzes.</p>
        </a>
        <a href="/user/materials" className="action-card">
          <div className="icon-wrap">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F7BC15" strokeWidth="1.8" strokeLinecap="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
          </div>
          <h3>Materials</h3>
          <p>Download premium templates and guides.</p>
        </a>
        <a href="/user/sessions" className="action-card">
          <div className="icon-wrap">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F7BC15" strokeWidth="1.8" strokeLinecap="round">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
            </svg>
          </div>
          <h3>Mentor Sessions</h3>
          <p>Book sessions with your mentor.</p>
        </a>
      </div>
    </DashboardShell>
  );
}
