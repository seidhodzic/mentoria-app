'use client';
import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase-browser';
import DashboardHeader from '@/components/layout/DashboardHeader';
import Link from 'next/link';

type Material = {
  id: string; title: string; description: string | null;
  file_url: string | null; file_name: string | null;
  file_size: number | null; category: string | null;
  is_premium: boolean | null; created_at: string;
};

const ADMIN_NAV = [
  { label: 'Overview', href: '/admin' },
  { label: 'Users', href: '/admin/users' },
  { label: 'Materials', href: '/admin/materials' },
  { label: 'Courses', href: '/admin/courses' },
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
      <DashboardHeader navItems={ADMIN_NAV} activeNav="/admin/materials">
        <button onClick={() => setShowForm(v => !v)} className="btn btn-primary btn-sm">
          {showForm ? '✕ Cancel' : '+ Upload Material'}
        </button>
      </DashboardHeader>

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
              <div className="form-grid-2">
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
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', textTransform: 'none', letterSpacing: 0, fontFamily: "'Saira', sans-serif", fontSize: '0.85rem', fontWeight: 400, color: 'var(--teal)' }}>
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
          <div className="stat-card"><div className="stat-label">Premium</div><div className="stat-value">{materials.filter(m => m.is_premium ?? false).length}</div></div>
          <div className="stat-card"><div className="stat-label">Free</div><div className="stat-value">{materials.filter(m => !(m.is_premium ?? false)).length}</div></div>
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
                      {m.description && <div style={{ fontFamily: "'Saira', sans-serif", fontSize: '0.88rem', fontWeight: 300, lineHeight: 1.8, color: 'var(--text-muted)', marginTop: 2 }}>{m.description}</div>}
                    </td>
                    <td><span className="badge badge-user">{m.category ?? 'general'}</span></td>
                    <td style={{ fontFamily: "'Saira', sans-serif", color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 400 }}>{formatSize(m.file_size)}</td>
                    <td><span className={`badge ${m.is_premium ?? false ? 'badge-admin' : 'badge-active'}`}>{m.is_premium ?? false ? 'Premium' : 'Free'}</span></td>
                    <td style={{ fontFamily: "'Saira', sans-serif", color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 400 }}>{new Date(m.created_at).toLocaleDateString()}</td>
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
