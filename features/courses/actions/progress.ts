'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase-server';
import type { Tables } from '@/types/supabase';

export async function recordLessonView(
  lessonId: string,
  courseId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Unauthorized' };

  const { data: existing } = await supabase
    .from('progress')
    .select('id, completed')
    .eq('user_id', user.id)
    .eq('lesson_id', lessonId)
    .maybeSingle();

  if (!existing) {
    const { error } = await supabase.from('progress').insert({
      user_id: user.id,
      lesson_id: lessonId,
      completed: false,
    });
    if (error) return { ok: false, error: error.message };
  }
  // Row view tracking: no separate updated_at in generated API for progress; DB defaults handle timestamps if present.

  revalidatePath(`/user/courses/${courseId}`);
  return { ok: true };
}

export async function markLessonComplete(
  lessonId: string,
  courseId: string
): Promise<
  | { ok: true; progress: Tables<'progress'> }
  | { ok: false; error: string }
> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Unauthorized' };

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('progress')
    .upsert(
      {
        user_id: user.id,
        lesson_id: lessonId,
        completed: true,
        completed_at: now,
      },
      { onConflict: 'user_id,lesson_id' }
    )
    .select()
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? 'Save failed' };

  revalidatePath(`/user/courses/${courseId}`);
  return { ok: true, progress: data };
}
