import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { getSupabaseAuthCookieOptions, getSupabaseAuthStorageKey } from '@/lib/supabase/auth-cookie';

/**
 * Server Supabase client. Uses `getAll` / `setAll` so chunked auth cookies stay in sync
 * with middleware and `@supabase/ssr` (replaces deprecated `get` / `set` / `remove`).
 */
export function createClient(): SupabaseClient<Database> {
  const cookieStore = cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      ...getSupabaseAuthCookieOptions(),
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set({ name, value, ...options });
            });
          } catch {
            // Called from a Server Component: cookies are read-only. Middleware still refreshes the session.
          }
        },
      },
    }
  ) as unknown as SupabaseClient<Database>;
}

/**
 * Server Supabase client for sign-in that respects "Remember me".
 * Pass `maxAge` (seconds) to persist the session cookie; omit for a session cookie.
 */
export function createLoginClient(maxAge?: number): SupabaseClient<Database> {
  const cookieStore = cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: { name: getSupabaseAuthStorageKey() },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set({
                name,
                value,
                ...options,
                ...(maxAge !== undefined ? { maxAge } : {}),
              });
            });
          } catch {
            // Read-only context (Server Component) — middleware handles refresh.
          }
        },
      },
    }
  ) as unknown as SupabaseClient<Database>;
}
