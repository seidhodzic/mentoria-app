import { requireUserForApi } from '@/lib/server/auth';
import { NextRequest, NextResponse } from 'next/server';
import {
  sendSessionConfirmationToMember,
  sendSessionRequestToMentor,
  sendRequestApprovedToMember,
  sendRequestDeclinedToMember,
  sendSessionCancelledEmail,
} from '@/lib/emails';

export async function POST(req: NextRequest) {
  const auth = await requireUserForApi();
  if (auth.unauthorized) return auth.unauthorized;

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
        return NextResponse.json({ error: 'Unknown type' }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('session notify error:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 });
  }
}
