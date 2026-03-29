import { requireUserForApi } from '@/lib/server/auth';
import { LIMITS, sanitizeText } from '@/lib/server/api-input';
import { NextRequest, NextResponse } from 'next/server';
import {
  sendSessionConfirmationToMember,
  sendSessionRequestToMentor,
  sendRequestApprovedToMember,
  sendRequestDeclinedToMember,
  sendSessionCancelledEmail,
} from '@/lib/emails';

const EMAIL_MAX = 254;

function sanitizeEmail(s: string): string {
  return sanitizeText(s, EMAIL_MAX).toLowerCase();
}

function parseIsoDate(s: string): string | null {
  const t = Date.parse(s);
  if (Number.isNaN(t)) return null;
  return new Date(t).toISOString();
}

export async function POST(req: NextRequest) {
  const auth = await requireUserForApi();
  if (auth.unauthorized) return auth.unauthorized;

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 });
  }

  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    return NextResponse.json({ error: 'Request body must be a non-empty JSON object' }, { status: 400 });
  }

  const body = raw as Record<string, unknown>;
  const type = typeof body.type === 'string' ? body.type.trim() : '';
  if (!type) {
    return NextResponse.json({ error: 'Missing or invalid type' }, { status: 400 });
  }

  try {
    switch (type) {
      case 'session_created': {
        const memberEmail = sanitizeEmail(String(body.memberEmail ?? ''));
        const memberName = sanitizeText(String(body.memberName ?? ''), LIMITS.shortLabel);
        const sessionTitle = sanitizeText(String(body.sessionTitle ?? ''), LIMITS.topic);
        const sessionType = sanitizeText(String(body.sessionType ?? ''), 32);
        const scheduledAt = parseIsoDate(String(body.scheduledAt ?? ''));
        const durationMinutes = Number(body.durationMinutes);
        const mentorName = sanitizeText(String(body.mentorName ?? ''), LIMITS.shortLabel);
        const meetLinkRaw = body.meetLink != null ? String(body.meetLink) : '';
        const meetLink = meetLinkRaw.trim() ? sanitizeText(meetLinkRaw, 500) : null;

        if (!memberEmail || !memberName || !sessionTitle || !sessionType || !scheduledAt) {
          return NextResponse.json({ error: 'Invalid session_created payload' }, { status: 400 });
        }
        if (!Number.isFinite(durationMinutes) || durationMinutes < 1 || durationMinutes > 24 * 60) {
          return NextResponse.json({ error: 'Invalid durationMinutes' }, { status: 400 });
        }

        await sendSessionConfirmationToMember({
          memberEmail,
          memberName,
          sessionTitle,
          sessionType,
          scheduledAt,
          durationMinutes,
          mentorName,
          meetLink,
        });
        break;
      }
      case 'request_submitted': {
        const mentorEmail = sanitizeEmail(String(body.mentorEmail ?? ''));
        const mentorName = sanitizeText(String(body.mentorName ?? ''), LIMITS.shortLabel);
        const memberName = sanitizeText(String(body.memberName ?? ''), LIMITS.shortLabel);
        const memberEmail = sanitizeEmail(String(body.memberEmail ?? ''));
        const topic = sanitizeText(String(body.topic ?? ''), LIMITS.topic);
        const message = body.message != null ? sanitizeText(String(body.message), LIMITS.message) : null;
        const preferredTime =
          body.preferredTime != null ? sanitizeText(String(body.preferredTime), LIMITS.shortLabel) : null;

        if (!mentorEmail || !mentorName || !memberName || !memberEmail || !topic) {
          return NextResponse.json({ error: 'Invalid request_submitted payload' }, { status: 400 });
        }

        await sendSessionRequestToMentor({
          mentorEmail,
          mentorName,
          memberName,
          memberEmail,
          topic,
          message: message || null,
          preferredTime,
        });
        break;
      }
      case 'request_approved': {
        const memberEmail = sanitizeEmail(String(body.memberEmail ?? ''));
        const memberName = sanitizeText(String(body.memberName ?? ''), LIMITS.shortLabel);
        const topic = sanitizeText(String(body.topic ?? ''), LIMITS.topic);
        const mentorName = sanitizeText(String(body.mentorName ?? ''), LIMITS.shortLabel);

        if (!memberEmail || !memberName || !topic || !mentorName) {
          return NextResponse.json({ error: 'Invalid request_approved payload' }, { status: 400 });
        }

        await sendRequestApprovedToMember({ memberEmail, memberName, topic, mentorName });
        break;
      }
      case 'request_declined': {
        const memberEmail = sanitizeEmail(String(body.memberEmail ?? ''));
        const memberName = sanitizeText(String(body.memberName ?? ''), LIMITS.shortLabel);
        const topic = sanitizeText(String(body.topic ?? ''), LIMITS.topic);
        const mentorName = sanitizeText(String(body.mentorName ?? ''), LIMITS.shortLabel);

        if (!memberEmail || !memberName || !topic || !mentorName) {
          return NextResponse.json({ error: 'Invalid request_declined payload' }, { status: 400 });
        }

        await sendRequestDeclinedToMember({ memberEmail, memberName, topic, mentorName });
        break;
      }
      case 'session_cancelled': {
        const recipientEmail = sanitizeEmail(String(body.recipientEmail ?? ''));
        const recipientName = sanitizeText(String(body.recipientName ?? ''), LIMITS.shortLabel);
        const sessionTitle = sanitizeText(String(body.sessionTitle ?? ''), LIMITS.topic);
        const scheduledAt = parseIsoDate(String(body.scheduledAt ?? ''));
        const cancelledBy = sanitizeText(String(body.cancelledBy ?? ''), LIMITS.shortLabel);

        if (!recipientEmail || !recipientName || !sessionTitle || !scheduledAt || !cancelledBy) {
          return NextResponse.json({ error: 'Invalid session_cancelled payload' }, { status: 400 });
        }

        await sendSessionCancelledEmail({
          recipientEmail,
          recipientName,
          sessionTitle,
          scheduledAt,
          cancelledBy,
        });
        break;
      }
      default:
        return NextResponse.json({ error: 'Unknown type' }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('session notify error:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 });
  }
}
