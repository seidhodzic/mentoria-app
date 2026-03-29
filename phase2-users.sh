#!/bin/bash
BASE="/Users/seid/Desktop/mentoria-mvp"
echo "Writing Phase 2 — Admin User Management..."

cat > "$BASE/app/admin/users/page.tsx" << 'EOF'
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { normalizeRole } from '@/lib/role';
import AdminUsersClient from './AdminUsersClient';

export default async function AdminUsersPage() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (normalizeRole(profile?.role) !== 'admin') redirect('/dashboard');

  const { data: users } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, status, created_at, updated_at')
    .order('created_at', { ascending: false });

  return <AdminUsersClient users={users ?? []} />;
}
EOF

cat > "$BASE/app/admin/users/AdminUsersClient.tsx" << 'EOF'
'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase-browser';
import Link from 'next/link';

type User = {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  status: string;
  created_at: string;
  updated_at: string;
};

const ADMIN_NAV = [
  { label: 'Overview', href: '/admin' },
  { label: 'Users', href: '/admin/users' },
  { label: 'Materials', href: '/admin/materials' },
  { label: 'Quizzes', href: '/admin/quizzes' },
  { label: 'Subscriptions', href: '/admin/subscriptions' },
];

export default function AdminUsersClient({ users: initialUsers }: { users: User[] }) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const filtered = users.filter((u) => {
    const matchSearch =
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.full_name ?? '').toLowerCase().includes(search.toLowerCase());
    const matchRole   = roleFilter   === 'all' || u.role   === roleFilter;
    const matchStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  async function updateUser(id: string, updates: Partial<User>) {
    setLoading(id);
    setMessage(null);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      setUsers((prev) => prev.map((u) => u.id === id ? { ...u, ...updates } : u));
      setMessage({ type: 'success', text: 'User updated successfully.' });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Update failed.' });
    } finally {
      setLoading(null);
      setTimeout(() => setMessage(null), 3000);
    }
  }

  const counts = {
    total:     users.length,
    active:    users.filter((u) => u.status === 'active').length,
    pending:   users.filter((u) => u.status === 'pending').length,
    suspended: users.filter((u) => u.status === 'suspended').length,
    admins:    users.filter((u) => u.role === 'admin').length,
    mentors:   users.filter((u) => u.role === 'mentor').length,
  };

  return (
    <div className="dash-layout">
      {/* Header */}
      <header className="dash-header">
        <Link href="/dashboard" className="dash-brand">Mentor<span>ia</span></Link>
        <nav className="dash-nav">
          {ADMIN_NAV.map((item) => (
            <Link key={item.href} href={item.href as any}
              className={item.href === '/admin/users' ? 'active' : ''}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="dash-header-right">
          <div className="dash-user-pill">
            <span className="role-badge" style={{ background: 'var(--teal)', color: '#fff' }}>admin</span>
          </div>
          <a href="/admin" className="btn btn-outline btn-sm" style={{ color: 'rgba(255,255,255,0.6)', borderColor: 'rgba(255,255,255,0.2)' }}>
            ← Overview
          </a>
        </div>
      </header>

      <div className="dash-content">
        {/* Page header */}
        <div className="page-header">
          <div className="eyebrow">Admin — User Management</div>
          <h1>All Members</h1>
          <p>Manage roles, activate accounts and monitor member status.</p>
        </div>

        {/* Stats */}
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', marginBottom: 24 }}>
          {[
            { label: 'Total', value: counts.total },
            { label: 'Active', value: counts.active },
            { label: 'Pending', value: counts.pending },
            { label: 'Suspended', value: counts.suspended },
            { label: 'Admins', value: counts.admins },
            { label: 'Mentors', value: counts.mentors },
          ].map((s) => (
            <div key={s.label} className="stat-card">
              <div className="stat-label">{s.label}</div>
              <div className="stat-value">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Toast */}
        {message && (
          <div className={message.type === 'success' ? 'auth-success' : 'auth-error'} style={{ marginBottom: 16 }}>
            {message.text}
          </div>
        )}

        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: 200, maxWidth: 360, padding: '9px 14px', background: '#fff', border: '1.5px solid rgba(25,53,62,0.12)', borderRadius: 3, fontFamily: 'Saira,sans-serif', fontSize: '0.88rem', color: 'var(--teal)', outline: 'none' }}
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{ padding: '9px 32px 9px 12px', background: '#fff', border: '1.5px solid rgba(25,53,62,0.12)', borderRadius: 3, fontFamily: 'Saira,sans-serif', fontSize: '0.82rem', color: 'var(--teal)', outline: 'none', cursor: 'pointer' }}
          >
            <option value="all">All Roles</option>
            <option value="user">User</option>
            <option value="mentor">Mentor</option>
            <option value="admin">Admin</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '9px 32px 9px 12px', background: '#fff', border: '1.5px solid rgba(25,53,62,0.12)', borderRadius: 3, fontFamily: 'Saira,sans-serif', fontSize: '0.82rem', color: 'var(--teal)', outline: 'none', cursor: 'pointer' }}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="suspended">Suspended</option>
          </select>
          <span style={{ fontSize: '0.72rem', color: 'rgba(25,53,62,0.4)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Table */}
        <div className="table-wrap">
          {filtered.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 600 }}>{u.full_name ?? '—'}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{u.email}</td>
                    <td>
                      <select
                        value={u.role}
                        disabled={loading === u.id}
                        onChange={(e) => updateUser(u.id, { role: e.target.value })}
                        style={{
                          padding: '4px 24px 4px 8px',
                          fontSize: '0.65rem', fontWeight: 800,
                          letterSpacing: '0.1em', textTransform: 'uppercase',
                          border: '1px solid rgba(25,53,62,0.15)',
                          borderRadius: 2, cursor: 'pointer',
                          background: u.role === 'admin' ? 'var(--teal)' : u.role === 'mentor' ? 'var(--gold)' : 'rgba(25,53,62,0.08)',
                          color: u.role === 'mentor' ? 'var(--teal)' : u.role === 'admin' ? '#fff' : 'var(--teal)',
                          fontFamily: 'Saira,sans-serif', outline: 'none',
                        }}
                      >
                        <option value="user">User</option>
                        <option value="mentor">Mentor</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td>
                      <select
                        value={u.status}
                        disabled={loading === u.id}
                        onChange={(e) => updateUser(u.id, { status: e.target.value })}
                        style={{
                          padding: '4px 24px 4px 8px',
                          fontSize: '0.65rem', fontWeight: 800,
                          letterSpacing: '0.1em', textTransform: 'uppercase',
                          border: '1px solid rgba(25,53,62,0.15)',
                          borderRadius: 2, cursor: 'pointer',
                          background: u.status === 'active' ? 'rgba(56,161,105,0.12)' : u.status === 'pending' ? 'rgba(247,188,21,0.15)' : 'rgba(229,62,62,0.12)',
                          color: u.status === 'active' ? '#276749' : u.status === 'pending' ? '#92600a' : '#c53030',
                          fontFamily: 'Saira,sans-serif', outline: 'none',
                        }}
                      >
                        <option value="pending">Pending</option>
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      {loading === u.id ? (
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Saving...</span>
                      ) : (
                        <div style={{ display: 'flex', gap: 6 }}>
                          {u.status === 'pending' && (
                            <button
                              onClick={() => updateUser(u.id, { status: 'active' })}
                              className="btn btn-primary btn-sm"
                            >
                              Activate
                            </button>
                          )}
                          {u.status === 'active' && (
                            <button
                              onClick={() => updateUser(u.id, { status: 'suspended' })}
                              className="btn btn-danger btn-sm"
                            >
                              Suspend
                            </button>
                          )}
                          {u.status === 'suspended' && (
                            <button
                              onClick={() => updateUser(u.id, { status: 'active' })}
                              className="btn btn-teal btn-sm"
                            >
                              Restore
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <h3>No users found</h3>
              <p>Try adjusting your search or filters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
EOF

echo ""
echo "================================================"
echo "  Phase 2 — User Management written!"
echo "================================================"
echo ""
echo "Now run:"
echo "  npm run dev"
echo "  Then go to: http://localhost:3000/admin/users"
