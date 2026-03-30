import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { getDashboardPath, normalizeRole } from '@/lib/role';
import { throwIfSupabaseError } from '@/lib/server/supabase-query';
import DashboardShell from '@/components/DashboardShell';

const ADMIN_NAV = [
  { label: 'Overview', href: '/admin' },
  { label: 'Users', href: '/admin/users' },
  { label: 'Materials', href: '/admin/materials' },
  { label: 'Courses', href: '/admin/courses' },
  { label: 'Quizzes', href: '/admin/quizzes' },
  { label: 'Subscriptions', href: '/admin/subscriptions' },
];

export default async function AdminSubscriptionsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single();

  throwIfSupabaseError(profileError, 'profile', { ignoreCodes: ['PGRST116'] });

  if (normalizeRole(profile?.role) !== 'admin') {
    redirect(getDashboardPath(normalizeRole(profile?.role)));
  }

  return (
    <DashboardShell
      title="Subscriptions"
      eyebrow="Admin — Billing"
      subtitle="Track subscriptions, payments and plan changes."
      userName={profile?.full_name ?? user.email ?? ''}
      userRole="admin"
      navItems={ADMIN_NAV}
      activeNav="/admin/subscriptions"
    >
      <div className="alert alert-info" style={{ marginBottom: 28 }}>
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 2 }}>
          <circle cx="10" cy="10" r="7" />
          <path d="M10 7v4M10 13v.5" />
        </svg>
        Stripe billing dashboard is coming in Phase 5. Subscription data will appear here once connected.
      </div>
      <div className="cards-grid">
        <div className="action-card" style={{ cursor: 'default' }}>
          <div className="icon-wrap">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F7BC15" strokeWidth="1.8" strokeLinecap="round">
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
          </div>
          <h3>Active Subscriptions</h3>
          <p>View and manage active member subscription plans.</p>
        </div>
        <div className="action-card" style={{ cursor: 'default' }}>
          <div className="icon-wrap">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F7BC15" strokeWidth="1.8" strokeLinecap="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <h3>Payment History</h3>
          <p>Full audit trail of all transactions and invoices.</p>
        </div>
        <div className="action-card" style={{ cursor: 'default' }}>
          <div className="icon-wrap">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F7BC15" strokeWidth="1.8" strokeLinecap="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <h3>Plan Management</h3>
          <p>Configure subscription tiers, pricing and access levels.</p>
        </div>
      </div>
    </DashboardShell>
  );
}
