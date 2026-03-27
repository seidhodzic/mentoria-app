'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase-browser';
import Link from 'next/link';

type Lesson = { id: string; title: string; content: string | null; video_url: string | null; duration_minutes: number | null; sort_order: number; };
type Course = { id: string; title: string; description: string | null; category: string | null; };
type Progress = { id: string; lesson_id: string; completed: boolean; };

export default function CourseLessonClient({ course, lessons, progressRows: initial, userId }: {
  course: Course; lessons: Lesson[]; progressRows: Progress[]; userId: string;
}) {
  const [progress, setProgress] = useState<Progress[]>(initial);
  const [active, setActive] = useState<Lesson | null>(lessons[0] ?? null);
  const [marking, setMarking] = useState(false);

  const completedIds = new Set(progress.filter(p => p.completed).map(p => p.lesson_id));
  const completedCount = lessons.filter(l => completedIds.has(l.id)).length;
  const pct = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;

  async function markComplete(lesson: Lesson) {
    if (completedIds.has(lesson.id)) return;
    setMarking(true);
    try {
      const supabase = createClient();
      const { data } = await supabase.from('progress').upsert({
        user_id: userId, lesson_id: lesson.id, completed: true, completed_at: new Date().toISOString(),
      }).select().single();
      if (data) setProgress(prev => [...prev.filter(p => p.lesson_id !== lesson.id), data]);
    } finally { setMarking(false); }
  }

  function getEmbedUrl(url: string) {
    if (url.includes('youtube.com/watch?v=')) return url.replace('watch?v=', 'embed/');
    if (url.includes('youtu.be/')) return url.replace('youtu.be/', 'www.youtube.com/embed/');
    return url;
  }

  return (
    <div className="dash-layout">
      <header className="dash-header">
        <Link href="/dashboard" className="dash-brand">Mentor<span>ia</span></Link>
        <nav className="dash-nav">
          <Link href="/user/courses">← Courses</Link>
        </nav>
        <div className="dash-header-right">
          <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>
            {completedCount}/{lessons.length} completed · {pct}%
          </div>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', minHeight: 'calc(100vh - 64px)', paddingTop: 64 }}>
        {/* Sidebar */}
        <div style={{ background: '#fff', borderRight: '1px solid rgba(25,53,62,0.08)', padding: '24px 0', overflowY: 'auto' }}>
          <div style={{ padding: '0 20px 16px', borderBottom: '1px solid rgba(25,53,62,0.06)' }}>
            <div style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 6 }}>{course.category}</div>
            <div style={{ fontFamily: 'Saira Condensed,sans-serif', fontWeight: 900, fontSize: '1rem', textTransform: 'uppercase', color: 'var(--teal)', lineHeight: 1.2 }}>{course.title}</div>
            {/* Progress bar */}
            <div style={{ marginTop: 12, height: 4, background: 'rgba(25,53,62,0.08)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: 'var(--gold)', borderRadius: 2, transition: 'width 0.4s' }} />
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 4 }}>{pct}% complete</div>
          </div>
          <div style={{ padding: '8px 0' }}>
            {lessons.map((l, i) => {
              const done = completedIds.has(l.id);
              const isActive = active?.id === l.id;
              return (
                <button key={l.id} onClick={() => setActive(l)}
                  style={{ width: '100%', textAlign: 'left', padding: '10px 20px', background: isActive ? 'rgba(247,188,21,0.08)' : 'none', borderLeft: isActive ? '3px solid var(--gold)' : '3px solid transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.15s' }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: done ? 'var(--gold)' : 'rgba(25,53,62,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.6rem', fontWeight: 800, color: done ? 'var(--teal)' : 'rgba(25,53,62,0.4)' }}>
                    {done ? '✓' : i + 1}
                  </div>
                  <div style={{ fontSize: '0.82rem', fontWeight: isActive ? 700 : 400, color: isActive ? 'var(--teal)' : 'rgba(25,53,62,0.7)', lineHeight: 1.3 }}>
                    {l.title}
                    {l.duration_minutes && <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 2 }}>{l.duration_minutes} min</div>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Lesson content */}
        <div style={{ padding: '36px 40px', overflowY: 'auto' }}>
          {active ? (
            <>
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ display: 'inline-block', width: 20, height: 2, background: 'var(--gold)' }} />
                  Lesson {lessons.findIndex(l => l.id === active.id) + 1}
                </div>
                <h1 style={{ fontFamily: 'Saira Condensed,sans-serif', fontWeight: 900, fontSize: 'clamp(1.6rem,3vw,2.4rem)', textTransform: 'uppercase', color: 'var(--teal)', lineHeight: 1, marginBottom: 8 }}>{active.title}</h1>
                {active.duration_minutes && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{active.duration_minutes} min read</div>}
              </div>

              {active.video_url && (
                <div style={{ marginBottom: 28, borderRadius: 3, overflow: 'hidden', background: '#000', aspectRatio: '16/9', maxWidth: 720 }}>
                  <iframe src={getEmbedUrl(active.video_url)} style={{ width: '100%', height: '100%', border: 'none' }} allowFullScreen />
                </div>
              )}

              {active.content && (
                <div style={{ background: '#fff', border: '1px solid rgba(25,53,62,0.07)', borderRadius: 3, padding: '24px 28px', marginBottom: 24, fontSize: '0.92rem', lineHeight: 1.8, color: 'rgba(25,53,62,0.8)', whiteSpace: 'pre-wrap', maxWidth: 720 }}>
                  {active.content}
                </div>
              )}

              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                {completedIds.has(active.id) ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#276749', fontWeight: 700, fontSize: '0.82rem' }}>
                    <span style={{ background: 'rgba(56,161,105,0.12)', padding: '8px 16px', borderRadius: 3 }}>✓ Lesson Complete</span>
                  </div>
                ) : (
                  <button onClick={() => markComplete(active)} disabled={marking} className="btn btn-primary">
                    {marking ? 'Saving...' : 'Mark as Complete ✓'}
                  </button>
                )}
                {/* Next lesson */}
                {(() => {
                  const idx = lessons.findIndex(l => l.id === active.id);
                  const next = lessons[idx + 1];
                  return next ? (
                    <button onClick={() => setActive(next)} className="btn btn-outline">
                      Next Lesson →
                    </button>
                  ) : null;
                })()}
              </div>
            </>
          ) : (
            <div className="empty-state"><h3>No lessons yet</h3><p>Lessons will appear here once added.</p></div>
          )}
        </div>
      </div>
    </div>
  );
}
