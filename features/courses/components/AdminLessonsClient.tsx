'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase-browser';
import DashboardHeader from '@/components/layout/DashboardHeader';
import Link from 'next/link';

type Lesson = {
  id: string;
  title: string;
  content: string | null;
  video_url: string | null;
  duration_minutes: number | null;
  sort_order: number | null;
  is_premium: boolean | null;
};
type Course = {
  id: string;
  title: string;
  description: string | null;
  is_published: boolean | null;
  category: string | null;
};

const ADMIN_NAV = [
  { label: 'Overview', href: '/admin' },
  { label: 'Users', href: '/admin/users' },
  { label: 'Materials', href: '/admin/materials' },
  { label: 'Courses', href: '/admin/courses' },
  { label: 'Quizzes', href: '/admin/quizzes' },
  { label: 'Subscriptions', href: '/admin/subscriptions' },
];

export default function AdminLessonsClient({ course, lessons: initial, userId }: { course: Course; lessons: Lesson[]; userId: string }) {
  const [lessons, setLessons] = useState<Lesson[]>(initial);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonContent, setLessonContent] = useState('');
  const [lessonVideo, setLessonVideo] = useState('');
  const [lessonDuration, setLessonDuration] = useState('');
  const [lessonPremium, setLessonPremium] = useState(false);

  function showMsg(type: 'success' | 'error', text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  }

  async function handleAddLesson(e: React.FormEvent) {
    e.preventDefault();
    if (!lessonTitle.trim()) return;
    setSaving(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.from('lessons').insert({
        course_id: course.id,
        title: lessonTitle.trim(),
        content: lessonContent.trim() || null,
        video_url: lessonVideo.trim() || null,
        duration_minutes: lessonDuration ? parseInt(lessonDuration) : null,
        sort_order: lessons.length,
        is_premium: lessonPremium,
      }).select().single();
      if (error) throw error;
      setLessons(prev => [...prev, data]);
      setLessonTitle(''); setLessonContent(''); setLessonVideo(''); setLessonDuration(''); setLessonPremium(false);
      setShowForm(false);
      showMsg('success', `Lesson "${data.title}" added.`);
    } catch (err) {
      showMsg('error', err instanceof Error ? err.message : 'Failed.');
    } finally { setSaving(false); }
  }

  async function deleteLesson(lesson: Lesson) {
    if (!confirm(`Delete "${lesson.title}"?`)) return;
    setDeleting(lesson.id);
    try {
      const supabase = createClient();
      await supabase.from('lessons').delete().eq('id', lesson.id);
      setLessons(prev => prev.filter(l => l.id !== lesson.id));
      showMsg('success', 'Lesson deleted.');
    } catch { showMsg('error', 'Delete failed.'); }
    finally { setDeleting(null); }
  }

  return (
    <div className="dash-layout">
      <DashboardHeader navItems={ADMIN_NAV} activeNav="/admin/courses">
        <button onClick={() => setShowForm(v => !v)} className="btn btn-primary btn-sm">
          {showForm ? '✕ Cancel' : '+ Add Lesson'}
        </button>
      </DashboardHeader>
      <div className="dash-content">
        <div className="page-header">
          <div className="eyebrow">Course Editor</div>
          <h1>{course.title}</h1>
          <p>{course.description ?? 'No description.'} · <span className={`badge ${course.is_published ?? false ? 'badge-active' : 'badge-pending'}`}>{course.is_published ?? false ? 'Published' : 'Draft'}</span></p>
        </div>

        {message && <div className={message.type === 'success' ? 'auth-success' : 'auth-error'} style={{ marginBottom: 16 }}>{message.text}</div>}

        {showForm && (
          <div className="card" style={{ marginBottom: 24 }}>
            <h3 style={{ marginBottom: 20 }}>Add New Lesson</h3>
            <form onSubmit={handleAddLesson}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Lesson Title *</label>
                  <input value={lessonTitle} onChange={e => setLessonTitle(e.target.value)} placeholder="e.g. Introduction to FIFA Regulations" required />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Duration (minutes)</label>
                  <input type="number" value={lessonDuration} onChange={e => setLessonDuration(e.target.value)} placeholder="e.g. 15" min="1" />
                </div>
              </div>
              <div className="form-group">
                <label>Video URL (YouTube, Vimeo, etc.)</label>
                <input value={lessonVideo} onChange={e => setLessonVideo(e.target.value)} placeholder="https://youtube.com/..." />
              </div>
              <div className="form-group">
                <label>Lesson Content / Notes</label>
                <textarea value={lessonContent} onChange={e => setLessonContent(e.target.value)} placeholder="Write lesson notes, key points, or instructions here..." rows={4} style={{ resize: 'vertical' }} />
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="checkbox"
                  id="lesson-premium"
                  checked={lessonPremium}
                  onChange={(e) => setLessonPremium(e.target.checked)}
                  style={{ width: 'auto' }}
                />
                <label htmlFor="lesson-premium" style={{ margin: 0, cursor: 'pointer' }}>
                  Premium lesson (requires active subscription for members)
                </label>
              </div>
              <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Add Lesson'}</button>
            </form>
          </div>
        )}

        <div className="section-header" style={{ marginBottom: 16 }}>
          <h2>{lessons.length} Lesson{lessons.length !== 1 ? 's' : ''}</h2>
          <Link href="/admin/courses" className="btn btn-outline btn-sm">← Back to Courses</Link>
        </div>

        <div className="table-wrap">
          {lessons.length > 0 ? (
            <table>
              <thead><tr><th>#</th><th>Title</th><th>Premium</th><th>Duration</th><th>Video</th><th>Content</th><th>Actions</th></tr></thead>
              <tbody>
                {lessons.map((l, i) => (
                  <tr key={l.id}>
                    <td style={{ color: 'var(--text-muted)', fontWeight: 700 }}>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{l.title}</td>
                    <td>{(l.is_premium ?? false) ? <span className="badge badge-admin">Premium</span> : <span className="badge badge-user">Open</span>}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{l.duration_minutes ? `${l.duration_minutes} min` : '—'}</td>
                    <td>{l.video_url ? <a href={l.video_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--gold-dark)', fontSize: '0.78rem', fontWeight: 600 }}>Watch ↗</a> : <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>—</span>}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{l.content ? l.content.substring(0, 60) + (l.content.length > 60 ? '...' : '') : '—'}</td>
                    <td>
                      <button onClick={() => deleteLesson(l)} disabled={deleting === l.id} className="btn btn-danger btn-sm">
                        {deleting === l.id ? '...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state"><h3>No lessons yet</h3><p>Add your first lesson to this course.</p></div>
          )}
        </div>
      </div>
    </div>
  );
}
