/**
 * Single source for @supabase/ssr auth `storageKey` / cookie base name.
 * Matches hosted project ref so cookies don’t collide across Supabase projects or old local keys.
 *
 * Override: `NEXT_PUBLIC_SUPABASE_AUTH_COOKIE_NAME` (full storage key, e.g. sb-myproject-auth-token).
 */
export function getSupabaseAuthStorageKey(): string {
  const override = process.env.NEXT_PUBLIC_SUPABASE_AUTH_COOKIE_NAME?.trim();
  if (override) return override;

  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!raw) return 'sb-auth-token';

  try {
    const { hostname } = new URL(raw);
    const projectRef = hostname.split('.')[0];
    if (projectRef && hostname.endsWith('supabase.co')) {
      return `sb-${projectRef}-auth-token`;
    }
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'sb-local-auth-token';
    }
  } catch {
    /* ignore */
  }

  return 'sb-auth-token';
}

/** Pass-through for createServerClient / createBrowserClient `cookieOptions`. */
export function getSupabaseAuthCookieOptions() {
  return {
    cookieOptions: {
      name: getSupabaseAuthStorageKey(),
    },
  };
}

/** Deletes base + chunk cookies for the current storage key (PKCE sessions may split across chunks). */
export function deleteSupabaseAuthCookieChunks(
  deleteCookie: (name: string) => void
): void {
  const key = getSupabaseAuthStorageKey();
  deleteCookie(key);
  for (let i = 0; i < 10; i += 1) {
    deleteCookie(`${key}.${i}`);
  }
}
