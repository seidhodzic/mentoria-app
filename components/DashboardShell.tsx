import SignOutButton from './SignOutButton';

type Stat = { label: string; value: string };

export default function DashboardShell({
  title,
  subtitle,
  stats,
  children
}: {
  title: string;
  subtitle: string;
  stats: Stat[];
  children: React.ReactNode;
}) {
  return (
    <div className="dashboard-wrap">
      <div className="dashboard-card" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'start', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ marginTop: 0 }}>{title}</h1>
            <p className="small">{subtitle}</p>
          </div>
          <SignOutButton />
        </div>
      </div>
      <div className="grid-3">
        {stats.map((stat) => (
          <div key={stat.label} className="card">
            <div className="small">{stat.label}</div>
            <h2>{stat.value}</h2>
          </div>
        ))}
      </div>
      {children}
    </div>
  );
}
