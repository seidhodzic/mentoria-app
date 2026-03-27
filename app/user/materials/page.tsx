import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import Link from 'next/link';

export default async function UserMaterialsPage() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');
  const { data: materials } = await supabase
    .from('materials')
    .select('*')
    .order('created_at', { ascending: false });

  const categories = [...new Set((materials ?? []).map(m => m.category ?? 'general'))];

  return (
    <div className="dash-layout">
      <header className="dash-header">
        <Link href="/dashboard" className="dash-brand">Mentor<span>ia</span></Link>
        <nav className="dash-nav">
          <Link href="/user">Overview</Link>
          <Link href="/user/courses">Courses</Link>
          <Link href="/user/materials" className="active">Materials</Link>
          <Link href="/user/quizzes">Quizzes</Link>
          <Link href="/user/sessions">Sessions</Link>
        </nav>
        <div className="dash-header-right">
          <Link href="/user" className="btn btn-outline btn-sm" style={{ color: 'rgba(255,255,255,0.6)', borderColor: 'rgba(255,255,255,0.2)' }}>← Dashboard</Link>
        </div>
      </header>
      <div className="dash-content">
        <div className="page-header">
          <div className="eyebrow">Members — Resources</div>
          <h1>Materials Library</h1>
          <p>Download premium guides, templates and learning resources.</p>
        </div>
        {materials && materials.length > 0 ? (
          <>
            {categories.map(cat => {
              const items = (materials ?? []).filter(m => (m.category ?? 'general') === cat);
              if (!items.length) return null;
              return (
                <div key={cat} style={{ marginBottom: 32 }}>
                  <div className="section-header" style={{ marginBottom: 14 }}>
                    <h2 style={{ fontSize: '1rem', textTransform: 'uppercase' }}>{cat}</h2>
                  </div>
                  <div className="cards-grid">
                    {items.map(m => (
                      <div key={m.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--teal)', marginBottom: 4 }}>{m.title}</div>
                            {m.description && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{m.description}</div>}
                          </div>
                          <span className={`badge ${m.is_premium ? 'badge-admin' : 'badge-active'}`} style={{ flexShrink: 0 }}>
                            {m.is_premium ? 'Premium' : 'Free'}
                          </span>
                        </div>
                        {m.file_name && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>{m.file_name}</div>
                        )}
                        {m.file_url ? (
                          <a href={m.file_url} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-start' }}>
                            Download ↓
                          </a>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>File not available</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </>
        ) : (
          <div className="empty-state">
            <h3>No materials yet</h3>
            <p>Check back soon — your admin is uploading resources.</p>
          </div>
        )}
      </div>
    </div>
  );
}
