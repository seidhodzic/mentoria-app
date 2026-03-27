'use client';

import { createBrowserClient } from '@supabase/ssr';
import { assertPublicEnv, env } from './env';

export function createClient() {
  assertPublicEnv();
  return createBrowserClient(env.supabaseUrl, env.supabaseAnonKey);
}
