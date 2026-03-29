import { redirect } from 'next/navigation';
import { NextResponse } from 'next/server';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase-server';
import type { Database } from '@/types/supabase';

type ServerClient = SupabaseClient<Database>;

/**
 * Server Components: verified user or redirect to login.
 */
export async function requireUser(): Promise<{ supabase: ServerClient; user: User }> {
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) redirect('/login');
  return { supabase, user };
}

/**
 * Route Handlers / Server Actions: verified user or 401 JSON response.
 */
export async function requireUserForApi(): Promise<
  | { supabase: ServerClient; user: User; unauthorized: null }
  | { supabase: null; user: null; unauthorized: NextResponse }
> {
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    return {
      supabase: null,
      user: null,
      unauthorized: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }
  return { supabase, user, unauthorized: null };
}
