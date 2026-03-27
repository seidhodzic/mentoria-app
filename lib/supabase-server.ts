import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { assertPublicEnv, env } from './env';

export function createClient() {
  assertPublicEnv();
  const cookieStore = cookies();

  return createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set() {},
      remove() {}
    }
  });
}
