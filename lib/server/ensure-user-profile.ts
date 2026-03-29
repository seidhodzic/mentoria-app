import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

/**
 * Ensures `public.profiles` has a row for this auth user (handles legacy users / missed triggers).
 */
export async function ensureUserProfile(
  supabase: SupabaseClient<Database>,
  user: User
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (existing) return { ok: true };

  const email = user.email?.trim() || '';
  const meta = user.user_metadata as { full_name?: string } | undefined;
  const fullName = meta?.full_name?.trim() || email.split('@')[0] || 'Member';

  const { error } = await supabase.from('profiles').upsert(
    {
      id: user.id,
      email: email || `user-${user.id}@placeholder.invalid`,
      full_name: fullName,
      role: 'user',
      status: 'active',
    },
    { onConflict: 'id' }
  );

  if (error) return { ok: false, message: error.message };
  return { ok: true };
}
