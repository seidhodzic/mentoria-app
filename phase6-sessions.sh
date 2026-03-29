#!/bin/bash
BASE="/Users/seid/Desktop/mentoria-mvp"
echo "Writing Phase 6 — Mentor Sessions..."

mkdir -p "$BASE/app/mentor/sessions"
mkdir -p "$BASE/app/user/sessions"
mkdir -p "$BASE/app/admin/sessions"

# ── MENTOR SESSIONS PAGE ──
cat > "$BASE/app/mentor/sessions/page.tsx" << 'EOF'
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { normalizeRole } from '@/lib/role';
import MentorSessionsClient from './MentorSessionsClient';

export default async function MentorSessionsPage() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');
  const { data: profile } = await supabase.from('profiles').select('role, full_name').eq('id', session.user.id).single();
  if (normalizeRole(profile?.role) !== 'mentor' && normalizeRole(profile?.role) !== 'admin') redirect('/dashboard');

  const { data: sessions } = await supabase
    .from('sessions')
    .select('*, profiles!sessions_user_id_fkey(full_name, email)')
    .eq('mentor_id', session.user.id)
    .order('scheduled_at', { ascending: true });

  const { data: requests } = await supabase
    .from('session_requests')
    .select('*, profiles!session_requests_user_id_fkey(full_name, email)')
    .eq('mentor_id', session.user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  const { data: allUsers } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('role', 'user')
    .eq('status', 'active');

  return <MentorSessionsClient
    mentorId={session.user.id}
    mentorName={profile?.full_name ?? ''}
    sessions={sessions ?? []}
    requests={requests ?? []}
    users={allUsers ?? []}
  />;
}
EOF

cat > "$BASE/app/mentor/sessions/MentorSessionsClient.tsx" << 'EOF'
'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase-browser';
import Link from 'next/link';

type Session = {
  id: string; title: string; description: string | null;
  type: string; status: string; meet_link: string | null;
  scheduled_at: string; duration_minutes: number;
  max_participants: number; notes: string | null;
  profiles?: { full_name: string | null; email: string } | null;
};
type Request = {
  id: string; topic: string; message: string | null;
  preferred_time: string | null; status: string; created_at: string;
  profiles?: { full_name: string | null; email: string } | null;
};
type User = { id: string; full_name: string | null; email: string };

const MENTOR_NAV = [
  { label: 'Overview', href: '/mentor' },
  { label: 'Members', href: '/mentor/members' },
  { label: 'Sessions', href: '/mentor/sessions' },
  { label: 'Materials', href: '/mentor/materials' },
];

export default function MentorSessionsClient({ mentorId, mentorName, sessions: initial, requests: initialReqs, users }: {
  mentorId: string; mentorName: string;
  sessions: Session[]; requests: Request[]; users: User[];
}) {
  const [sessions, setSessions] = useState<Session[]>(initial);
  const [requests, setRequests] = useState<Request[]>(initialReqs);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'sessions' | 'requests'>('sessions');

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('1on1');
  const [meetLink, setMeetLink] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [duration, setDuration] = useState('60');
  const [maxParticipants, setMaxParticipants] = useState('1');
  const [selectedUser, setSelectedUser] = useState('');
  const [notes, setNotes] = useState('');

  function showMsg(t: 'success' | 'error', text: string) {
    setMessage({ type: t, text });
    setTimeout(() => setMessage(null), 4000);
  }

  async function createSession(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !scheduledAt) return;
    setSaving(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.from('sessions').insert({
        title: title.trim(),
        description: description.trim() || null,
        mentor_id: mentorId,
        user_id: selectedUser || null,
        type,
        meet_link: meetLink.trim() || null,
        scheduled_at: new Date(scheduledAt).toISOString(),
        duration_minutes: parseInt(duration),
        max_participants: type === 'group' ? parseInt(maxParticipants) : 1,
        notes: notes.trim() || null,
        status: 'scheduled',
      }).select('*, profiles!sessions_user_id_fkey(full_name, email)').single();
      if (error) throw error;
      setSessions(prev => [data, ...prev].sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()));
      setTitle(''); setDescription(''); setMeetLink(''); setScheduledAt('');
      setDuration('60'); setMaxParticipants('1'); setSelectedUser(''); setNotes('');
      setShowForm(false);
      showMsg('success', `Session "${data.title}" created.`);
    } catch (err) {
      showMsg('error', err instanceof Error ? err.message : 'Failed to create session.');
    } finally { setSaving(false); }
  }

  async function updateSession(id: string, updates: Partial<Session>) {
    try {
      const supabase = createClient();
      const { error } = await supabase.from('sessions').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
      setSessions(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
      showMsg('success', 'Session updated.');
    } catch { showMsg('error', 'Update failed.'); }
  }

  async function handleRequest(reqId: string, action: 'approved' | 'declined', userId?: string) {
    try {
      const supabase = createClient();
      await supabase.from('session_requests').update({ status: action }).eq('id', reqId);
      setRequests(prev => prev.filter(r => r.id !== reqId));
      showMsg('success', `Request ${action}.`);
    } catch { showMsg('error', 'Failed to update request.'); }
  }

  function formatDate(dt: string) {
    return new Date(dt).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  const upcoming = sessions.filter(s => new Date(s.scheduled_at) >= new Date() && s.status !== 'cancelled');
  const past = sessions.filter(s => new Date(s.scheduled_at) < new Date() || s.status === 'completed');

  return (
    <div className="dash-layout">
      <header className="dash-header">
        <Link href="/dashboard" className="dash-brand">Mentor<span>ia</span></Link>
        <nav className="dash-nav">
          {MENTOR_NAV.map(item => (
            <Link key={item.href} href={item.href as any} className={item.href === '/mentor/sessions' ? 'active' : ''}>{item.label}</Link>
          ))}
        </nav>
        <div className="dash-header-right">
          <button onClick={() => setShowForm(v => !v)} className="btn btn-primary btn-sm">
            {showForm ? '✕ Cancel' : '+ New Session'}
          </button>
        </div>
      </header>

      <div className="dash-content">
        <div className="page-header">
          <div className="eyebrow">Mentor — Sessions</div>
          <h1>Mentoring Sessions</h1>
          <p>Create and manage 1-on-1 and group sessions with Google Meet.</p>
        </div>

        {message && <div className={message.type === 'success' ? 'auth-success' : 'auth-error'} style={{ marginBottom: 16 }}>{message.text}</div>}

        {/* Create session form */}
        {showForm && (
          <div className="card" style={{ marginBottom: 24 }}>
            <h3 style={{ marginBottom: 20 }}>Create New Session</h3>
            <form onSubmit={createSession}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Session Title *</label>
                  <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. FIFA Agent Exam Strategy" required />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Session Type</label>
                  <select value={type} onChange={e => { setType(e.target.value); if (e.target.value === '1on1') setMaxParticipants('1'); }}>
                    <option value="1on1">1-on-1 Session</option>
                    <option value="group">Group Session</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Date & Time *</label>
                  <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} required />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Duration (minutes)</label>
                  <select value={duration} onChange={e => setDuration(e.target.value)}>
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">60 minutes</option>
                    <option value="90">90 minutes</option>
                    <option value="120">2 hours</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Google Meet Link</label>
                <input value={meetLink} onChange={e => setMeetLink(e.target.value)} placeholder="https://meet.google.com/xxx-xxxx-xxx" />
              </div>
              {type === '1on1' && (
                <div className="form-group">
                  <label>Assign to Member (optional)</label>
                  <select value={selectedUser} onChange={e => setSelectedUser(e.target.value)}>
                    <option value="">Select a member...</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.full_name ?? u.email}</option>)}
                  </select>
                </div>
              )}
              {type === 'group' && (
                <div className="form-group">
                  <label>Max Participants</label>
                  <input type="number" value={maxParticipants} onChange={e => setMaxParticipants(e.target.value)} min="2" max="50" />
                </div>
              )}
              <div className="form-group">
                <label>Description</label>
                <input value={description} onChange={e => setDescription(e.target.value)} placeholder="What will this session cover?" />
              </div>
              <div className="form-group">
                <label>Internal Notes</label>
                <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Private notes (not visible to members)" />
              </div>
              <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Creating...' : 'Create Session'}</button>
            </form>
          </div>
        )}

        {/* Stats */}
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', marginBottom: 24 }}>
          <div className="stat-card"><div className="stat-label">Upcoming</div><div className="stat-value">{upcoming.length}</div></div>
          <div className="stat-card"><div className="stat-label">Completed</div><div className="stat-value">{past.length}</div></div>
          <div className="stat-card"><div className="stat-label">Pending Requests</div><div className="stat-value">{requests.length}</div></div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
          {(['sessions', 'requests'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`btn btn-sm ${activeTab === tab ? 'btn-teal' : 'btn-outline'}`}>
              {tab === 'sessions' ? `Sessions (${sessions.length})` : `Requests (${requests.length})`}
            </button>
          ))}
        </div>

        {/* Sessions tab */}
        {activeTab === 'sessions' && (
          <>
            {upcoming.length > 0 && (
              <>
                <div className="section-header" style={{ marginBottom: 12 }}><h2>Upcoming</h2></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
                  {upcoming.map(s => (
                    <SessionCard key={s.id} session={s} onUpdate={updateSession} formatDate={formatDate} isMentor />
                  ))}
                </div>
              </>
            )}
            {past.length > 0 && (
              <>
                <div className="section-header" style={{ marginBottom: 12 }}><h2>Past Sessions</h2></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {past.map(s => (
                    <SessionCard key={s.id} session={s} onUpdate={updateSession} formatDate={formatDate} isMentor />
                  ))}
                </div>
              </>
            )}
            {sessions.length === 0 && (
              <div className="empty-state"><h3>No sessions yet</h3><p>Click "New Session" to create your first session.</p></div>
            )}
          </>
        )}

        {/* Requests tab */}
        {activeTab === 'requests' && (
          <div className="table-wrap">
            {requests.length > 0 ? (
              <table>
                <thead><tr><th>Member</th><th>Topic</th><th>Preferred Time</th><th>Message</th><th>Actions</th></tr></thead>
                <tbody>
                  {requests.map(r => (
                    <tr key={r.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{(r.profiles as any)?.full_name ?? '—'}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{(r.profiles as any)?.email}</div>
                      </td>
                      <td style={{ fontWeight: 500 }}>{r.topic}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{r.preferred_time ?? '—'}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem', maxWidth: 200 }}>{r.message ?? '—'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => handleRequest(r.id, 'approved')} className="btn btn-primary btn-sm">Approve</button>
                          <button onClick={() => handleRequest(r.id, 'declined')} className="btn btn-danger btn-sm">Decline</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state"><h3>No pending requests</h3><p>Session requests from members will appear here.</p></div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SessionCard({ session, onUpdate, formatDate, isMentor }: {
  session: Session; onUpdate: (id: string, updates: any) => void;
  formatDate: (d: string) => string; isMentor?: boolean;
}) {
  const [editingLink, setEditingLink] = useState(false);
  const [newLink, setNewLink] = useState(session.meet_link ?? '');
  const isPast = new Date(session.scheduled_at) < new Date();
  const profile = session.profiles as any;

  return (
    <div style={{
      background: '#fff', borderRadius: 3,
      border: `1px solid ${isPast ? 'rgba(25,53,62,0.06)' : 'rgba(25,53,62,0.1)'}`,
      padding: '20px 24px', opacity: isPast ? 0.75 : 1,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'Saira Condensed,sans-serif', fontWeight: 900, fontSize: '1rem', textTransform: 'uppercase', color: 'var(--teal)' }}>{session.title}</span>
            <span className={`badge ${session.type === 'group' ? 'badge-mentor' : 'badge-user'}`}>{session.type === 'group' ? 'Group' : '1-on-1'}</span>
            <span className={`badge ${session.status === 'completed' ? 'badge-active' : session.status === 'cancelled' ? 'badge-suspended' : 'badge-pending'}`}>{session.status}</span>
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 6 }}>
            📅 {formatDate(session.scheduled_at)} · {session.duration_minutes} min
          </div>
          {profile?.full_name && (
            <div style={{ fontSize: '0.78rem', color: 'rgba(25,53,62,0.5)', marginBottom: 6 }}>
              👤 {profile.full_name} ({profile.email})
            </div>
          )}
          {session.description && (
            <div style={{ fontSize: '0.82rem', color: 'rgba(25,53,62,0.6)', marginBottom: 8 }}>{session.description}</div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
          {session.meet_link ? (
            <a href={session.meet_link} target="_blank" rel="noopener noreferrer"
              className="btn btn-primary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
              </svg>
              Join Meet
            </a>
          ) : isMentor ? (
            <button onClick={() => setEditingLink(true)} className="btn btn-outline btn-sm">+ Add Meet Link</button>
          ) : (
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>No link yet</span>
          )}
          {isMentor && session.status === 'scheduled' && (
            <button onClick={() => onUpdate(session.id, { status: 'completed' })} className="btn btn-outline btn-sm" style={{ fontSize: '0.65rem' }}>
              Mark Complete
            </button>
          )}
          {isMentor && session.status !== 'cancelled' && session.status !== 'completed' && (
            <button onClick={() => onUpdate(session.id, { status: 'cancelled' })} className="btn btn-danger btn-sm" style={{ fontSize: '0.65rem' }}>
              Cancel
            </button>
          )}
        </div>
      </div>
      {editingLink && (
        <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
          <input value={newLink} onChange={e => setNewLink(e.target.value)}
            placeholder="https://meet.google.com/xxx-xxxx-xxx"
            style={{ flex: 1, padding: '8px 12px', border: '1.5px solid rgba(25,53,62,0.15)', borderRadius: 3, fontFamily: 'Saira,sans-serif', fontSize: '0.85rem', outline: 'none' }}
          />
          <button onClick={() => { onUpdate(session.id, { meet_link: newLink }); setEditingLink(false); }} className="btn btn-primary btn-sm">Save</button>
          <button onClick={() => setEditingLink(false)} className="btn btn-outline btn-sm">Cancel</button>
        </div>
      )}
    </div>
  );
}
EOF

# ── USER SESSIONS PAGE ──
cat > "$BASE/app/user/sessions/page.tsx" << 'EOF'
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import UserSessionsClient from './UserSessionsClient';

export default async function UserSessionsPage() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('full_name, email').eq('id', session.user.id).single();

  const { data: mySessions } = await supabase
    .from('sessions')
    .select('*, profiles!sessions_mentor_id_fkey(full_name, email)')
    .eq('user_id', session.user.id)
    .order('scheduled_at', { ascending: true });

  const { data: groupSessions } = await supabase
    .from('sessions')
    .select('*, profiles!sessions_mentor_id_fkey(full_name, email)')
    .eq('type', 'group')
    .eq('status', 'scheduled')
    .order('scheduled_at', { ascending: true });

  const { data: myRequests } = await supabase
    .from('session_requests')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false });

  const { data: mentors } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('role', 'mentor')
    .eq('status', 'active');

  return <UserSessionsClient
    userId={session.user.id}
    userName={profile?.full_name ?? ''}
    mySessions={mySessions ?? []}
    groupSessions={groupSessions ?? []}
    myRequests={myRequests ?? []}
    mentors={mentors ?? []}
  />;
}
EOF

cat > "$BASE/app/user/sessions/UserSessionsClient.tsx" << 'EOF'
'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase-browser';
import Link from 'next/link';

type Session = {
  id: string; title: string; description: string | null;
  type: string; status: string; meet_link: string | null;
  scheduled_at: string; duration_minutes: number;
  profiles?: { full_name: string | null; email: string } | null;
};
type Request = { id: string; topic: string; message: string | null; preferred_time: string | null; status: string; created_at: string; };
type Mentor = { id: string; full_name: string | null; email: string; };

const USER_NAV = [
  { label: 'Overview', href: '/user' },
  { label: 'Courses', href: '/user/courses' },
  { label: 'Materials', href: '/user/materials' },
  { label: 'Quizzes', href: '/user/quizzes' },
  { label: 'Sessions', href: '/user/sessions' },
];

export default function UserSessionsClient({ userId, userName, mySessions, groupSessions, myRequests: initialReqs, mentors }: {
  userId: string; userName: string;
  mySessions: Session[]; groupSessions: Session[];
  myRequests: Request[]; mentors: Mentor[];
}) {
  const [myRequests, setMyRequests] = useState<Request[]>(initialReqs);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [topic, setTopic] = useState('');
  const [reqMessage, setReqMessage] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [selectedMentor, setSelectedMentor] = useState('');

  function showMsg(t: 'success' | 'error', text: string) {
    setMessage({ type: t, text });
    setTimeout(() => setMessage(null), 4000);
  }

  async function submitRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!topic.trim()) return;
    setSaving(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.from('session_requests').insert({
        user_id: userId,
        mentor_id: selectedMentor || null,
        topic: topic.trim(),
        message: reqMessage.trim() || null,
        preferred_time: preferredTime.trim() || null,
        status: 'pending',
      }).select().single();
      if (error) throw error;
      setMyRequests(prev => [data, ...prev]);
      setTopic(''); setReqMessage(''); setPreferredTime(''); setSelectedMentor('');
      setShowForm(false);
      showMsg('success', 'Session request submitted. Your mentor will be in touch.');
    } catch (err) {
      showMsg('error', err instanceof Error ? err.message : 'Failed to submit request.');
    } finally { setSaving(false); }
  }

  function formatDate(dt: string) {
    return new Date(dt).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  const upcoming = mySessions.filter(s => new Date(s.scheduled_at) >= new Date() && s.status !== 'cancelled');
  const past = mySessions.filter(s => new Date(s.scheduled_at) < new Date() || s.status === 'completed');

  return (
    <div className="dash-layout">
      <header className="dash-header">
        <Link href="/dashboard" className="dash-brand">Mentor<span>ia</span></Link>
        <nav className="dash-nav">
          {USER_NAV.map(item => (
            <Link key={item.href} href={item.href as any} className={item.href === '/user/sessions' ? 'active' : ''}>{item.label}</Link>
          ))}
        </nav>
        <div className="dash-header-right">
          <button onClick={() => setShowForm(v => !v)} className="btn btn-primary btn-sm">
            {showForm ? '✕ Cancel' : '+ Request Session'}
          </button>
        </div>
      </header>

      <div className="dash-content">
        <div className="page-header">
          <div className="eyebrow">Members — Sessions</div>
          <h1>Mentor Sessions</h1>
          <p>Book 1-on-1 sessions or join group sessions with your Mentoria mentor.</p>
        </div>

        {message && <div className={message.type === 'success' ? 'auth-success' : 'auth-error'} style={{ marginBottom: 16 }}>{message.text}</div>}

        {/* Request form */}
        {showForm && (
          <div className="card" style={{ marginBottom: 24 }}>
            <h3 style={{ marginBottom: 20 }}>Request a Session</h3>
            <form onSubmit={submitRequest}>
              <div className="form-group">
                <label>Topic *</label>
                <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. FIFA Agent Exam preparation strategy" required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Preferred Mentor (optional)</label>
                  <select value={selectedMentor} onChange={e => setSelectedMentor(e.target.value)}>
                    <option value="">Any available mentor</option>
                    {mentors.map(m => <option key={m.id} value={m.id}>{m.full_name ?? m.email}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Preferred Time</label>
                  <input value={preferredTime} onChange={e => setPreferredTime(e.target.value)} placeholder="e.g. Weekday evenings, after 6pm" />
                </div>
              </div>
              <div className="form-group">
                <label>Additional Message</label>
                <textarea value={reqMessage} onChange={e => setReqMessage(e.target.value)}
                  placeholder="Tell your mentor what you'd like to focus on..."
                  rows={3} style={{ resize: 'vertical' }} />
              </div>
              <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Submitting...' : 'Submit Request'}</button>
            </form>
          </div>
        )}

        {/* Stats */}
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', marginBottom: 24 }}>
          <div className="stat-card"><div className="stat-label">Upcoming</div><div className="stat-value">{upcoming.length}</div></div>
          <div className="stat-card"><div className="stat-label">Completed</div><div className="stat-value">{past.length}</div></div>
          <div className="stat-card"><div className="stat-label">Pending Requests</div><div className="stat-value">{myRequests.filter(r => r.status === 'pending').length}</div></div>
        </div>

        {/* Upcoming sessions */}
        {upcoming.length > 0 && (
          <>
            <div className="section-header" style={{ marginBottom: 12 }}><h2>Your Upcoming Sessions</h2></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
              {upcoming.map(s => {
                const mentor = s.profiles as any;
                return (
                  <div key={s.id} style={{ background: '#fff', borderRadius: 3, border: '1px solid rgba(25,53,62,0.1)', padding: '20px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontFamily: 'Saira Condensed,sans-serif', fontWeight: 900, fontSize: '1rem', textTransform: 'uppercase', color: 'var(--teal)' }}>{s.title}</span>
                          <span className={`badge ${s.type === 'group' ? 'badge-mentor' : 'badge-user'}`}>{s.type === 'group' ? 'Group' : '1-on-1'}</span>
                        </div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 4 }}>📅 {formatDate(s.scheduled_at)} · {s.duration_minutes} min</div>
                        {mentor?.full_name && <div style={{ fontSize: '0.78rem', color: 'rgba(25,53,62,0.5)' }}>👤 Mentor: {mentor.full_name}</div>}
                        {s.description && <div style={{ fontSize: '0.82rem', color: 'rgba(25,53,62,0.6)', marginTop: 6 }}>{s.description}</div>}
                      </div>
                      {s.meet_link ? (
                        <a href={s.meet_link} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                          </svg>
                          Join Meet
                        </a>
                      ) : (
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', padding: '6px 12px', border: '1px solid rgba(25,53,62,0.1)', borderRadius: 3 }}>Link pending</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Group sessions available */}
        {groupSessions.length > 0 && (
          <>
            <div className="section-header" style={{ marginBottom: 12 }}><h2>Available Group Sessions</h2></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
              {groupSessions.map(s => {
                const mentor = s.profiles as any;
                return (
                  <div key={s.id} style={{ background: '#fff', borderRadius: 3, border: '1.5px solid rgba(247,188,21,0.25)', padding: '20px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontFamily: 'Saira Condensed,sans-serif', fontWeight: 900, fontSize: '1rem', textTransform: 'uppercase', color: 'var(--teal)' }}>{s.title}</span>
                          <span className="badge badge-mentor">Group</span>
                          <span className="badge badge-active">Open</span>
                        </div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 4 }}>📅 {formatDate(s.scheduled_at)} · {s.duration_minutes} min</div>
                        {mentor?.full_name && <div style={{ fontSize: '0.78rem', color: 'rgba(25,53,62,0.5)' }}>👤 Mentor: {mentor.full_name}</div>}
                        {s.description && <div style={{ fontSize: '0.82rem', color: 'rgba(25,53,62,0.6)', marginTop: 6 }}>{s.description}</div>}
                      </div>
                      {s.meet_link && (
                        <a href={s.meet_link} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm">Join Session</a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* My requests */}
        {myRequests.length > 0 && (
          <>
            <div className="section-header" style={{ marginBottom: 12 }}><h2>My Requests</h2></div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Topic</th><th>Preferred Time</th><th>Status</th><th>Submitted</th></tr></thead>
                <tbody>
                  {myRequests.map(r => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 500 }}>{r.topic}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{r.preferred_time ?? '—'}</td>
                      <td><span className={`badge ${r.status === 'approved' ? 'badge-active' : r.status === 'declined' ? 'badge-suspended' : 'badge-pending'}`}>{r.status}</span></td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{new Date(r.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {upcoming.length === 0 && groupSessions.length === 0 && myRequests.length === 0 && (
          <div className="empty-state">
            <h3>No sessions yet</h3>
            <p>Click "Request Session" to book time with a Mentoria mentor.</p>
          </div>
        )}
      </div>
    </div>
  );
}
EOF

echo ""
echo "================================================"
echo "  Phase 6 — Mentor Sessions complete!"
echo "================================================"
echo ""
echo "Run: npm run dev"
echo ""
echo "New pages:"
echo "  /mentor/sessions  — create & manage sessions + approve requests"
echo "  /user/sessions    — view sessions, join Meet, submit requests"
echo ""
echo "Features:"
echo "  Mentor: create 1-on-1 or group sessions, add Google Meet link,"
echo "          assign to specific member, approve/decline requests,"
echo "          mark complete, cancel"
echo "  User:   view upcoming sessions, join via Meet link,"
echo "          see open group sessions, submit session requests,"
echo "          track request status"
