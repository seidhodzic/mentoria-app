import { NextRequest, NextResponse } from 'next/server';
export async function POST(req: NextRequest) {
  try {
    const { email, fullName, role, profile_type } = await req.json();
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
    if (!adminEmail) { console.warn('ADMIN_NOTIFICATION_EMAIL not set'); return NextResponse.json({ ok:true, skipped:true }); }
    console.log(`New registration: ${fullName} (${email}) — ${role} / ${profile_type}`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('notify-admin error:', err);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
