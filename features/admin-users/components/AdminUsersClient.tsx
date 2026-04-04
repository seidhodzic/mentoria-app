'use client';

import {
  ONE_TIME_PRODUCTS,
  PROFILE_TYPES,
  SUBSCRIPTION_PLANS,
} from '@/lib/auth/register-options';
import type { UserRoleEnum, UserStatusEnum } from '@/lib/supabase-app-types';
import DashboardHeader from '@/components/layout/DashboardHeader';
import {
  DASH_PRIMARY_ACTION_HEADER_CLASS,
  DASH_TABLE_ACTION_CLASS,
} from '@/lib/dashboard-ui';
import { useState } from 'react';
import type { AdminUserRow } from '@/features/admin-users/types';
import {
  adminDeleteUserAction,
  adminGrantPremiumAction,
  adminRevokePremiumAction,
  adminUpdateProfileAction,
} from '@/features/admin-users/actions';

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

function isPremiumSubStatus(status: string | null | undefined): boolean {
  if (status == null || status === '') return false;
  const s = status.trim().toLowerCase();
  return s === 'active' || s === 'trialing';
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

function PremiumBadge({ active }: { active: boolean }) {
  return (
    <span
      className={
        active
          ? 'inline-flex max-w-[14rem] truncate rounded-full border border-[rgba(56,161,105,0.45)] bg-[rgba(56,161,105,0.12)] px-2.5 py-0.5 text-[0.62rem] font-bold uppercase tracking-[0.06em] text-[#276749]'
          : 'inline-flex max-w-[14rem] truncate rounded-full border border-[rgba(25,53,62,0.15)] bg-[rgba(25,53,62,0.06)] px-2.5 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.04em] text-[rgba(25,53,62,0.45)]'
      }
    >
      {active ? 'Premium' : 'No'}
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

type Props = {
  users: AdminUserRow[];
  currentAdminId: string;
  userDeletionEnabled: boolean;
};

export default function AdminUsersClient({
  users: initialUsers,
  currentAdminId,
  userDeletionEnabled,
}: Props) {
  const [users, setUsers] = useState<AdminUserRow[]>(initialUsers);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUserRow | null>(null);
  const [deleteEmailInput, setDeleteEmailInput] = useState('');

  function showMessage(type: 'success' | 'error', text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  }

  async function runForUser<T extends { ok: boolean; error?: string }>(
    userId: string,
    fn: () => Promise<T>
  ): Promise<boolean> {
    setLoading(userId);
    setMessage(null);
    try {
      const res = await fn();
      if (!res.ok) {
        showMessage('error', 'error' in res && res.error ? res.error : 'Action failed.');
        return false;
      }
      showMessage('success', 'Done.');
      return true;
    } catch (err) {
      showMessage('error', err instanceof Error ? err.message : 'Action failed.');
      return false;
    } finally {
      setLoading(null);
    }
  }

  async function updateProfile(userId: string, patch: { role?: UserRoleEnum; status?: UserStatusEnum }) {
    const ok = await runForUser(userId, () => adminUpdateProfileAction({ targetUserId: userId, ...patch }));
    if (!ok) return;
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, ...patch, updated_at: new Date().toISOString() } : u))
    );
  }

  async function grantPremium(userId: string) {
    const ok = await runForUser(userId, () => adminGrantPremiumAction({ targetUserId: userId }));
    if (!ok) return;
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== userId) return u;
        const sub = u.subscription
          ? {
              ...u.subscription,
              plan: 'admin_grant',
              status: 'active',
              stripe_subscription_id: null,
            }
          : {
              plan: 'admin_grant',
              status: 'active',
              stripe_subscription_id: null,
              stripe_customer_id: null,
              current_period_end: new Date('2099-12-31T23:59:59.000Z').toISOString(),
            };
        return {
          ...u,
          subscription: sub,
          premiumAccess: true,
          premiumSourceLabel: 'Admin grant',
          subscription_status: 'active',
          is_active: true,
        };
      })
    );
  }

  async function revokePremium(userId: string) {
    const ok = await runForUser(userId, () => adminRevokePremiumAction({ targetUserId: userId }));
    if (!ok) return;
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== userId) return u;
        const sub = u.subscription
          ? { ...u.subscription, status: 'inactive' as const, current_period_end: null }
          : u.subscription;
        const next: AdminUserRow = {
          ...u,
          subscription: sub,
          subscription_status: 'inactive',
          subscription_current_period_end: null,
        };
        if (u.signup_access_type === 'subscription') {
          next.is_active = false;
        }
        next.premiumAccess = false;
        next.premiumSourceLabel = 'No premium access';
        return next;
      })
    );
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const ok = await runForUser(deleteTarget.id, () =>
      adminDeleteUserAction({
        targetUserId: deleteTarget.id,
        emailConfirmation: deleteEmailInput,
      })
    );
    if (!ok) return;
    setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
    setDeleteTarget(null);
    setDeleteEmailInput('');
  }

  const filtered = users.filter((u) => {
    const matchSearch =
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.full_name ?? '').toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    const matchStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  const counts = {
    total: users.length,
    active: users.filter((u) => u.status === 'active').length,
    pending: users.filter((u) => u.status === 'pending').length,
    suspended: users.filter((u) => u.status === 'suspended').length,
    admins: users.filter((u) => u.role === 'admin').length,
    mentors: users.filter((u) => u.role === 'mentor').length,
  };

  return (
    <div className="dash-layout">
      <DashboardHeader navItems={ADMIN_NAV} activeNav="/admin/users">
        <div className="dash-user-pill">
          <span className="role-badge">admin</span>
        </div>
        <a href="/admin" className={DASH_PRIMARY_ACTION_HEADER_CLASS}>
          ← Overview
        </a>
      </DashboardHeader>

      <div className="dash-content">
        <div className="page-header">
          <div className="eyebrow">Admin — User Management</div>
          <h1>All Members</h1>
          <p>Manage roles, access, activation, and accounts. Sensitive actions run on the server.</p>
        </div>

        {!userDeletionEnabled && (
          <div className="auth-error" style={{ marginBottom: 16 }}>
            User deletion is disabled: set <code>SUPABASE_SERVICE_ROLE_KEY</code> on the server (e.g. Vercel
            environment) to enable Auth deletion.
          </div>
        )}

        <div
          className="stats-grid"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', marginBottom: 24 }}
        >
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

        {message && (
          <div
            className={message.type === 'success' ? 'auth-success' : 'auth-error'}
            style={{ marginBottom: 16 }}
          >
            {message.text}
          </div>
        )}

        <div
          style={{
            display: 'flex',
            gap: 12,
            marginBottom: 16,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              minWidth: 200,
              maxWidth: 360,
              padding: '9px 14px',
              background: '#fff',
              border: '1.5px solid rgba(25,53,62,0.12)',
              borderRadius: 3,
              fontFamily: "'Saira', sans-serif",
              fontSize: '0.9rem',
              fontWeight: 400,
              color: 'var(--teal)',
              outline: 'none',
            }}
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{
              padding: '9px 32px 9px 12px',
              background: '#fff',
              border: '1.5px solid rgba(25,53,62,0.12)',
              borderRadius: 3,
              fontFamily: "'Saira', sans-serif",
              fontSize: '0.9rem',
              fontWeight: 400,
              color: 'var(--teal)',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="all">All Roles</option>
            <option value="user">User</option>
            <option value="mentor">Mentor</option>
            <option value="admin">Admin</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '9px 32px 9px 12px',
              background: '#fff',
              border: '1.5px solid rgba(25,53,62,0.12)',
              borderRadius: 3,
              fontFamily: "'Saira', sans-serif",
              fontSize: '0.9rem',
              fontWeight: 400,
              color: 'var(--teal)',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="suspended">Suspended</option>
          </select>
          <span
            style={{
              fontFamily: "'Saira', sans-serif",
              fontSize: '0.68rem',
              color: 'rgba(25,53,62,0.4)',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="table-wrap">
          <div className="-mx-1 overflow-x-auto sm:mx-0" style={{ WebkitOverflowScrolling: 'touch' }}>
            {filtered.length > 0 ? (
              <table style={{ minWidth: 1180 }}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Profile Type</th>
                    <th>Access Type</th>
                    <th>Selected Plan</th>
                    <th>Premium</th>
                    <th>Source</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => {
                    const sub = u.subscription;
                    const stripeLinkedSubscription =
                      Boolean(sub?.stripe_subscription_id) && sub?.plan === 'subscription';
                    const stripePremium =
                      stripeLinkedSubscription && isPremiumSubStatus(sub?.status);
                    const adminGrantActive =
                      sub?.plan === 'admin_grant' && isPremiumSubStatus(sub?.status);
                    const staff = u.role === 'admin' || u.role === 'mentor';
                    const canGrantPremium = !staff && !stripeLinkedSubscription && !adminGrantActive;
                    const canRevokePremium = adminGrantActive;
                    const isSelf = u.id === currentAdminId;

                    return (
                      <tr key={u.id}>
                        <td style={{ fontWeight: 600 }}>{u.full_name ?? '—'}</td>
                        <td
                          style={{
                            fontFamily: "'Saira', sans-serif",
                            color: 'var(--text-muted)',
                            fontSize: '0.85rem',
                            fontWeight: 400,
                            whiteSpace: 'nowrap',
                          }}
                        >
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
                        <td style={{ verticalAlign: 'middle' }}>
                          <PremiumBadge active={u.premiumAccess} />
                        </td>
                        <td
                          style={{
                            fontFamily: "'Saira', sans-serif",
                            fontSize: '0.78rem',
                            color: 'var(--text-muted)',
                            maxWidth: 160,
                          }}
                          title={u.premiumSourceLabel}
                        >
                          {u.premiumSourceLabel}
                        </td>
                        <td>
                          <select
                            value={u.role}
                            disabled={loading === u.id}
                            onChange={(e) =>
                              updateProfile(u.id, { role: e.target.value as UserRoleEnum })
                            }
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
                              background:
                                u.role === 'admin'
                                  ? 'var(--teal)'
                                  : u.role === 'mentor'
                                    ? 'var(--gold)'
                                    : 'rgba(25,53,62,0.08)',
                              color:
                                u.role === 'mentor' ? 'var(--teal)' : u.role === 'admin' ? '#fff' : 'var(--teal)',
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
                            onChange={(e) =>
                              updateProfile(u.id, { status: e.target.value as UserStatusEnum })
                            }
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
                              background:
                                u.status === 'active'
                                  ? 'rgba(56,161,105,0.12)'
                                  : u.status === 'pending'
                                    ? 'rgba(247,188,21,0.15)'
                                    : 'rgba(229,62,62,0.12)',
                              color:
                                u.status === 'active'
                                  ? '#276749'
                                  : u.status === 'pending'
                                    ? '#92600a'
                                    : '#c53030',
                              outline: 'none',
                            }}
                          >
                            <option value="pending">Pending</option>
                            <option value="active">Active</option>
                            <option value="suspended">Suspended</option>
                          </select>
                        </td>
                        <td
                          style={{
                            fontFamily: "'Saira', sans-serif",
                            color: 'var(--text-muted)',
                            fontSize: '0.85rem',
                            fontWeight: 400,
                          }}
                        >
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                        <td>
                          {loading === u.id ? (
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              Working…
                            </span>
                          ) : (
                            <div
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 8,
                                alignItems: 'flex-start',
                              }}
                            >
                              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                {u.status === 'pending' && (
                                  <button
                                    type="button"
                                    onClick={() => updateProfile(u.id, { status: 'active' })}
                                    className={DASH_TABLE_ACTION_CLASS}
                                  >
                                    Activate
                                  </button>
                                )}
                                {u.status === 'active' && (
                                  <button
                                    type="button"
                                    onClick={() => updateProfile(u.id, { status: 'suspended' })}
                                    className="btn btn-danger btn-sm"
                                  >
                                    Suspend
                                  </button>
                                )}
                                {u.status === 'suspended' && (
                                  <button
                                    type="button"
                                    onClick={() => updateProfile(u.id, { status: 'active' })}
                                    className={DASH_TABLE_ACTION_CLASS}
                                  >
                                    Restore
                                  </button>
                                )}
                              </div>
                              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                {canGrantPremium && (
                                  <button
                                    type="button"
                                    onClick={() => grantPremium(u.id)}
                                    className={DASH_TABLE_ACTION_CLASS}
                                  >
                                    Grant premium
                                  </button>
                                )}
                                {canRevokePremium && (
                                  <button
                                    type="button"
                                    onClick={() => revokePremium(u.id)}
                                    className="btn btn-danger btn-sm"
                                  >
                                    Revoke grant
                                  </button>
                                )}
                                {stripeLinkedSubscription && (
                                  <span
                                    style={{
                                      fontSize: '0.68rem',
                                      color: 'rgba(25,53,62,0.45)',
                                      maxWidth: 200,
                                    }}
                                  >
                                    {stripePremium ? 'Billing via Stripe' : 'Stripe-linked row — manage in Stripe'}
                                  </span>
                                )}
                              </div>
                              <div>
                                {!isSelf && userDeletionEnabled && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setDeleteTarget(u);
                                      setDeleteEmailInput('');
                                    }}
                                    className="btn btn-danger btn-sm"
                                  >
                                    Delete user
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
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

      {deleteTarget && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-user-title"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(25,53,62,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: 16,
          }}
        >
          <div
            style={{
              background: '#fff',
              maxWidth: 420,
              width: '100%',
              borderRadius: 4,
              padding: '20px 22px',
              boxShadow: '0 12px 40px rgba(25,53,62,0.18)',
            }}
          >
            <h2 id="delete-user-title" style={{ marginTop: 0, marginBottom: 8, fontSize: '1.1rem' }}>
              Delete user
            </h2>
            <p style={{ marginBottom: 12, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              This removes the account from Auth and deletes related data per your database rules. Type the
              member&apos;s email to confirm.
            </p>
            <p style={{ fontWeight: 600, marginBottom: 12, wordBreak: 'break-all' }}>{deleteTarget.email}</p>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: 6 }}>
              Email confirmation
            </label>
            <input
              value={deleteEmailInput}
              onChange={(e) => setDeleteEmailInput(e.target.value)}
              placeholder="Enter email exactly"
              style={{
                width: '100%',
                padding: '10px 12px',
                marginBottom: 14,
                border: '1.5px solid rgba(25,53,62,0.15)',
                borderRadius: 3,
                fontFamily: "'Saira', sans-serif",
                fontSize: '0.9rem',
              }}
              autoComplete="off"
            />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                type="button"
                className={DASH_TABLE_ACTION_CLASS}
                onClick={() => {
                  setDeleteTarget(null);
                  setDeleteEmailInput('');
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                disabled={loading === deleteTarget.id}
                onClick={() => void confirmDelete()}
              >
                {loading === deleteTarget.id ? 'Deleting…' : 'Delete permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
