'use client';
import {
  ONE_TIME_PRODUCTS,
  PROFILE_TYPES,
  SUBSCRIPTION_PLANS,
} from '@/lib/auth/register-options';
import { createClient } from '@/lib/supabase-browser';
import type { UserRoleEnum, UserStatusEnum } from '@/lib/supabase-app-types';
import type { Tables } from '@/types/supabase';
import DashboardHeader from '@/components/layout/DashboardHeader';
import { useState } from 'react';

type User = Tables<'profiles'>;

function formatProfileTypeLabel(value: string | null): string {
  if (!value?.trim()) return '';
  const row = PROFILE_TYPES.find((p) => p.value === value);
  return row?.label ?? value.replace(/_/g, ' ');
}

function formatAccessLabel(value: string | null): string {
  if (!value?.trim()) return '';
  if (value === 'subscription') return 'Subscription';
  if (value === 'one_time') return 'One-Time';
  return value.replace(/_/g, ' ');
}

function formatPlanLabel(key: string | null): string {
  if (!key?.trim()) return '';
  if (key === SUBSCRIPTION_PLANS.monthly.key) return SUBSCRIPTION_PLANS.monthly.label;
  if (key === SUBSCRIPTION_PLANS.annual.key) return SUBSCRIPTION_PLANS.annual.label;
  const ot = ONE_TIME_PRODUCTS.find((o) => o.key === key);
  if (ot) return ot.title;
  if (key === 'onetime_unknown') return 'One-time (unspecified)';
  return key.replace(/^onetime_/i, '').replace(/_/g, ' ');
}

function AccessBadge({ value }: { value: string | null }) {
  const label = formatAccessLabel(value);
  if (!label) {
    return (
      <span className="inline-flex rounded-full border border-transparent bg-[rgba(25,53,62,0.04)] px-2.5 py-0.5 text-[0.68rem] font-medium tracking-wide text-[rgba(25,53,62,0.38)]">
        N/A
      </span>
    );
  }
  const isSub = value === 'subscription';
  return (
    <span
      className={
        isSub
          ? 'inline-flex max-w-[11rem] truncate rounded-full border border-[rgba(25,53,62,0.22)] bg-[#19353E] px-2.5 py-0.5 text-[0.62rem] font-bold uppercase tracking-[0.08em] text-gold'
          : 'inline-flex max-w-[11rem] truncate rounded-full border border-[rgba(247,188,21,0.4)] bg-[rgba(247,188,21,0.12)] px-2.5 py-0.5 text-[0.62rem] font-bold uppercase tracking-[0.08em] text-[#19353E]'
      }
      title={label}
    >
      {label}
    </span>
  );
}

function ProfileBadge({ value }: { value: string | null }) {
  const label = formatProfileTypeLabel(value);
  if (!label) {
    return (
      <span className="inline-flex rounded-full border border-transparent bg-[rgba(25,53,62,0.04)] px-2.5 py-0.5 text-[0.68rem] font-medium tracking-wide text-[rgba(25,53,62,0.38)]">
        N/A
      </span>
    );
  }
  return (
    <span
      className="inline-flex max-w-[12rem] truncate rounded-full border border-[rgba(247,188,21,0.35)] bg-[rgba(247,188,21,0.14)] px-2.5 py-0.5 text-[0.65rem] font-semibold leading-tight tracking-wide text-[#19353E]"
      title={label}
    >
      {label}
    </span>
  );
}

function PlanBadge({ value }: { value: string | null }) {
  const label = formatPlanLabel(value);
  if (!label) {
    return (
      <span className="inline-flex rounded-full border border-transparent bg-[rgba(25,53,62,0.04)] px-2.5 py-0.5 text-[0.68rem] font-medium tracking-wide text-[rgba(25,53,62,0.38)]">
        N/A
      </span>
    );
  }
  const isSubscription =
    value === SUBSCRIPTION_PLANS.monthly.key || value === SUBSCRIPTION_PLANS.annual.key;
  return (
    <span
      className={
        isSubscription
          ? 'inline-flex max-w-[13rem] truncate rounded-full border border-[rgba(25,53,62,0.2)] bg-[#19353E] px-2.5 py-0.5 text-[0.62rem] font-bold uppercase tracking-[0.06em] text-gold'
          : 'inline-flex max-w-[13rem] truncate rounded-full border border-[rgba(247,188,21,0.38)] bg-[rgba(247,188,21,0.13)] px-2.5 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.04em] text-[#19353E]'
      }
      title={label}
    >
      {label}
    </span>
  );
}

const ADMIN_NAV = [
  { label: 'Overview', href: '/admin' },
  { label: 'Users', href: '/admin/users' },
  { label: 'Materials', href: '/admin/materials' },
  { label: 'Courses', href: '/admin/courses' },
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
      <DashboardHeader navItems={ADMIN_NAV} activeNav="/admin/users">
        <div className="dash-user-pill">
          <span className="role-badge">admin</span>
        </div>
        <a href="/admin" className="btn btn-outline btn-sm" style={{ color: 'rgba(255,255,255,0.6)', borderColor: 'rgba(255,255,255,0.2)' }}>
          ← Overview
        </a>
      </DashboardHeader>

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
            style={{ flex: 1, minWidth: 200, maxWidth: 360, padding: '9px 14px', background: '#fff', border: '1.5px solid rgba(25,53,62,0.12)', borderRadius: 3, fontFamily: "'Saira', sans-serif", fontSize: '0.9rem', fontWeight: 400, color: 'var(--teal)', outline: 'none' }}
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{ padding: '9px 32px 9px 12px', background: '#fff', border: '1.5px solid rgba(25,53,62,0.12)', borderRadius: 3, fontFamily: "'Saira', sans-serif", fontSize: '0.9rem', fontWeight: 400, color: 'var(--teal)', outline: 'none', cursor: 'pointer' }}
          >
            <option value="all">All Roles</option>
            <option value="user">User</option>
            <option value="mentor">Mentor</option>
            <option value="admin">Admin</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '9px 32px 9px 12px', background: '#fff', border: '1.5px solid rgba(25,53,62,0.12)', borderRadius: 3, fontFamily: "'Saira', sans-serif", fontSize: '0.9rem', fontWeight: 400, color: 'var(--teal)', outline: 'none', cursor: 'pointer' }}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="suspended">Suspended</option>
          </select>
          <span style={{ fontFamily: "'Saira', sans-serif", fontSize: '0.68rem', color: 'rgba(25,53,62,0.4)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Table — inner wrapper scrolls horizontally on narrow viewports */}
        <div className="table-wrap">
          <div
            className="-mx-1 overflow-x-auto sm:mx-0"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
          {filtered.length > 0 ? (
            <table style={{ minWidth: 960 }}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Profile Type</th>
                  <th>Access Type</th>
                  <th>Selected Plan</th>
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
                    <td style={{ fontFamily: "'Saira', sans-serif", color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 400, whiteSpace: 'nowrap' }}>
                      {u.email}
                    </td>
                    <td style={{ verticalAlign: 'middle' }}>
                      <ProfileBadge value={u.profile_type} />
                    </td>
                    <td style={{ verticalAlign: 'middle' }}>
                      <AccessBadge value={u.signup_access_type} />
                    </td>
                    <td style={{ verticalAlign: 'middle' }}>
                      <PlanBadge value={u.signup_plan_key} />
                    </td>
                    <td>
                      <select
                        value={u.role}
                        disabled={loading === u.id}
                        onChange={(e) => updateUser(u.id, { role: e.target.value as UserRoleEnum })}
                        style={{
                          padding: '4px 24px 4px 8px',
                          fontFamily: "'Saira', sans-serif",
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          letterSpacing: '0.14em',
                          textTransform: 'uppercase',
                          border: '1px solid rgba(25,53,62,0.15)',
                          borderRadius: 2,
                          cursor: 'pointer',
                          background: u.role === 'admin' ? 'var(--teal)' : u.role === 'mentor' ? 'var(--gold)' : 'rgba(25,53,62,0.08)',
                          color: u.role === 'mentor' ? 'var(--teal)' : u.role === 'admin' ? '#fff' : 'var(--teal)',
                          outline: 'none',
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
                        onChange={(e) => updateUser(u.id, { status: e.target.value as UserStatusEnum })}
                        style={{
                          padding: '4px 24px 4px 8px',
                          fontFamily: "'Saira', sans-serif",
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          letterSpacing: '0.14em',
                          textTransform: 'uppercase',
                          border: '1px solid rgba(25,53,62,0.15)',
                          borderRadius: 2,
                          cursor: 'pointer',
                          background: u.status === 'active' ? 'rgba(56,161,105,0.12)' : u.status === 'pending' ? 'rgba(247,188,21,0.15)' : 'rgba(229,62,62,0.12)',
                          color: u.status === 'active' ? '#276749' : u.status === 'pending' ? '#92600a' : '#c53030',
                          outline: 'none',
                        }}
                      >
                        <option value="pending">Pending</option>
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </td>
                    <td style={{ fontFamily: "'Saira', sans-serif", color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 400 }}>
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
    </div>
  );
}
