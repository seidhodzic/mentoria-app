import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { getSupabaseAuthCookieOptions } from '@/lib/supabase/auth-cookie';

export function createClient(): SupabaseClient<Database> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (process.env.NODE_ENV === 'development' && (!url?.trim() || !key?.trim())) {
    console.error(
      '[Supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in env. Restart `npm run dev` after editing .env.local.'
    );
  }
  // Cast: @supabase/ssr generic arity differs from SupabaseClient<Database> in this dependency set.
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      ...getSupabaseAuthCookieOptions(),
    }
  ) as unknown as SupabaseClient<Database>;
}
