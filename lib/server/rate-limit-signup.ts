/**
 * Simple fixed-window rate limiter (in-memory).
 * Sufficient for a single Node instance; on serverless, prefer Redis/Upstash for shared limits.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export function allowRateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const existing = buckets.get(key);
  if (!existing || now >= existing.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (existing.count >= max) return false;
  existing.count += 1;
  return true;
}
