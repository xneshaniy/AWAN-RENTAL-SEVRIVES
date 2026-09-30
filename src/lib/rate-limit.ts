/**
 * Minimal in-memory sliding-window rate limiter for form submissions.
 *
 * Buckets live in this process (appropriate for a single Node server started
 * with `npm run start`); each caller namespaces its own keys, e.g.
 * `contact:<ip>:<email>`. Returns `true` when the attempt is allowed and
 * `false` when the key has exceeded `limit` inside `windowMs`.
 */
interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export function rateLimit(
  key: string,
  options: { limit?: number; windowMs?: number } = {}
): boolean {
  const { limit = 5, windowMs = 10 * 60 * 1000 } = options;
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });

    // Opportunistic cleanup so the map stays bounded under traffic.
    if (buckets.size > 1000) {
      buckets.forEach((entry, entryKey) => {
        if (entry.resetAt <= now) buckets.delete(entryKey);
      });
    }

    return true;
  }

  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

/** Best-effort client IP for rate-limit keying (proxy header aware). */
export function clientIpFromHeaders(headerStore: { get(name: string): string | null }): string {
  const forwarded = headerStore.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  return headerStore.get('x-real-ip') || 'unknown';
}
