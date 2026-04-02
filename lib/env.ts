function normalizeBaseUrl(url: string): string {
  return url.replace(/\/$/, '');
}

/**
 * Canonical public origin for Stripe redirects, emails, and server-side URLs.
 *
 * Priority:
 * 1. `NEXT_PUBLIC_SITE_URL` — set in Vercel to your production domain.
 * 2. `VERCEL_URL` — Vercel sets this; used as https://… if (1) is missing.
 * 3. `http://localhost:3000` — local development only.
 */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) {
    return normalizeBaseUrl(explicit);
  }
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const host = vercel.replace(/^https?:\/\//i, '');
    return `https://${host}`;
  }
  return 'http://localhost:3000';
}

export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  get siteUrl() {
    return getSiteUrl();
  },
  adminNotificationEmail: process.env.ADMIN_NOTIFICATION_EMAIL ?? '',
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  /** Optional; if set, signup notify Server Action requires the same value as `NEXT_PUBLIC_SIGNUP_NOTIFY_TOKEN`. */
  signupNotifySecret: process.env.SIGNUP_NOTIFY_SECRET ?? '',
  /** Server-only — Stripe Checkout & webhooks (`STRIPE_PRICE_*` price IDs: `lib/payments/stripe-prices.ts`) */
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? '',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? '',
};
