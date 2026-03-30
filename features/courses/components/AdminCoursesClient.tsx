'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase-browser';
import DashboardHeader from '@/components/layout/DashboardHeader';
import {
  DASH_PRIMARY_ACTION_CLASS,
  DASH_PRIMARY_ACTION_HEADER_CLASS,
  DASH_TABLE_ACTION_CLASS,
} from '@/lib/dashboard-ui';
import Link from 'next/link';

type Course = {
  id: string; title: string; description: string | null;
  category: string | null; is_published: boolean | null;
  created_at: string; lessons?: { count: number }[];
};

const ADMIN_NAV = [
  { label: 'Overview', href: '/admin' },
  { label: 'Users', href: '/admin/users' },
  { label: 'Materials', href: '/admin/materials' },
  { label: 'Courses', href: '/admin/courses' },
  { label: 'Quizzes', href: '/admin/quizzes' },
  { label: 'Subscriptions', href: '/admin/subscriptions' },
];

const CATEGORIES = ['general', 'sports', 'investment', 'education', 'legal', 'career', 'fifa-agent'];

export default function AdminCoursesClient({ courses: initial, userId }: { courses: Course[]; userId: string }) {
  const [courses, setCourses] = useState<Course[]>(initial);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');

  function showMsg(type: 'success' | 'error', text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.from('courses').insert({
        title: title.trim(), description: description.trim() || null,
        category, is_published: false, owner_id: userId,
      }).select().single();
      if (error) throw error;
      setCourses(prev => [data, ...prev]);
      setTitle(''); setDescription(''); setCategory('general');
      setShowForm(false);
      showMsg('success', `Course "${data.title}" created.`);
    } catch (err) {
      showMsg('error', err instanceof Error ? err.message : 'Failed to create course.');
    } finally { setSaving(false); }
  }

  async function togglePublish(course: Course) {
    setToggling(course.id);
    try {
      const supabase = createClient();
      const next = !(course.is_published ?? false);
      const { error } = await supabase.from('courses').update({ is_published: next }).eq('id', course.id);
      if (error) throw error;
      setCourses(prev => prev.map(c => (c.id === course.id ? { ...c, is_published: next } : c)));
      showMsg('success', `Course ${next ? 'published' : 'unpublished'}.`);
    } catch { showMsg('error', 'Failed to update.'); }
    finally { setToggling(null); }
  }

  async function handleDelete(course: Course) {
    if (!confirm(`Delete "${course.title}"? All lessons will be removed.`)) return;
    setDeleting(course.id);
    try {
      const supabase = createClient();
      await supabase.from('courses').delete().eq('id', course.id);
      setCourses(prev => prev.filter(c => c.id !== course.id));
      showMsg('success', `"${course.title}" deleted.`);
    } catch { showMsg('error', 'Delete failed.'); }
    finally { setDeleting(null); }
  }

  return (
    <div className="dash-layout">
      <DashboardHeader navItems={ADMIN_NAV} activeNav="/admin/courses">
        <button type="button" onClick={() => setShowForm(v => !v)} className={DASH_PRIMARY_ACTION_HEADER_CLASS}>
          {showForm ? '✕ Cancel' : '+ New Course'}
        </button>
      </DashboardHeader>

      <div className="dash-content">
        <div className="page-header">
          <div className="eyebrow">Admin — Courses</div>
          <h1>Course Builder</h1>
          <p>Create and manage courses. Add lessons and publish when ready.</p>
        </div>

        {message && (
          <div className={message.type === 'success' ? 'auth-success' : 'auth-error'} style={{ marginBottom: 16 }}>{message.text}</div>
        )}

        {showForm && (
          <div className="card" style={{ marginBottom: 24 }}>
            <h3 style={{ marginBottom: 20 }}>Create New Course</h3>
            <form onSubmit={handleCreate}>
              <div className="form-grid-2">
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Course Title *</label>
                  <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. FIFA Agent Exam Preparation" required />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Category</label>
                  <select value={category} onChange={e => setCategory(e.target.value)}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c.split('-').map(w => w.charAt(0).toUpperCase()+w.slice(1)).join(' ')}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <input value={description} onChange={e => setDescription(e.target.value)} placeholder="What will members learn in this course?" />
              </div>
              <button className={DASH_PRIMARY_ACTION_CLASS} type="submit" disabled={saving}>
                {saving ? 'Creating...' : 'Create Course'}
              </button>
            </form>
          </div>
        )}

        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', marginBottom: 24 }}>
          <div className="stat-card"><div className="stat-label">Total Courses</div><div className="stat-value">{courses.length}</div></div>
          <div className="stat-card"><div className="stat-label">Published</div><div className="stat-value">{courses.filter(c => c.is_published ?? false).length}</div></div>
          <div className="stat-card"><div className="stat-label">Drafts</div><div className="stat-value">{courses.filter(c => !(c.is_published ?? false)).length}</div></div>
        </div>

        <div className="table-wrap">
          {courses.length > 0 ? (
            <table>
              <thead>
                <tr><th>Title</th><th>Category</th><th>Lessons</th><th>Status</th><th>Created</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {courses.map(c => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{c.title}</div>
                      {c.description && <div style={{ fontFamily: "'Saira', sans-serif", fontSize: '0.88rem', fontWeight: 300, lineHeight: 1.8, color: 'var(--text-muted)', marginTop: 2 }}>{c.description}</div>}
                    </td>
                    <td><span className="badge badge-user">{c.category ?? 'general'}</span></td>
                    <td style={{ color: 'var(--text-muted)' }}>{c.lessons?.[0]?.count ?? 0}</td>
                    <td>
                      <span className={`badge ${c.is_published ?? false ? 'badge-active' : 'badge-pending'}`}>
                        {c.is_published ?? false ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td style={{ fontFamily: "'Saira', sans-serif", color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 400 }}>{new Date(c.created_at).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Link href={`/admin/courses/${c.id}` as any} className={DASH_TABLE_ACTION_CLASS}>
                          Lessons
                        </Link>
                        <button
                          type="button"
                          onClick={() => togglePublish(c)}
                          disabled={toggling === c.id}
                          className={DASH_TABLE_ACTION_CLASS}
                        >
                          {toggling === c.id ? '...' : c.is_published ?? false ? 'Unpublish' : 'Publish'}
                        </button>
                        <button onClick={() => handleDelete(c)} disabled={deleting === c.id} className="btn btn-danger btn-sm">
                          {deleting === c.id ? '...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <h3>No courses yet</h3>
              <p>Click "New Course" to create your first course.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
