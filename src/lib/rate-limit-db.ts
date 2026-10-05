/**
 * Durable, cross-instance rate limiting for form submissions and logins.
 *
 * The limiter in `./rate-limit` counts attempts in a process-local Map. That is
 * fine for `next start`, but on Vercel every serverless instance gets its own
 * Map, so a flood is only ever counted by whichever lambda received each
 * request - and a cold start resets the counter to zero. Persisting one row
 * per (scope, identifier, window) makes the count survive deploys and hold
 * across instances.
 *
 * THIS MODULE MUST NOT BE IMPORTED FROM `middleware.ts`: it pulls in Prisma,
 * which cannot run in the edge runtime. Middleware keeps using the plain
 * in-memory `rateLimit` as its first, cheap gate and this module is the
 * second, durable gate on the Node-runtime handlers only.
 *
 * Every function here fails OPEN. A rate limiter that throws must never block
 * a legitimate booking, contact form or sign-in - in that case the in-memory
 * bucket has still been applied and the behaviour degrades to what the project
 * shipped with before, rather than breaking the request outright.
 */
import { rateLimit } from '@/lib/rate-limit';

interface Options {
  limit?: number;
  windowMs?: number;
}

/**
 * Record an attempt and report whether it is allowed.
 *
 * Order matters: the in-memory bucket is checked first so a rejected caller
 * costs zero database work, then the shared counter decides globally. Passing
 * both is what makes this stricter than either limiter alone - the process-local
 * bucket catches fast bursts on this instance, the row catches distributed
 * ones.
 */
export async function rateLimitShared(
  key: string,
  options: Options = {}
): Promise<boolean> {
  // Fast local gate. Also the only gate when the database is unreachable.
  if (!rateLimit(key, options)) return false;

  const { limit = 5, windowMs = 10 * 60 * 1000 } = options;
  const now = Date.now();

  // The window index is part of the primary key, so an expired bucket can
  // never be read again - no sweeper has to run for correctness, and rolling
  // over to the next window is simply a different key.
  const windowStart = Math.floor(now / windowMs);
  const bucketKey = `${key}:${windowStart}`;
  const resetAt = new Date((windowStart + 1) * windowMs);

  try {
    // Lazy import keeps this file free of a static Prisma dependency, so the
    // module graph stays inspectable and a future accidental import from an
    // edge context fails at the usage site rather than at build time.
    const { prisma } = await import('@/lib/prisma');

    const row = await prisma.rateLimit.upsert({
      where: { key: bucketKey },
      create: { key: bucketKey, count: 1, resetAt },
      update: { count: { increment: 1 } },
    });

    // Deliberately leave the counter alone when over the limit: every further
    // attempt inside this window must also be rejected, and the row disappears
    // from play as soon as the window rolls over.
    if (row.count > limit) return false;

    // One cheap sweep per window per key keeps expired rows from accumulating
    // forever. Indexed on resetAt, and the table only ever holds active
    // buckets plus whatever has not been swept yet.
    if (row.count === 1) {
      await prisma.rateLimit.deleteMany({
        where: { resetAt: { lt: new Date(now) } },
      });
    }

    return true;
  } catch {
    // Fail open: the local bucket already recorded this attempt, so this is at
    // worst the old per-instance behaviour for a single request.
    return true;
  }
}
