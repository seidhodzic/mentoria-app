#!/bin/bash
BASE="/Users/seid/Desktop/mentoria-mvp"
echo "Writing Phase 3 — Materials & Courses..."

mkdir -p "$BASE/app/admin/materials"
mkdir -p "$BASE/app/admin/courses"
mkdir -p "$BASE/app/user/materials"
mkdir -p "$BASE/app/user/courses"

# ── ADMIN MATERIALS PAGE ──
cat > "$BASE/app/admin/materials/page.tsx" << 'EOF'
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { normalizeRole } from '@/lib/role';
import AdminMaterialsClient from './AdminMaterialsClient';

export default async function AdminMaterialsPage() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
  if (normalizeRole(profile?.role) !== 'admin') redirect('/dashboard');
  const { data: materials } = await supabase
    .from('materials')
    .select('*')
    .order('created_at', { ascending: false });
  return <AdminMaterialsClient materials={materials ?? []} userId={session.user.id} />;
}
EOF

cat > "$BASE/app/admin/materials/AdminMaterialsClient.tsx" << 'EOF'
'use client';
import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase-browser';
import Link from 'next/link';

type Material = {
  id: string; title: string; description: string | null;
  file_url: string | null; file_name: string | null;
  file_size: number | null; category: string | null;
  is_premium: boolean; created_at: string;
};

const ADMIN_NAV = [
  { label: 'Overview', href: '/admin' },
  { label: 'Users', href: '/admin/users' },
  { label: 'Materials', href: '/admin/materials' },
  { label: 'Quizzes', href: '/admin/quizzes' },
  { label: 'Subscriptions', href: '/admin/subscriptions' },
];

const CATEGORIES = ['general', 'sports', 'investment', 'education', 'legal', 'career', 'templates'];

export default function AdminMaterialsClient({ materials: initial, userId }: { materials: Material[]; userId: string }) {
  const [materials, setMaterials] = useState<Material[]>(initial);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [isPremium, setIsPremium] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  function showMsg(type: 'success' | 'error', text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file || !title.trim()) return;
    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split('.').pop();
      const path = `${userId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from('materials').upload(path, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('materials').getPublicUrl(path);
      const { data: mat, error: dbError } = await supabase.from('materials').insert({
        title: title.trim(),
        description: description.trim() || null,
        file_url: publicUrl,
        file_name: file.name,
        file_size: file.size,
        category,
        is_premium: isPremium,
        owner_id: userId,
      }).select().single();
      if (dbError) throw dbError;
      setMaterials(prev => [mat, ...prev]);
      setTitle(''); setDescription(''); setCategory('general'); setIsPremium(true);
      if (fileRef.current) fileRef.current.value = '';
      setShowForm(false);
      showMsg('success', `"${mat.title}" uploaded successfully.`);
    } catch (err) {
      showMsg('error', err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(mat: Material) {
    if (!confirm(`Delete "${mat.title}"? This cannot be undone.`)) return;
    setDeleting(mat.id);
    try {
      const supabase = createClient();
      if (mat.file_url) {
        const path = mat.file_url.split('/materials/')[1];
        if (path) await supabase.storage.from('materials').remove([path]);
      }
      await supabase.from('materials').delete().eq('id', mat.id);
      setMaterials(prev => prev.filter(m => m.id !== mat.id));
      showMsg('success', `"${mat.title}" deleted.`);
    } catch (err) {
      showMsg('error', 'Delete failed.');
    } finally {
      setDeleting(null);
    }
  }

  function formatSize(bytes: number | null) {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div className="dash-layout">
      <header className="dash-header">
        <Link href="/dashboard" className="dash-brand">Mentor<span>ia</span></Link>
        <nav className="dash-nav">
          {ADMIN_NAV.map(item => (
            <Link key={item.href} href={item.href as any} className={item.href === '/admin/materials' ? 'active' : ''}>{item.label}</Link>
          ))}
        </nav>
        <div className="dash-header-right">
          <button onClick={() => setShowForm(v => !v)} className="btn btn-primary btn-sm">
            {showForm ? '✕ Cancel' : '+ Upload Material'}
          </button>
        </div>
      </header>

      <div className="dash-content">
        <div className="page-header">
          <div className="eyebrow">Admin — Content</div>
          <h1>Materials Library</h1>
          <p>Upload and manage learning resources, templates and guides for members.</p>
        </div>

        {message && (
          <div className={message.type === 'success' ? 'auth-success' : 'auth-error'} style={{ marginBottom: 16 }}>
            {message.text}
          </div>
        )}

        {/* Upload form */}
        {showForm && (
          <div className="card" style={{ marginBottom: 24 }}>
            <h3 style={{ marginBottom: 20 }}>Upload New Material</h3>
            <form onSubmit={handleUpload}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Title *</label>
                  <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. FIFA Agent Exam Guide" required />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Category</label>
                  <select value={category} onChange={e => setCategory(e.target.value)}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Short description of this material" />
              </div>
              <div className="form-group">
                <label>File *</label>
                <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.mp4" required />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 20 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', textTransform: 'none', letterSpacing: 0, fontSize: '0.85rem', fontWeight: 400, color: 'var(--teal)' }}>
                  <input type="checkbox" checked={isPremium} onChange={e => setIsPremium(e.target.checked)} style={{ width: 'auto' }} />
                  Premium (subscribers only)
                </label>
              </div>
              <button className="btn btn-primary" type="submit" disabled={uploading}>
                {uploading ? 'Uploading...' : 'Upload Material'}
              </button>
            </form>
          </div>
        )}

        {/* Stats */}
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', marginBottom: 24 }}>
          <div className="stat-card"><div className="stat-label">Total Materials</div><div className="stat-value">{materials.length}</div></div>
          <div className="stat-card"><div className="stat-label">Premium</div><div className="stat-value">{materials.filter(m => m.is_premium).length}</div></div>
          <div className="stat-card"><div className="stat-label">Free</div><div className="stat-value">{materials.filter(m => !m.is_premium).length}</div></div>
        </div>

        {/* Table */}
        <div className="table-wrap">
          {materials.length > 0 ? (
            <table>
              <thead>
                <tr><th>Title</th><th>Category</th><th>Size</th><th>Access</th><th>Uploaded</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {materials.map(m => (
                  <tr key={m.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{m.title}</div>
                      {m.description && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{m.description}</div>}
                    </td>
                    <td><span className="badge badge-user">{m.category ?? 'general'}</span></td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{formatSize(m.file_size)}</td>
                    <td><span className={`badge ${m.is_premium ? 'badge-admin' : 'badge-active'}`}>{m.is_premium ? 'Premium' : 'Free'}</span></td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{new Date(m.created_at).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {m.file_url && (
                          <a href={m.file_url} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">Download</a>
                        )}
                        <button onClick={() => handleDelete(m)} disabled={deleting === m.id} className="btn btn-danger btn-sm">
                          {deleting === m.id ? '...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <h3>No materials yet</h3>
              <p>Click "Upload Material" to add your first resource.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
EOF

# ── ADMIN COURSES PAGE ──
cat > "$BASE/app/admin/courses/page.tsx" << 'EOF'
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { normalizeRole } from '@/lib/role';
import AdminCoursesClient from './AdminCoursesClient';

export default async function AdminCoursesPage() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
  if (normalizeRole(profile?.role) !== 'admin') redirect('/dashboard');
  const { data: courses } = await supabase
    .from('courses')
    .select('*, lessons(count)')
    .order('created_at', { ascending: false });
  return <AdminCoursesClient courses={courses ?? []} userId={session.user.id} />;
}
EOF

cat > "$BASE/app/admin/courses/AdminCoursesClient.tsx" << 'EOF'
'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase-browser';
import Link from 'next/link';

type Course = {
  id: string; title: string; description: string | null;
  category: string | null; is_published: boolean;
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
      const { error } = await supabase.from('courses').update({ is_published: !course.is_published }).eq('id', course.id);
      if (error) throw error;
      setCourses(prev => prev.map(c => c.id === course.id ? { ...c, is_published: !c.is_published } : c));
      showMsg('success', `Course ${!course.is_published ? 'published' : 'unpublished'}.`);
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
      <header className="dash-header">
        <Link href="/dashboard" className="dash-brand">Mentor<span>ia</span></Link>
        <nav className="dash-nav">
          {ADMIN_NAV.map(item => (
            <Link key={item.href} href={item.href as any} className={item.href === '/admin/courses' ? 'active' : ''}>{item.label}</Link>
          ))}
        </nav>
        <div className="dash-header-right">
          <button onClick={() => setShowForm(v => !v)} className="btn btn-primary btn-sm">
            {showForm ? '✕ Cancel' : '+ New Course'}
          </button>
        </div>
      </header>

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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
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
              <button className="btn btn-primary" type="submit" disabled={saving}>
                {saving ? 'Creating...' : 'Create Course'}
              </button>
            </form>
          </div>
        )}

        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', marginBottom: 24 }}>
          <div className="stat-card"><div className="stat-label">Total Courses</div><div className="stat-value">{courses.length}</div></div>
          <div className="stat-card"><div className="stat-label">Published</div><div className="stat-value">{courses.filter(c => c.is_published).length}</div></div>
          <div className="stat-card"><div className="stat-label">Drafts</div><div className="stat-value">{courses.filter(c => !c.is_published).length}</div></div>
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
                      {c.description && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{c.description}</div>}
                    </td>
                    <td><span className="badge badge-user">{c.category ?? 'general'}</span></td>
                    <td style={{ color: 'var(--text-muted)' }}>{c.lessons?.[0]?.count ?? 0}</td>
                    <td>
                      <span className={`badge ${c.is_published ? 'badge-active' : 'badge-pending'}`}>
                        {c.is_published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{new Date(c.created_at).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Link href={`/admin/courses/${c.id}` as any} className="btn btn-outline btn-sm">Lessons</Link>
                        <button onClick={() => togglePublish(c)} disabled={toggling === c.id} className={`btn btn-sm ${c.is_published ? 'btn-outline' : 'btn-teal'}`}>
                          {toggling === c.id ? '...' : c.is_published ? 'Unpublish' : 'Publish'}
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
EOF

# ── ADMIN COURSE LESSONS PAGE ──
mkdir -p "$BASE/app/admin/courses/[id]"
cat > "$BASE/app/admin/courses/[id]/page.tsx" << 'EOF'
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { normalizeRole } from '@/lib/role';
import AdminLessonsClient from './AdminLessonsClient';

export default async function AdminLessonsPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
  if (normalizeRole(profile?.role) !== 'admin') redirect('/dashboard');
  const { data: course } = await supabase.from('courses').select('*').eq('id', params.id).single();
  if (!course) redirect('/admin/courses');
  const { data: lessons } = await supabase.from('lessons').select('*').eq('course_id', params.id).order('sort_order');
  return <AdminLessonsClient course={course} lessons={lessons ?? []} userId={session.user.id} />;
}
EOF

cat > "$BASE/app/admin/courses/[id]/AdminLessonsClient.tsx" << 'EOF'
'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase-browser';
import Link from 'next/link';

type Lesson = { id: string; title: string; content: string | null; video_url: string | null; duration_minutes: number | null; sort_order: number; };
type Course = { id: string; title: string; description: string | null; is_published: boolean; category: string | null; };

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
      }).select().single();
      if (error) throw error;
      setLessons(prev => [...prev, data]);
      setLessonTitle(''); setLessonContent(''); setLessonVideo(''); setLessonDuration('');
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
      <header className="dash-header">
        <Link href="/dashboard" className="dash-brand">Mentor<span>ia</span></Link>
        <nav className="dash-nav">
          <Link href="/admin">Overview</Link>
          <Link href="/admin/courses" className="active">Courses</Link>
        </nav>
        <div className="dash-header-right">
          <button onClick={() => setShowForm(v => !v)} className="btn btn-primary btn-sm">
            {showForm ? '✕ Cancel' : '+ Add Lesson'}
          </button>
        </div>
      </header>
      <div className="dash-content">
        <div className="page-header">
          <div className="eyebrow">Course Editor</div>
          <h1>{course.title}</h1>
          <p>{course.description ?? 'No description.'} · <span className={`badge ${course.is_published ? 'badge-active' : 'badge-pending'}`}>{course.is_published ? 'Published' : 'Draft'}</span></p>
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
              <thead><tr><th>#</th><th>Title</th><th>Duration</th><th>Video</th><th>Content</th><th>Actions</th></tr></thead>
              <tbody>
                {lessons.map((l, i) => (
                  <tr key={l.id}>
                    <td style={{ color: 'var(--text-muted)', fontWeight: 700 }}>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{l.title}</td>
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
EOF

# ── USER MATERIALS PAGE ──
cat > "$BASE/app/user/materials/page.tsx" << 'EOF'
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
EOF

# ── USER COURSES PAGE ──
cat > "$BASE/app/user/courses/page.tsx" << 'EOF'
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
EOF

# ── USER COURSE LESSON VIEW ──
mkdir -p "$BASE/app/user/courses/[id]"
cat > "$BASE/app/user/courses/[id]/page.tsx" << 'EOF'
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import Link from 'next/link';
import CourseLessonClient from './CourseLessonClient';

export default async function CoursePage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');

  const { data: course } = await supabase.from('courses').select('*').eq('id', params.id).eq('is_published', true).single();
  if (!course) redirect('/user/courses');

  const { data: lessons } = await supabase.from('lessons').select('*').eq('course_id', params.id).order('sort_order');
  const { data: progressRows } = await supabase.from('progress').select('*').eq('user_id', session.user.id);

  return (
    <CourseLessonClient
      course={course}
      lessons={lessons ?? []}
      progressRows={progressRows ?? []}
      userId={session.user.id}
    />
  );
}
EOF

cat > "$BASE/app/user/courses/[id]/CourseLessonClient.tsx" << 'EOF'
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
EOF

# ── Update admin nav to include Courses ──
sed -i '' "s|{ label: 'Quizzes', href: '/admin/quizzes' },|{ label: 'Courses', href: '/admin/courses' },\n  { label: 'Quizzes', href: '/admin/quizzes' },|g" "$BASE/app/admin/page.tsx" 2>/dev/null || true

echo ""
echo "================================================"
echo "  Phase 3 — Materials & Courses complete!"
echo "================================================"
echo ""
echo "Run: npm run dev"
echo ""
echo "New pages:"
echo "  /admin/materials  — upload & manage files"
echo "  /admin/courses    — create courses + lessons"
echo "  /user/materials   — browse & download"
echo "  /user/courses     — view courses + track progress"
