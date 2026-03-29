import AIAssistant from './AIAssistant';
import DashboardHeader from '@/components/layout/DashboardHeader';

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
      <DashboardHeader
        navItems={navItems}
        activeNav={activeNav}
        userName={userName}
        userRole={userRole}
      />

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
