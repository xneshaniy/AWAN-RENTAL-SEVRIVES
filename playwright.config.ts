import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from '@playwright/test';

/**
 * Load `.env.e2e` into THIS process.
 *
 * Playwright does not read `.env` files by itself, and the test process needs
 * `ADMIN_EMAIL` / `DATABASE_URL` for the global setup while the server under
 * test reads the same file separately via `node --env-file`. Node's built-in
 * parser keeps values that are already set, so a variable exported by the
 * caller always wins. Skipping this when the file is absent keeps the config
 * loadable in environments that never create it (e.g. `--list` in CI).
 */
const E2E_ENV = resolve(process.cwd(), '.env.e2e');
if (existsSync(E2E_ENV)) {
  process.loadEnvFile(E2E_ENV);
}

/**
 * Browser E2E configuration for the notification / booking / gallery work.
 *
 * WHY THIS SHAPE
 *
 * - `channel: 'chrome'` drives the Google Chrome already installed on the
 *   machine instead of downloading a second browser engine, which keeps the
 *   tooling addition to the two npm packages `@playwright/test` and
 *   `@axe-core/playwright`.
 * - The server under test is the SAME `next build` standalone output that
 *   ships to production (`.next/standalone/server.js`), started with
 *   `.env.e2e`. `.env.e2e` is `.env` minus every `SMTP_*` key so an E2E run
 *   can create bookings and send confirmation flows without transmitting a
 *   single real message through the live mail server. It is git-ignored.
 * - Port 3000 (not an arbitrary port) because `NEXTAUTH_URL` in the env file
 *   is `http://localhost:3000`; next-auth validates the origin on the
 *   callback, so running on any other port would break sign-in for reasons
 *   unrelated to the code under test.
 * - `reuseExistingServer` so a server already running for manual inspection
 *   is adopted rather than killed.
 * - `workers: 1` - the suite writes to one shared database, so tests must not
 *   interleave mutations.
 */
const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './tests/e2e',
  outputDir: './test-results',
  globalSetup: './tests/e2e/global-setup.ts',
  globalTeardown: './tests/e2e/global-teardown.ts',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: Boolean(process.env.CI),
  // The list reporter is deliberate: `npm run test:e2e` chains one invocation
  // per spec file (see the script) so that each file gets a fresh server
  // process. A server process carries its own in-memory rate-limit buckets,
  // and the budgets are tight - 5 logins per 10 minutes and 10 bookings per
  // hour per IP - so running every file against one process would have the
  // production rate limiter legitimately rejecting the suite part way through.
  // One file per invocation keeps every file comfortably inside the real
  // limits instead of raising them for the test environment.
  // `--output` is set per invocation in the script so an earlier file's
  // screenshots and traces survive the later runs.
  reporter: [['list']],
  use: {
    baseURL: BASE_URL,
    channel: 'chrome',
    headless: true,
    viewport: { width: 1280, height: 900 },
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    locale: 'en-GB',
    timezoneId: 'Asia/Karachi',
  },
  webServer: {
    command: 'node --env-file=.env.e2e .next/standalone/server.js',
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 120_000,
    // Piped, not ignored: the server's own log lines are the evidence for the
    // no-SMTP path (`Email not configured (SMTP missing)`), and hiding stdout
    // would make that unprovable from a test run.
    stdout: 'pipe',
    stderr: 'pipe',
    env: {
      PORT: String(PORT),
      HOSTNAME: 'localhost',
      NODE_ENV: 'production',
    },
  },
});
