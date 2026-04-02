import { Resend } from 'resend';
import { getSiteUrl } from '@/lib/env';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = 'Mentoria <onboarding@resend.dev>';
const BASE_URL = getSiteUrl();

function supabasePublicStorageUrl(path: string): string {
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/\/$/, '');
  if (!base) return '';
  return `${base}/storage/v1/object/public/${path.replace(/^\//, '')}`;
}

const LOGO_URL =
  supabasePublicStorageUrl('materials/MENTORIA.png') ||
  `${BASE_URL}/mentoria-logo.svg`;

function baseTemplate(title: string, content: string, previewText: string = '') {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#F7BC15;font-family:'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">

  <div style="display:none;max-height:0;overflow:hidden;">${previewText}&nbsp;&zwnj;&nbsp;</div>

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F7BC15;min-height:100vh;">
    <tr>
      <td align="center" valign="top" style="padding:48px 20px;">
        <table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;">

          <!-- HEADER with logo -->
          <tr>
            <td style="background-color:#19353E;border-radius:12px 12px 0 0;padding:28px 40px;text-align:center;">
              <img src="${LOGO_URL}" alt="MENTORIA" width="180" height="auto"
                style="display:inline-block;max-width:180px;height:auto;border:0;outline:none;" />
            </td>
          </tr>

          <!-- GOLD ACCENT BAR -->
          <tr>
            <td style="background-color:#F7BC15;height:4px;font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- MAIN CONTENT -->
          <tr>
            <td style="background-color:#FFFFFF;padding:40px 40px 36px;">
              ${content}
            </td>
          </tr>

          <!-- BOTTOM GOLD BAR -->
          <tr>
            <td style="background-color:#F7BC15;height:4px;font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color:#19353E;padding:24px 40px;border-radius:0 0 12px 12px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <p style="margin:0 0 4px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#F7BC15;">MENTORIA</p>
                    <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:rgba(255,255,255,0.4);line-height:1.6;">
                      Digital Advisory Platform &nbsp;·&nbsp; Sarajevo, Bosnia &amp; Herzegovina
                    </p>
                  </td>
                  <td align="right" valign="middle">
                    <a href="${BASE_URL}" style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:rgba(255,255,255,0.35);text-decoration:none;letter-spacing:1px;text-transform:uppercase;">mentoria.com</a>
                  </td>
                </tr>
                <tr>
                  <td colspan="2" style="padding-top:16px;border-top:1px solid rgba(255,255,255,0.08);">
                    <p style="margin:8px 0 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:10px;color:rgba(255,255,255,0.22);line-height:1.6;text-align:center;">
                      You received this email as a Mentoria platform member.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function eyebrow(text: string) {
  return `<p style="margin:0 0 10px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#F7BC15;">${text}</p>`;
}

function heading(text: string) {
  return `<h1 style="margin:0 0 6px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:28px;font-weight:900;color:#19353E;letter-spacing:1px;line-height:1.15;text-transform:uppercase;">${text}</h1>`;
}

function subheading(text: string) {
  return `<p style="margin:0 0 28px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#7a9aa5;font-weight:400;line-height:1.5;">${text}</p>`;
}

function paragraph(text: string) {
  return `<p style="margin:0 0 18px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;color:#333333;line-height:1.75;font-weight:400;">${text}</p>`;
}

function divider() {
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
    <tr><td style="height:1px;background-color:#EFEFEF;font-size:0;line-height:0;">&nbsp;</td></tr>
  </table>`;
}

function infoBox(rows: { label: string; value: string }[]) {
  const rowsHtml = rows.map(r => `
    <tr>
      <td style="padding:12px 18px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#7a9aa5;width:130px;border-bottom:1px solid #ffffff;vertical-align:top;">${r.label}</td>
      <td style="padding:12px 18px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#19353E;font-weight:500;border-bottom:1px solid #ffffff;line-height:1.5;">${r.value}</td>
    </tr>`).join('');
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#EFEFEF;border-radius:12px;overflow:hidden;margin:20px 0;">
    ${rowsHtml}
  </table>`;
}

function button(text: string, href: string) {
  return `<table cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 8px;">
    <tr>
      <td style="background-color:#F7BC15;border-radius:30px;">
        <a href="${href}" style="display:inline-block;padding:15px 36px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;font-weight:700;color:#19353E;text-decoration:none;letter-spacing:2px;text-transform:uppercase;line-height:1;border-radius:30px;">${text}</a>
      </td>
    </tr>
  </table>`;
}

function meetButton(link: string) {
  return `<table cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 8px;">
    <tr>
      <td style="background-color:#19353E;border-radius:30px;border:2px solid #F7BC15;">
        <a href="${link}" style="display:inline-block;padding:15px 36px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;font-weight:700;color:#F7BC15;text-decoration:none;letter-spacing:2px;text-transform:uppercase;line-height:1;border-radius:30px;">&#9654; JOIN GOOGLE MEET</a>
      </td>
    </tr>
  </table>`;
}

function highlight(text: string) {
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;">
    <tr>
      <td style="background-color:#F7BC15;border-radius:12px;padding:16px 20px;">
        <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;font-weight:700;color:#19353E;line-height:1.5;">${text}</p>
      </td>
    </tr>
  </table>`;
}

export async function sendNewSignupNotificationToAdmin({
  adminEmail,
  memberEmail,
  fullName,
  profileType,
  accessType,
  planKey,
}: {
  adminEmail: string;
  memberEmail: string;
  fullName: string;
  profileType: string;
  accessType?: string;
  planKey?: string;
}) {
  const rows = [
    { label: 'Name', value: fullName || '—' },
    { label: 'Email', value: memberEmail },
    { label: 'Profile', value: profileType || '—' },
  ];
  if (accessType) rows.push({ label: 'Access', value: accessType });
  if (planKey) rows.push({ label: 'Plan', value: planKey });

  const content = `
    ${eyebrow('New registration')}
    ${heading('New Member Signup')}
    ${subheading('Someone just joined Mentoria.')}
    ${paragraph('A new account was created on the platform.')}
    ${infoBox(rows)}
    ${button('Open Admin', `${BASE_URL}/admin/users`)}
  `;
  return resend.emails.send({
    from: FROM,
    to: adminEmail,
    subject: `New signup: ${fullName || memberEmail}`,
    html: baseTemplate(`New signup: ${memberEmail}`, content, `New member: ${memberEmail}`),
  });
}

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
    ${eyebrow('Session Confirmed')}
    ${heading('Your Session is Booked')}
    ${subheading('Everything is confirmed — see you there.')}
    ${paragraph(`Hi <strong>${memberName}</strong>, your ${sessionType === 'group' ? 'group' : '1-on-1'} mentoring session has been confirmed:`)}
    ${infoBox([
      { label: 'Session', value: sessionTitle },
      { label: 'Mentor', value: mentorName },
      { label: 'Date & Time', value: date },
      { label: 'Duration', value: `${durationMinutes} minutes` },
      { label: 'Type', value: sessionType === 'group' ? 'Group Session' : '1-on-1 Session' },
    ])}
    ${meetLink ? `${paragraph('Click below to join at the scheduled time:')}${meetButton(meetLink)}` : highlight('Your mentor will share the Google Meet link shortly before the session.')}
    ${divider()}
    ${button('View My Sessions', `${BASE_URL}/user/sessions`)}
  `;
  return resend.emails.send({
    from: FROM, to: memberEmail,
    subject: `✓ Session Confirmed: ${sessionTitle}`,
    html: baseTemplate(`Session Confirmed: ${sessionTitle}`, content, `Your session with ${mentorName} is confirmed`),
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
    ${eyebrow('New Request')}
    ${heading('Session Request')}
    ${subheading('A member wants to book time with you.')}
    ${paragraph(`Hi <strong>${mentorName}</strong>, you have a new session request:`)}
    ${infoBox([
      { label: 'Member', value: memberName },
      { label: 'Email', value: memberEmail },
      { label: 'Topic', value: topic },
      { label: 'Preferred Time', value: preferredTime ?? 'Flexible' },
      ...(message ? [{ label: 'Message', value: message }] : []),
    ])}
    ${button('Review Request', `${BASE_URL}/mentor/sessions`)}
  `;
  return resend.emails.send({
    from: FROM, to: mentorEmail,
    subject: `New Session Request: ${topic}`,
    html: baseTemplate(`New Session Request: ${topic}`, content, `${memberName} has requested a session: ${topic}`),
  });
}

export async function sendRequestApprovedToMember({
  memberEmail, memberName, topic, mentorName,
}: {
  memberEmail: string; memberName: string; topic: string; mentorName: string;
}) {
  const content = `
    ${eyebrow('Request Approved')}
    ${heading('Great News!')}
    ${subheading('Your session request has been approved.')}
    ${highlight(`&#10003;&nbsp; ${mentorName} has accepted your session request.`)}
    ${infoBox([
      { label: 'Topic', value: topic },
      { label: 'Mentor', value: mentorName },
      { label: 'Status', value: 'Approved ✓' },
    ])}
    ${paragraph(`Hi <strong>${memberName}</strong>, your mentor will confirm the exact time and Meet link shortly.`)}
    ${button('View My Sessions', `${BASE_URL}/user/sessions`)}
  `;
  return resend.emails.send({
    from: FROM, to: memberEmail,
    subject: `✓ Request Approved: ${topic}`,
    html: baseTemplate(`Request Approved: ${topic}`, content, `${mentorName} approved your session request`),
  });
}

export async function sendRequestDeclinedToMember({
  memberEmail, memberName, topic, mentorName,
}: {
  memberEmail: string; memberName: string; topic: string; mentorName: string;
}) {
  const content = `
    ${eyebrow('Request Update')}
    ${heading('Session Update')}
    ${subheading('Your request could not be accommodated at this time.')}
    ${paragraph(`Hi <strong>${memberName}</strong>, unfortunately ${mentorName} is unable to accommodate your request at this time.`)}
    ${infoBox([
      { label: 'Topic', value: topic },
      { label: 'Status', value: 'Declined' },
    ])}
    ${paragraph('You can submit a new request with different timing preferences.')}
    ${button('Submit New Request', `${BASE_URL}/user/sessions`)}
  `;
  return resend.emails.send({
    from: FROM, to: memberEmail,
    subject: `Session Request Update: ${topic}`,
    html: baseTemplate(`Session Request Update: ${topic}`, content, `Update on your session request: ${topic}`),
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
    ${eyebrow('Session Update')}
    ${heading('Session Cancelled')}
    ${subheading('The following session has been cancelled.')}
    ${paragraph(`Hi <strong>${recipientName}</strong>, the session below has been cancelled by ${cancelledBy}.`)}
    ${infoBox([
      { label: 'Session', value: sessionTitle },
      { label: 'Was Scheduled', value: date },
      { label: 'Cancelled By', value: cancelledBy },
    ])}
    ${button('Go to Sessions', `${BASE_URL}/user/sessions`)}
  `;
  return resend.emails.send({
    from: FROM, to: recipientEmail,
    subject: `Session Cancelled: ${sessionTitle}`,
    html: baseTemplate(`Session Cancelled: ${sessionTitle}`, content, `Your session "${sessionTitle}" has been cancelled`),
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
    ${eyebrow(`Reminder — ${hoursUntil}h`)}
    ${heading(`Starting in ${hoursUntil} Hour${hoursUntil > 1 ? 's' : ''}`)}
    ${subheading('Your mentoring session is coming up soon.')}
    ${paragraph(`Hi <strong>${recipientName}</strong>, your session starts in <strong>${hoursUntil} hour${hoursUntil > 1 ? 's' : ''}</strong>.`)}
    ${infoBox([
      { label: 'Session', value: sessionTitle },
      { label: 'Time', value: date },
      { label: 'Duration', value: `${durationMinutes} minutes` },
    ])}
    ${meetLink ? `${paragraph('Click below to join:')}${meetButton(meetLink)}` : highlight('Your mentor will share the Google Meet link shortly.')}
  `;
  return resend.emails.send({
    from: FROM, to: recipientEmail,
    subject: `Reminder: "${sessionTitle}" in ${hoursUntil}h`,
    html: baseTemplate(`Session Reminder: ${sessionTitle}`, content, `Your session starts in ${hoursUntil} hour${hoursUntil > 1 ? 's' : ''}`),
  });
}
