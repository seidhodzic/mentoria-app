import type { PostgrestError } from '@supabase/supabase-js';

/**
 * Throws on Supabase/PostgREST errors so route `error.tsx` runs instead of showing empty UI.
 * Use `ignoreCodes` for `.single()` when you handle "no row" yourself (e.g. redirect).
 */
export function throwIfSupabaseError(
  error: PostgrestError | null,
  context?: string,
  options?: { ignoreCodes?: string[] }
): void {
  if (!error) return;
  if (options?.ignoreCodes?.includes(error.code)) return;
  const msg = context ? `${context}: ${error.message}` : error.message;
  throw new Error(msg);
}
