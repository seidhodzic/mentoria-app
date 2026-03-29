export const env = {
  supabaseUrl:            process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey:        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  siteUrl:                process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  adminNotificationEmail: process.env.ADMIN_NOTIFICATION_EMAIL ?? '',
  serviceRoleKey:         process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  /** Optional; if set, signup notify Server Action requires the same value as NEXT_PUBLIC_SIGNUP_NOTIFY_TOKEN. */
  signupNotifySecret:     process.env.SIGNUP_NOTIFY_SECRET ?? '',
  /** Server-only — Stripe Checkout & webhooks */
  stripeSecretKey:        process.env.STRIPE_SECRET_KEY ?? '',
  stripeWebhookSecret:    process.env.STRIPE_WEBHOOK_SECRET ?? '',
};
