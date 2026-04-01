/**
 * Maps common Supabase Auth API errors to actionable text.
 * "Error sending confirmation email" is returned when outbound mail fails (SMTP not set, rate limit, etc.).
 */
export function formatSupabaseAuthError(raw: string): string {
  const m = raw.trim();
  if (
    /error sending confirmation email/i.test(m) ||
    /error sending.*email/i.test(m) ||
    /email rate limit exceeded/i.test(m)
  ) {
    return (
      'Supabase could not send that email. In the Supabase Dashboard: Authentication → Emails: ' +
      'enable Custom SMTP (Resend, SendGrid, etc.), or for development turn off “Confirm email” under ' +
      'Authentication → Providers → Email. Ensure your app URL is listed under Authentication → URL Configuration → Redirect URLs.'
    );
  }
  return m;
}
