'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase-browser';
import DashboardHeader from '@/components/layout/DashboardHeader';
import { DASH_PRIMARY_ACTION_CLASS, DASH_PRIMARY_ACTION_HEADER_CLASS } from '@/lib/dashboard-ui';

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

export default function UserSessionsClient({ userId, userName, userEmail, mySessions, groupSessions, myRequests: initialReqs, mentors }: {
  userId: string; userName: string; userEmail: string;
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
      fetch('/api/sessions/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'request_submitted',
          mentorEmail: mentors.find((m) => m.id === selectedMentor)?.email ?? 'admin@mentoria.com',
          mentorName: mentors.find((m) => m.id === selectedMentor)?.full_name ?? 'Mentor',
          memberName: userName,
          memberEmail: userEmail,
          topic,
          message: reqMessage,
          preferredTime,
        }),
      }).catch(() => {});
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
      <DashboardHeader navItems={USER_NAV} activeNav="/user/sessions">
        <button type="button" onClick={() => setShowForm(v => !v)} className={DASH_PRIMARY_ACTION_HEADER_CLASS}>
          {showForm ? '✕ Cancel' : '+ Request Session'}
        </button>
      </DashboardHeader>

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
              <div className="form-grid-2">
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
              <button className={DASH_PRIMARY_ACTION_CLASS} type="submit" disabled={saving}>{saving ? 'Submitting...' : 'Submit Request'}</button>
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
                          <span style={{ fontFamily: "'Saira Condensed', sans-serif", fontWeight: 900, fontSize: '1.1rem', letterSpacing: '0.02em', textTransform: 'uppercase', lineHeight: 1, color: 'var(--teal)' }}>{s.title}</span>
                          <span className={`badge ${s.type === 'group' ? 'badge-mentor' : 'badge-user'}`}>{s.type === 'group' ? 'Group' : '1-on-1'}</span>
                        </div>
                        <div style={{ fontFamily: "'Saira', sans-serif", fontSize: '0.88rem', fontWeight: 300, lineHeight: 1.8, color: 'var(--text-muted)', marginBottom: 4 }}>📅 {formatDate(s.scheduled_at)} · {s.duration_minutes} min</div>
                        {mentor?.full_name && <div style={{ fontFamily: "'Saira', sans-serif", fontSize: '0.88rem', fontWeight: 300, color: 'rgba(25,53,62,0.5)' }}>👤 Mentor: {mentor.full_name}</div>}
                        {s.description && <div style={{ fontFamily: "'Saira', sans-serif", fontSize: '0.88rem', fontWeight: 300, lineHeight: 1.75, color: 'rgba(25,53,62,0.6)', marginTop: 6 }}>{s.description}</div>}
                      </div>
                      {s.meet_link ? (
                        <a href={s.meet_link} target="_blank" rel="noopener noreferrer" className={DASH_PRIMARY_ACTION_CLASS} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                          </svg>
                          Join Meet
                        </a>
                      ) : (
                        <span style={{ fontFamily: "'Saira', sans-serif", fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', padding: '6px 12px', border: '1px solid rgba(25,53,62,0.1)', borderRadius: 3 }}>Link pending</span>
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
                          <span style={{ fontFamily: "'Saira Condensed', sans-serif", fontWeight: 900, fontSize: '1.1rem', letterSpacing: '0.02em', textTransform: 'uppercase', lineHeight: 1, color: 'var(--teal)' }}>{s.title}</span>
                          <span className="badge badge-mentor">Group</span>
                          <span className="badge badge-active">Open</span>
                        </div>
                        <div style={{ fontFamily: "'Saira', sans-serif", fontSize: '0.88rem', fontWeight: 300, lineHeight: 1.8, color: 'var(--text-muted)', marginBottom: 4 }}>📅 {formatDate(s.scheduled_at)} · {s.duration_minutes} min</div>
                        {mentor?.full_name && <div style={{ fontFamily: "'Saira', sans-serif", fontSize: '0.88rem', fontWeight: 300, color: 'rgba(25,53,62,0.5)' }}>👤 Mentor: {mentor.full_name}</div>}
                        {s.description && <div style={{ fontFamily: "'Saira', sans-serif", fontSize: '0.88rem', fontWeight: 300, lineHeight: 1.75, color: 'rgba(25,53,62,0.6)', marginTop: 6 }}>{s.description}</div>}
                      </div>
                      {s.meet_link && (
                        <a href={s.meet_link} target="_blank" rel="noopener noreferrer" className={DASH_PRIMARY_ACTION_CLASS}>Join Session</a>
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
                      <td style={{ fontFamily: "'Saira', sans-serif", color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 400 }}>{r.preferred_time ?? '—'}</td>
                      <td><span className={`badge ${r.status === 'approved' ? 'badge-active' : r.status === 'declined' ? 'badge-suspended' : 'badge-pending'}`}>{r.status}</span></td>
                      <td style={{ fontFamily: "'Saira', sans-serif", color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 400 }}>{new Date(r.created_at).toLocaleDateString()}</td>
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
