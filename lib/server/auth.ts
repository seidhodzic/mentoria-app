import { redirect } from 'next/navigation';
import { NextResponse } from 'next/server';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { memberHasPremiumAccess } from '@/lib/member-entitlement';
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

/**
 * Premium courses, quizzes, and AI APIs — active/trialing subscription, one-time purchase, or staff roles.
 */
export async function requirePremiumForApi(): Promise<
  | { supabase: ServerClient; user: User; unauthorized: null }
  | { supabase: null; user: null; unauthorized: NextResponse }
> {
  const base = await requireUserForApi();
  if (base.unauthorized) return base;
  const { supabase, user } = base;

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();

  const { data: subRows } = await supabase
    .from('subscriptions')
    .select('status, plan')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1);

  const sub = subRows?.[0];
  const latestSub = sub?.status ?? null;
  const latestPlan = sub?.plan ?? null;
  if (!memberHasPremiumAccess(profile, latestSub, latestPlan)) {
    return {
      supabase: null,
      user: null,
      unauthorized: NextResponse.json(
        { error: 'Premium subscription required', code: 'PREMIUM_REQUIRED' },
        { status: 403 }
      ),
    };
  }

  return { supabase, user, unauthorized: null };
}
