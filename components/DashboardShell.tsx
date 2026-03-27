import Link from 'next/link';
import SignOutButton from './SignOutButton';
import AIAssistant from './AIAssistant';

type NavItem = { label: string; href: string };
type Stat = { label: string; value: string; sub?: string };

interface Props {
  title: string; eyebrow: string; subtitle?: string;
  userName?: string; userRole?: string;
  navItems: NavItem[]; stats?: Stat[];
  children: React.ReactNode; activeNav?: string;
}

export default function DashboardShell({
  title, eyebrow, subtitle, userName, userRole,
  navItems, stats, children, activeNav,
}: Props) {
  return (
    <div className="dash-layout">
      <header className="dash-header">
        <Link href="/dashboard" className="dash-brand">Mentor<span>ia</span></Link>
        <nav className="dash-nav">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href as any}
              className={activeNav === item.href ? 'active' : ''}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="dash-header-right">
          {userName && (
            <div className="dash-user-pill">
              {userRole && (
                <span className="role-badge" style={{
                  background: userRole==='admin'?'var(--teal)':userRole==='mentor'?'var(--gold)':'rgba(25,53,62,0.15)',
                  color: userRole==='mentor'?'var(--teal)':'var(--white)',
                }}>
                  {userRole}
                </span>
              )}
              <span className="name">{userName}</span>
            </div>
          )}
          <SignOutButton />
        </div>
      </header>

      <div className="dash-content">
        <div className="page-header">
          <div className="eyebrow">{eyebrow}</div>
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>

        {stats && stats.length > 0 && (
          <div className="stats-grid">
            {stats.map((s) => (
              <div key={s.label} className="stat-card">
                <div className="stat-label">{s.label}</div>
                <div className="stat-value">{s.value}</div>
                {s.sub && <div className="stat-sub">{s.sub}</div>}
              </div>
            ))}
          </div>
        )}

        {children}
      </div>

      {/* AI Assistant — available on every dashboard page */}
      <AIAssistant userName={userName} userRole={userRole} />
    </div>
  );
}
