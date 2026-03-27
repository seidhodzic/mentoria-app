export const env = {
  supabaseUrl:            process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey:        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  siteUrl:                process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  adminNotificationEmail: process.env.ADMIN_NOTIFICATION_EMAIL ?? '',
  serviceRoleKey:         process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
};
