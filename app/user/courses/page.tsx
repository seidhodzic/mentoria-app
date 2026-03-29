import DashboardHeader from '@/components/layout/DashboardHeader';
import { requireUser } from '@/lib/server/auth';
import { throwIfSupabaseError } from '@/lib/server/supabase-query';
import Link from 'next/link';

const USER_NAV = [
  { label: 'Overview', href: '/user' },
  { label: 'Courses', href: '/user/courses' },
  { label: 'Materials', href: '/user/materials' },
  { label: 'Quizzes', href: '/user/quizzes' },
  { label: 'Sessions', href: '/user/sessions' },
];

export default async function UserCoursesPage() {
  const { supabase } = await requireUser();

  const { data: courses, error: coursesError } = await supabase
    .from('courses')
    .select('*, lessons(count)')
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  throwIfSupabaseError(coursesError, 'courses');

  return (
    <div className="dash-layout">
      <DashboardHeader
        navItems={USER_NAV}
        activeNav="/user/courses"
      >
        <Link
          href="/user"
          className="btn btn-outline btn-sm"
          style={{ color: 'rgba(255,255,255,0.6)', borderColor: 'rgba(255,255,255,0.2)' }}
        >
          ← Dashboard
        </Link>
      </DashboardHeader>
      <div className="dash-content">
        <div className="page-header">
          <div className="eyebrow">Members — Learning</div>
          <h1>Courses</h1>
          <p>Access your premium courses and track your progress.</p>
        </div>
        {courses && courses.length > 0 ? (
          <div className="cards-grid">
            {courses.map((course) => {
              const lessonCount = course.lessons?.[0]?.count ?? 0;
              return (
                <Link key={course.id} href={`/user/courses/${course.id}` as any} className="action-card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div className="icon-wrap" style={{ margin: 0 }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F7BC15" strokeWidth="1.8" strokeLinecap="round">
                        <path d="M22 10H2M22 10V20a2 2 0 01-2 2H4a2 2 0 01-2-2V10M22 10L12 3 2 10" />
                      </svg>
                    </div>
                    <span className="badge badge-user">{course.category ?? 'general'}</span>
                  </div>
                  <h3 style={{ marginBottom: 8 }}>{course.title}</h3>
                  {course.description && <p style={{ marginBottom: 12, fontSize: '0.82rem' }}>{course.description}</p>}
                  <div
                    style={{
                      fontSize: '0.72rem',
                      color: 'var(--text-muted)',
                      fontWeight: 600,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                    }}
                  >
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
