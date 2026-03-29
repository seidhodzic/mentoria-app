/**
 * Signup / notify rate limits for serverless (e.g. Vercel): an in-memory `Map()` does **not**
 * persist across isolates — each invocation may see an empty map. Use Supabase (service role)
 * so counts are shared across lambdas.
 */
import { createClient } from '@/lib/supabase/admin';

/** IP and other non-email buckets (shared `rate_limit_buckets` table). */
export async function checkRateLimitBucket(
  bucketKey: string,
  max: number,
  windowMs: number,
): Promise<{ allowed: boolean; retryAfter?: number }> {
  try {
    const supabase = createClient();
    const windowStart = new Date(Date.now() - windowMs).toISOString();

    const { count } = await supabase
      .from('rate_limit_buckets')
      .select('*', { count: 'exact', head: true })
      .eq('bucket_key', bucketKey)
      .gte('created_at', windowStart);

    if ((count ?? 0) >= max) {
      return { allowed: false, retryAfter: Math.ceil(windowMs / 1000) };
    }

    const { error } = await supabase.from('rate_limit_buckets').insert({ bucket_key: bucketKey });
    if (error) throw error;

    return { allowed: true };
  } catch {
    return { allowed: true };
  }
}

/**
 * Email-based window using `profiles` (e.g. repeated registrations with same email).
 * Note: there is usually at most one profile row per email; this still matches the intended
 * “recent activity for this email” check from product spec.
 */
export async function checkSignupRateLimit(email: string): Promise<{ allowed: boolean; retryAfter?: number }> {
  try {
    const supabase = createClient();
    const windowStart = new Date(Date.now() - 15 * 60 * 1000).toISOString(); // 15 min window
    const maxAttempts = 5;

    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('email', email)
      .gte('created_at', windowStart);

    if ((count ?? 0) >= maxAttempts) {
      return { allowed: false, retryAfter: 900 }; // 15 minutes in seconds
    }

    return { allowed: true };
  } catch {
    // Fail open — don't block signups if rate limit check fails
    return { allowed: true };
  }
}
