import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import Link from 'next/link';

export default async function UserCoursesPage() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');

  const { data: courses } = await supabase
    .from('courses')
    .select('*, lessons(count)')
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  const { data: progressRows } = await supabase
    .from('progress')
    .select('lesson_id, completed')
    .eq('user_id', session.user.id)
    .eq('completed', true);

  const completedIds = new Set((progressRows ?? []).map(p => p.lesson_id));

  return (
    <div className="dash-layout">
      <header className="dash-header">
        <Link href="/dashboard" className="dash-brand">Mentor<span>ia</span></Link>
        <nav className="dash-nav">
          <Link href="/user">Overview</Link>
          <Link href="/user/courses" className="active">Courses</Link>
          <Link href="/user/materials">Materials</Link>
          <Link href="/user/quizzes">Quizzes</Link>
          <Link href="/user/sessions">Sessions</Link>
        </nav>
        <div className="dash-header-right">
          <Link href="/user" className="btn btn-outline btn-sm" style={{ color: 'rgba(255,255,255,0.6)', borderColor: 'rgba(255,255,255,0.2)' }}>← Dashboard</Link>
        </div>
      </header>
      <div className="dash-content">
        <div className="page-header">
          <div className="eyebrow">Members — Learning</div>
          <h1>Courses</h1>
          <p>Access your premium courses and track your progress.</p>
        </div>
        {courses && courses.length > 0 ? (
          <div className="cards-grid">
            {courses.map(course => {
              const lessonCount = course.lessons?.[0]?.count ?? 0;
              return (
                <Link key={course.id} href={`/user/courses/${course.id}` as any} className="action-card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div className="icon-wrap" style={{ margin: 0 }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F7BC15" strokeWidth="1.8" strokeLinecap="round">
                        <path d="M22 10H2M22 10V20a2 2 0 01-2 2H4a2 2 0 01-2-2V10M22 10L12 3 2 10"/>
                      </svg>
                    </div>
                    <span className="badge badge-user">{course.category ?? 'general'}</span>
                  </div>
                  <h3 style={{ marginBottom: 8 }}>{course.title}</h3>
                  {course.description && <p style={{ marginBottom: 12, fontSize: '0.82rem' }}>{course.description}</p>}
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    {lessonCount} lesson{lessonCount !== 1 ? 's' : ''}
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <h3>No courses available yet</h3>
            <p>Your admin is preparing courses. Check back soon.</p>
          </div>
        )}
      </div>
    </div>
  );
}
