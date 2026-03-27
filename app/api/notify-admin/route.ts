import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/env';

export async function POST(request: NextRequest) {
  const body = await request.json();

  const payload = {
    to: env.adminNotificationEmail || 'configure-admin-email@example.com',
    subject: 'New Mentoria registration',
    message: `New registration: ${body.fullName || 'Unknown name'} <${body.email}> as ${body.role}.`
  };

  // Replace this stub with Resend, SendGrid, Postmark, or Supabase Edge Function logic.
  console.log('ADMIN_NOTIFICATION', payload);

  return NextResponse.json({ ok: true, payload });
}
