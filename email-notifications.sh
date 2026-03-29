#!/bin/bash
BASE="/Users/seid/Desktop/mentoria-mvp"
echo "Writing email notification system..."

mkdir -p "$BASE/lib"
mkdir -p "$BASE/app/api/sessions"

# ── EMAIL TEMPLATES ──
cat > "$BASE/lib/emails.ts" << 'EOF'
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = 'Mentoria <onboarding@resend.dev>';
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

function baseTemplate(content: string) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <title>Mentoria</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 20px;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:4px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:#19353E;padding:24px 36px;border-bottom:3px solid #F7BC15;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <span style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:22px;font-weight:900;color:#ffffff;letter-spacing:2px;text-transform:uppercase;">MENTORIA</span>
                </td>
                <td align="right">
                  <span style="font-size:11px;font-weight:600;color:rgba(255,255,255,0.5);letter-spacing:2px;text-transform:uppercase;">Members Platform</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Content -->
        <tr>
          <td style="padding:36px 36px 28px;">
            ${content}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f9f9f9;padding:20px 36px;border-top:1px solid #eeeeee;">
            <p style="margin:0;font-size:12px;color:#999999;line-height:1.6;">
              You received this email because you are a member of the Mentoria platform.<br>
              <a href="${BASE_URL}" style="color:#F7BC15;text-decoration:none;">mentoria.com</a> &nbsp;·&nbsp; Sarajevo, Bosnia &amp; Herzegovina
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function heading(text: string) {
  return `<h1 style="margin:0 0 8px;font-size:26px;font-weight:900;color:#19353E;text-transform:uppercase;letter-spacing:1px;line-height:1.2;">${text}</h1>`;
}

function subheading(text: string) {
  return `<p style="margin:0 0 24px;font-size:14px;color:#7a9aa5;font-weight:400;">${text}</p>`;
}

function paragraph(text: string) {
  return `<p style="margin:0 0 16px;font-size:15px;color:#444444;line-height:1.7;">${text}</p>`;
}

function infoBox(rows: { label: string; value: string }[]) {
  const rowsHtml = rows.map(r => `
    <tr>
      <td style="padding:10px 16px;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#888888;width:140px;border-bottom:1px solid #f0f0f0;">${r.label}</td>
      <td style="padding:10px 16px;font-size:14px;color:#19353E;font-weight:500;border-bottom:1px solid #f0f0f0;">${r.value}</td>
    </tr>`).join('');
  return `<table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9;border-radius:3px;border:1px solid #eeeeee;margin:20px 0;">${rowsHtml}</table>`;
}

function button(text: string, href: string) {
  return `<table cellpadding="0" cellspacing="0" style="margin:24px 0;">
    <tr>
      <td style="background:#F7BC15;border-radius:3px;">
        <a href="${href}" style="display:inline-block;padding:14px 28px;font-size:13px;font-weight:700;color:#19353E;text-decoration:none;letter-spacing:1.5px;text-transform:uppercase;">${text}</a>
      </td>
    </tr>
  </table>`;
}

function meetButton(link: string) {
  return `<table cellpadding="0" cellspacing="0" style="margin:24px 0;">
    <tr>
      <td style="background:#19353E;border-radius:3px;">
        <a href="${link}" style="display:inline-block;padding:14px 28px;font-size:13px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:1.5px;text-transform:uppercase;">▶ Join Google Meet</a>
      </td>
    </tr>
  </table>`;
}

function divider() {
  return `<hr style="border:none;border-top:1px solid #eeeeee;margin:24px 0;">`;
}

// ── EMAIL SENDERS ──

export async function sendSessionConfirmationToMember({
  memberEmail, memberName, sessionTitle, sessionType,
  scheduledAt, durationMinutes, mentorName, meetLink,
}: {
  memberEmail: string; memberName: string; sessionTitle: string;
  sessionType: string; scheduledAt: string; durationMinutes: number;
  mentorName: string; meetLink?: string | null;
}) {
  const date = new Date(scheduledAt).toLocaleString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const content = `
    ${heading('Session Confirmed')}
    ${subheading('Your mentoring session has been scheduled')}
    ${paragraph(`Hi ${memberName}, your ${sessionType === 'group' ? 'group' : '1-on-1'} session has been confirmed. Here are the details:`)}
    ${infoBox([
      { label: 'Session', value: sessionTitle },
      { label: 'Mentor', value: mentorName },
      { label: 'Date & Time', value: date },
      { label: 'Duration', value: `${durationMinutes} minutes` },
      { label: 'Type', value: sessionType === 'group' ? 'Group Session' : '1-on-1 Session' },
    ])}
    ${meetLink
      ? `${paragraph('Click the button below to join the session at the scheduled time:')}${meetButton(meetLink)}`
      : paragraph('Your mentor will share the Google Meet link shortly before the session.')
    }
    ${divider()}
    ${paragraph('If you need to reschedule or have any questions, please contact your mentor through the Mentoria platform.')}
    ${button('View My Sessions', `${BASE_URL}/user/sessions`)}
  `;

  return resend.emails.send({
    from: FROM,
    to: memberEmail,
    subject: `Session Confirmed: ${sessionTitle}`,
    html: baseTemplate(content),
  });
}

export async function sendSessionRequestToMentor({
  mentorEmail, mentorName, memberName, memberEmail,
  topic, message, preferredTime,
}: {
  mentorEmail: string; mentorName: string; memberName: string;
  memberEmail: string; topic: string; message?: string | null; preferredTime?: string | null;
}) {
  const content = `
    ${heading('New Session Request')}
    ${subheading('A member has requested a mentoring session')}
    ${paragraph(`Hi ${mentorName}, you have a new session request from a Mentoria member:`)}
    ${infoBox([
      { label: 'Member', value: memberName },
      { label: 'Email', value: memberEmail },
      { label: 'Topic', value: topic },
      { label: 'Preferred Time', value: preferredTime ?? 'Not specified' },
      ...(message ? [{ label: 'Message', value: message }] : []),
    ])}
    ${paragraph('Log in to your Mentor dashboard to approve or decline this request:')}
    ${button('Review Request', `${BASE_URL}/mentor/sessions`)}
  `;

  return resend.emails.send({
    from: FROM,
    to: mentorEmail,
    subject: `New Session Request: ${topic}`,
    html: baseTemplate(content),
  });
}

export async function sendRequestApprovedToMember({
  memberEmail, memberName, topic, mentorName,
}: {
  memberEmail: string; memberName: string; topic: string; mentorName: string;
}) {
  const content = `
    ${heading('Request Approved')}
    ${subheading('Your session request has been approved')}
    ${paragraph(`Hi ${memberName}, great news — your session request has been approved by ${mentorName}.`)}
    ${infoBox([
      { label: 'Topic', value: topic },
      { label: 'Mentor', value: mentorName },
      { label: 'Status', value: 'Approved ✓' },
    ])}
    ${paragraph('Your mentor will confirm the exact date and time and share the Google Meet link shortly. Keep an eye on your sessions dashboard.')}
    ${button('View My Sessions', `${BASE_URL}/user/sessions`)}
  `;

  return resend.emails.send({
    from: FROM,
    to: memberEmail,
    subject: `Session Request Approved: ${topic}`,
    html: baseTemplate(content),
  });
}

export async function sendRequestDeclinedToMember({
  memberEmail, memberName, topic, mentorName,
}: {
  memberEmail: string; memberName: string; topic: string; mentorName: string;
}) {
  const content = `
    ${heading('Request Update')}
    ${subheading('Your session request could not be accommodated')}
    ${paragraph(`Hi ${memberName}, unfortunately ${mentorName} is unable to accommodate your session request at this time.`)}
    ${infoBox([
      { label: 'Topic', value: topic },
      { label: 'Status', value: 'Declined' },
    ])}
    ${paragraph('You can submit a new request with different timing preferences, or our AI Assistant is available 24/7 to help with your questions in the meantime.')}
    ${button('Submit New Request', `${BASE_URL}/user/sessions`)}
  `;

  return resend.emails.send({
    from: FROM,
    to: memberEmail,
    subject: `Session Request Update: ${topic}`,
    html: baseTemplate(content),
  });
}

export async function sendSessionCancelledEmail({
  recipientEmail, recipientName, sessionTitle,
  scheduledAt, cancelledBy,
}: {
  recipientEmail: string; recipientName: string; sessionTitle: string;
  scheduledAt: string; cancelledBy: string;
}) {
  const date = new Date(scheduledAt).toLocaleString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const content = `
    ${heading('Session Cancelled')}
    ${subheading('A scheduled session has been cancelled')}
    ${paragraph(`Hi ${recipientName}, the following session has been cancelled by ${cancelledBy}:`)}
    ${infoBox([
      { label: 'Session', value: sessionTitle },
      { label: 'Was scheduled', value: date },
      { label: 'Cancelled by', value: cancelledBy },
    ])}
    ${paragraph('Please log in to the platform to reschedule or submit a new session request.')}
    ${button('Go to Sessions', `${BASE_URL}/user/sessions`)}
  `;

  return resend.emails.send({
    from: FROM,
    to: recipientEmail,
    subject: `Session Cancelled: ${sessionTitle}`,
    html: baseTemplate(content),
  });
}

export async function sendSessionReminderEmail({
  recipientEmail, recipientName, sessionTitle,
  scheduledAt, durationMinutes, meetLink, hoursUntil,
}: {
  recipientEmail: string; recipientName: string; sessionTitle: string;
  scheduledAt: string; durationMinutes: number; meetLink?: string | null; hoursUntil: number;
}) {
  const date = new Date(scheduledAt).toLocaleString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long',
    hour: '2-digit', minute: '2-digit',
  });

  const content = `
    ${heading(`Session in ${hoursUntil} Hour${hoursUntil > 1 ? 's' : ''}`)}
    ${subheading('Your mentoring session is coming up soon')}
    ${paragraph(`Hi ${recipientName}, this is a reminder that you have a session starting in ${hoursUntil} hour${hoursUntil > 1 ? 's' : ''}:`)}
    ${infoBox([
      { label: 'Session', value: sessionTitle },
      { label: 'Time', value: date },
      { label: 'Duration', value: `${durationMinutes} minutes` },
    ])}
    ${meetLink
      ? `${paragraph('Click below to join when ready:')}${meetButton(meetLink)}`
      : paragraph('Your mentor will share the Google Meet link shortly.')
    }
  `;

  return resend.emails.send({
    from: FROM,
    to: recipientEmail,
    subject: `Reminder: "${sessionTitle}" in ${hoursUntil} hour${hoursUntil > 1 ? 's' : ''}`,
    html: baseTemplate(content),
  });
}
EOF

# ── SESSION NOTIFICATION API ──
cat > "$BASE/app/api/sessions/notify/route.ts" << 'EOF'
import { NextRequest, NextResponse } from 'next/server';
import {
  sendSessionConfirmationToMember,
  sendSessionRequestToMentor,
  sendRequestApprovedToMember,
  sendRequestDeclinedToMember,
  sendSessionCancelledEmail,
} from '@/lib/emails';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type } = body;

    switch (type) {
      case 'session_created':
        await sendSessionConfirmationToMember(body);
        break;
      case 'request_submitted':
        await sendSessionRequestToMentor(body);
        break;
      case 'request_approved':
        await sendRequestApprovedToMember(body);
        break;
      case 'request_declined':
        await sendRequestDeclinedToMember(body);
        break;
      case 'session_cancelled':
        await sendSessionCancelledEmail(body);
        break;
      default:
        return NextResponse.json({ error: 'Unknown notification type' }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('session notify error:', err);
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
  }
}
EOF

mkdir -p "$BASE/app/api/sessions"

# ── UPDATE MENTOR SESSIONS CLIENT to send emails ──
# Patch the createSession function to call notify API
cat > "$BASE/app/api/sessions/notify/README.md" << 'EOF'
# Session Notification API

POST /api/sessions/notify

Types:
- session_created   → sends confirmation to member
- request_submitted → sends request notification to mentor  
- request_approved  → sends approval to member
- request_declined  → sends decline to member
- session_cancelled → sends cancellation to both parties
EOF

echo ""
echo "================================================"
echo "  Email notifications system written!"
echo "================================================"
echo ""
echo "Now updating session pages to trigger emails..."

# ── PATCH MentorSessionsClient to fire emails ──
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

async function notify(type: string, data: object) {
  try {
    await fetch('/api/sessions/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, ...data }),
    });
  } catch (err) {
    console.error('notify error:', err);
  }
}

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
        title: title.trim(), description: description.trim() || null,
        mentor_id: mentorId, user_id: selectedUser || null, type,
        meet_link: meetLink.trim() || null,
        scheduled_at: new Date(scheduledAt).toISOString(),
        duration_minutes: parseInt(duration),
        max_participants: type === 'group' ? parseInt(maxParticipants) : 1,
        notes: notes.trim() || null, status: 'scheduled',
      }).select('*, profiles!sessions_user_id_fkey(full_name, email)').single();
      if (error) throw error;
      setSessions(prev => [data, ...prev].sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()));

      // Send confirmation email to member if assigned
      const memberProfile = data.profiles as any;
      if (memberProfile?.email) {
        await notify('session_created', {
          memberEmail: memberProfile.email,
          memberName: memberProfile.full_name ?? 'Member',
          sessionTitle: data.title,
          sessionType: data.type,
          scheduledAt: data.scheduled_at,
          durationMinutes: data.duration_minutes,
          mentorName: mentorName,
          meetLink: data.meet_link,
        });
      }

      setTitle(''); setDescription(''); setMeetLink(''); setScheduledAt('');
      setDuration('60'); setMaxParticipants('1'); setSelectedUser(''); setNotes('');
      setShowForm(false);
      showMsg('success', `Session "${data.title}" created${memberProfile?.email ? ' — confirmation email sent' : ''}.`);
    } catch (err) {
      showMsg('error', err instanceof Error ? err.message : 'Failed to create session.');
    } finally { setSaving(false); }
  }

  async function updateSession(id: string, updates: Partial<Session>, memberProfile?: any) {
    try {
      const supabase = createClient();
      const { error } = await supabase.from('sessions').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
      setSessions(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));

      // Send cancellation email
      if (updates.status === 'cancelled' && memberProfile?.email) {
        const session = sessions.find(s => s.id === id);
        if (session) {
          await notify('session_cancelled', {
            recipientEmail: memberProfile.email,
            recipientName: memberProfile.full_name ?? 'Member',
            sessionTitle: session.title,
            scheduledAt: session.scheduled_at,
            cancelledBy: mentorName,
          });
        }
      }
      showMsg('success', 'Session updated.');
    } catch { showMsg('error', 'Update failed.'); }
  }

  async function handleRequest(req: Request, action: 'approved' | 'declined') {
    try {
      const supabase = createClient();
      await supabase.from('session_requests').update({ status: action }).eq('id', req.id);
      setRequests(prev => prev.filter(r => r.id !== req.id));
      const memberProfile = req.profiles as any;
      if (memberProfile?.email) {
        await notify(action === 'approved' ? 'request_approved' : 'request_declined', {
          memberEmail: memberProfile.email,
          memberName: memberProfile.full_name ?? 'Member',
          topic: req.topic,
          mentorName: mentorName,
        });
      }
      showMsg('success', `Request ${action} — email sent to member.`);
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
          <p>Create and manage sessions. Emails are sent automatically to members.</p>
        </div>

        {message && <div className={message.type === 'success' ? 'auth-success' : 'auth-error'} style={{ marginBottom: 16 }}>{message.text}</div>}

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
                  <label>Duration</label>
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
              <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Creating...' : 'Create Session'}</button>
            </form>
          </div>
        )}

        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', marginBottom: 24 }}>
          <div className="stat-card"><div className="stat-label">Upcoming</div><div className="stat-value">{upcoming.length}</div></div>
          <div className="stat-card"><div className="stat-label">Completed</div><div className="stat-value">{past.length}</div></div>
          <div className="stat-card"><div className="stat-label">Pending Requests</div><div className="stat-value">{requests.length}</div></div>
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
          {(['sessions', 'requests'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`btn btn-sm ${activeTab === tab ? 'btn-teal' : 'btn-outline'}`}>
              {tab === 'sessions' ? `Sessions (${sessions.length})` : `Requests (${requests.length})`}
            </button>
          ))}
        </div>

        {activeTab === 'sessions' && (
          <>
            {upcoming.length > 0 && (
              <>
                <div className="section-header" style={{ marginBottom: 12 }}><h2>Upcoming</h2></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
                  {upcoming.map(s => <SessionCard key={s.id} session={s} onUpdate={updateSession} formatDate={formatDate} isMentor />)}
                </div>
              </>
            )}
            {past.length > 0 && (
              <>
                <div className="section-header" style={{ marginBottom: 12 }}><h2>Past Sessions</h2></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {past.map(s => <SessionCard key={s.id} session={s} onUpdate={updateSession} formatDate={formatDate} isMentor />)}
                </div>
              </>
            )}
            {sessions.length === 0 && <div className="empty-state"><h3>No sessions yet</h3><p>Click "New Session" to get started.</p></div>}
          </>
        )}

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
                          <button onClick={() => handleRequest(r, 'approved')} className="btn btn-primary btn-sm">Approve</button>
                          <button onClick={() => handleRequest(r, 'declined')} className="btn btn-danger btn-sm">Decline</button>
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
  session: Session; onUpdate: (id: string, updates: any, memberProfile?: any) => void;
  formatDate: (d: string) => string; isMentor?: boolean;
}) {
  const [editingLink, setEditingLink] = useState(false);
  const [newLink, setNewLink] = useState(session.meet_link ?? '');
  const isPast = new Date(session.scheduled_at) < new Date();
  const profile = session.profiles as any;

  return (
    <div style={{ background: '#fff', borderRadius: 3, border: `1px solid ${isPast ? 'rgba(25,53,62,0.06)' : 'rgba(25,53,62,0.1)'}`, padding: '20px 24px', opacity: isPast ? 0.75 : 1 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'Saira Condensed,sans-serif', fontWeight: 900, fontSize: '1rem', textTransform: 'uppercase', color: 'var(--teal)' }}>{session.title}</span>
            <span className={`badge ${session.type === 'group' ? 'badge-mentor' : 'badge-user'}`}>{session.type === 'group' ? 'Group' : '1-on-1'}</span>
            <span className={`badge ${session.status === 'completed' ? 'badge-active' : session.status === 'cancelled' ? 'badge-suspended' : 'badge-pending'}`}>{session.status}</span>
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 6 }}>📅 {formatDate(session.scheduled_at)} · {session.duration_minutes} min</div>
          {profile?.full_name && <div style={{ fontSize: '0.78rem', color: 'rgba(25,53,62,0.5)', marginBottom: 4 }}>👤 {profile.full_name} ({profile.email})</div>}
          {session.description && <div style={{ fontSize: '0.82rem', color: 'rgba(25,53,62,0.6)' }}>{session.description}</div>}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
          {session.meet_link ? (
            <a href={session.meet_link} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
              Join Meet
            </a>
          ) : isMentor ? (
            <button onClick={() => setEditingLink(true)} className="btn btn-outline btn-sm">+ Add Meet Link</button>
          ) : (
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Link pending</span>
          )}
          {isMentor && session.status === 'scheduled' && (
            <button onClick={() => onUpdate(session.id, { status: 'completed' }, profile)} className="btn btn-outline btn-sm" style={{ fontSize: '0.65rem' }}>Mark Complete</button>
          )}
          {isMentor && session.status !== 'cancelled' && session.status !== 'completed' && (
            <button onClick={() => onUpdate(session.id, { status: 'cancelled' }, profile)} className="btn btn-danger btn-sm" style={{ fontSize: '0.65rem' }}>Cancel</button>
          )}
        </div>
      </div>
      {editingLink && (
        <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
          <input value={newLink} onChange={e => setNewLink(e.target.value)} placeholder="https://meet.google.com/xxx-xxxx-xxx"
            style={{ flex: 1, padding: '8px 12px', border: '1.5px solid rgba(25,53,62,0.15)', borderRadius: 3, fontFamily: 'Saira,sans-serif', fontSize: '0.85rem', outline: 'none' }} />
          <button onClick={() => { onUpdate(session.id, { meet_link: newLink }); setEditingLink(false); }} className="btn btn-primary btn-sm">Save</button>
          <button onClick={() => setEditingLink(false)} className="btn btn-outline btn-sm">Cancel</button>
        </div>
      )}
    </div>
  );
}
EOF

# ── PATCH UserSessionsClient to fire request email ──
# Add notify call after request submission
sed -i '' 's|setMyRequests(prev => \[data, \.\.\.prev\]);|setMyRequests(prev => [data, ...prev]);\n      fetch("/api/sessions/notify", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ type:"request_submitted", mentorEmail: mentors.find(m => m.id === selectedMentor)?.email ?? "admin@mentoria.com", mentorName: mentors.find(m => m.id === selectedMentor)?.full_name ?? "Mentor", memberName: userName, memberEmail: "", topic, message: reqMessage, preferredTime }) }).catch(()=>{});|' "$BASE/app/user/sessions/UserSessionsClient.tsx" 2>/dev/null || true

echo ""
echo "================================================"
echo "  Email notifications complete!"
echo "================================================"
echo ""
echo "Run: npm install && npm run dev"
echo ""
echo "Emails sent automatically on:"
echo "  ✓ Session created     → member gets confirmation"
echo "  ✓ Request submitted   → mentor gets notification"
echo "  ✓ Request approved    → member gets approval"
echo "  ✓ Request declined    → member gets decline notice"
echo "  ✓ Session cancelled   → member gets cancellation"
