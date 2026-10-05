-- Durable rate-limit buckets.
--
-- The in-memory limiter in src/lib/rate-limit.ts is scoped to one process, so
-- on Vercel each serverless instance counted attempts independently and a
-- cold start wiped the counter. One row per (scope, identifier, window) makes
-- the counter survive deploys and hold across instances.
--
-- The window is encoded in the primary key, so an expired bucket needs no
-- background sweeper to become inactive: it simply never matches again and is
-- removed opportunistically by the application.
CREATE TABLE "rate_limits" (
    "key" TEXT NOT NULL,
    "resetAt" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rate_limits_pkey" PRIMARY KEY ("key")
);

-- Supports the opportunistic "delete everything already expired" cleanup.
CREATE INDEX "rate_limits_resetAt_idx" ON "rate_limits"("resetAt");
