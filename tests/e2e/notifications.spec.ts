import { expect, test, chromium, type BrowserContext, type Page } from '@playwright/test';
import {
  BASE_URL,
  anonymousApi,
  bellBadge,
  bellPanel,
  bellTrigger,
  createBooking,
  login,
  readBellPanel,
  readData,
  resetNotifications,
  statValue,
  toastWith,
} from './helpers';

/**
 * Browser E2E for the admin/staff notification system - Tests 1 to 10 as
 * specified, followed by the live-update, reconnect, booking-notification and
 * contact-notification flows.
 *
 * Everything runs against the production `next build` standalone output in a
 * real Chrome, not against a mock and not against bare HTTP.
 *
 * Tests 1-10 share ONE browser context opened in `beforeAll`, because read
 * state is the subject under test: a fresh context per test would silently
 * re-authenticate and mask exactly the kind of leakage Test 9 exists to catch.
 */
test.describe('Notification system E2E (Tests 1-10)', () => {
  let context: BrowserContext;
  let page: Page;
  /** Booking created before the suite starts, so the bell has real data. */
  let bookingA = '';

  test.beforeAll(async ({ browser }) => {
    // Start from a known zero: earlier spec files share this database.
    await resetNotifications();

    context = await browser.newContext({
      baseURL: BASE_URL,
      viewport: { width: 1280, height: 900 },
      locale: 'en-GB',
    });
    page = await context.newPage();

    const seeded = await createBooking(context.request);
    if (!seeded.ok || !seeded.bookingNumber) {
      throw new Error(
        `Could not seed the first booking (HTTP ${seeded.status}): ${seeded.error ?? 'no error body'}`
      );
    }
    bookingA = seeded.bookingNumber;
  });

  test.afterAll(async () => {
    await context?.close();
  });

  test('Test 1 - admin can log in', async () => {
    const data = readData();
    await page.goto('/admin/login');
    await expect(page.getByRole('heading', { level: 1, name: 'Admin Login' })).toBeVisible();

    await page.locator('input[name="email"]').fill(data.adminEmail);
    await page.locator('input[name="password"]').fill(data.adminPassword);
    await page.getByRole('button', { name: 'Sign In' }).click();

    await page.waitForURL('**/admin');
    await expect(page.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible();
    expect(page.url()).not.toContain('/admin/login');
  });

  test('Test 2 - the notification bell is visible', async () => {
    const bell = bellTrigger(page);
    await expect(bell).toBeVisible();
    await expect(bell).toBeEnabled();
    await expect(bell).toHaveAttribute('aria-haspopup', 'dialog');
    await expect(bell).toHaveAttribute('aria-label', /^Notifications/);
  });

  test('Test 3 - the badge renders the server-computed unread count', async () => {
    await expect(bellTrigger(page)).toHaveAttribute('aria-label', 'Notifications, 1 unread');
    const badge = bellBadge(page);
    await expect(badge).toBeVisible();
    await expect(badge).toHaveText('1');
    await expect(badge).toHaveText(/^\d+$/);
  });

  test('Test 4 - clicking the bell opens the dropdown', async () => {
    await bellTrigger(page).click();
    const panel = bellPanel(page);
    await expect(panel).toBeVisible();
    await expect(bellTrigger(page)).toHaveAttribute('aria-expanded', 'true');
    await expect(panel).toHaveAttribute('role', 'dialog');
    await expect(panel).toHaveAttribute('aria-label', 'Notifications');
    await expect(panel).toContainText(`New Booking ${bookingA}`);
    await expect(panel).toContainText('New Booking');
    await expect(panel.locator('time')).toHaveCount(1);
    await expect(panel.locator('time').first()).toHaveAttribute('datetime', /\d{4}-\d{2}-\d{2}T/);
  });

  test('Test 5 - clicking the bell again closes it', async () => {
    await expect(bellPanel(page)).toBeVisible();
    await bellTrigger(page).click();
    await expect(bellPanel(page)).toHaveCount(0);
    await expect(bellTrigger(page)).toHaveAttribute('aria-expanded', 'false');
  });

  test('Test 6 - Escape closes the dropdown', async () => {
    await bellTrigger(page).click();
    await expect(bellPanel(page)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(bellPanel(page)).toHaveCount(0);
    await expect(bellTrigger(page)).toHaveAttribute('aria-expanded', 'false');
  });

  test('Test 7 - focus returns to the notification trigger', async () => {
    await bellTrigger(page).click();
    await expect(bellPanel(page)).toBeVisible();
    // Opening must move focus INTO the panel so keyboard users are not stranded.
    await expect(bellPanel(page)).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(bellPanel(page)).toHaveCount(0);
    await expect(bellTrigger(page)).toBeFocused();

    // Immediately operable again - and Enter, not just a mouse, reopens it.
    await page.keyboard.press('Enter');
    await expect(bellPanel(page)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(bellPanel(page)).toHaveCount(0);
  });

  test('Test 8 - an unread notification can be marked read and persists', async () => {
    await bellTrigger(page).click();
    const panel = bellPanel(page);
    await expect(panel).toBeVisible();

    const markOne = panel.locator('button[aria-label^="Mark notification"]').first();
    await expect(markOne).toBeVisible();
    await markOne.click();

    await expect(bellTrigger(page)).toHaveAttribute('aria-label', 'Notifications, none unread');
    await expect(bellBadge(page)).toHaveCount(0);
    await expect(panel).toContainText('No unread notifications');

    await bellTrigger(page).click();
    await expect(bellPanel(page)).toHaveCount(0);

    // Full reload: the read state must come back from the database.
    await page.reload();
    await expect(page.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible();
    await expect(bellTrigger(page)).toHaveAttribute('aria-label', 'Notifications, none unread');

    await bellTrigger(page).click();
    await expect(bellPanel(page)).toContainText(`New Booking ${bookingA}`);
    await expect(panel.locator('button[aria-label^="Mark notification"]')).toHaveCount(0);
    await bellTrigger(page).click();
  });

  test('Test 9 - a second browser session does not inherit the read state', async () => {
    // A genuinely separate browser process (Microsoft Edge) with its own
    // profile, cookie jar and storage - not just another tab.
    const browserB = await chromium.launch({ channel: 'msedge', headless: true });
    try {
      const contextB = await browserB.newContext({ baseURL: BASE_URL });
      const pageB = await contextB.newPage();
      const data = readData();
      await login(pageB, data.staffEmail, data.staffPassword);
      await expect(pageB.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible();

      // Browser B (STAFF) still sees the notification as unread...
      await expect(bellTrigger(pageB)).toHaveAttribute('aria-label', 'Notifications, 1 unread', {
        timeout: 20_000,
      });
      await bellTrigger(pageB).click();
      await expect(bellPanel(pageB)).toContainText(`New Booking ${bookingA}`);
      await expect(
        bellPanel(pageB).locator('button[aria-label^="Mark notification"]')
      ).toHaveCount(1);

      // ...while browser A (ADMIN) still sees it as read. Read state is
      // per-user and was never shared between the two identities.
      await expect(bellTrigger(page)).toHaveAttribute('aria-label', 'Notifications, none unread');

      await contextB.close();
    } finally {
      await browserB.close();
    }
  });

  test('Test 10 - unauthorized users cannot reach the notification APIs', async ({ page: anonPage }) => {
    // A completely fresh, cookie-less API context.
    const anon = await anonymousApi();

    expect((await anon.get('/api/notifications?limit=5')).status()).toBe(401);
    expect(
      (await anon.post('/api/notifications', { data: { action: 'read-all' } })).status()
    ).toBe(401);
    expect(
      (await anon.post('/api/notifications', { data: { action: 'read', ids: ['x'] } })).status()
    ).toBe(401);

    const stream = await anon.get('/api/notifications/stream');
    expect(stream.status()).toBe(401);
    const streamBody = await stream.text();
    expect(streamBody).not.toContain('NEW_BOOKING');
    expect(streamBody).not.toContain(bookingA);

    expect((await anon.get('/api/admin/dashboard-stats')).status()).toBe(401);
    await anon.dispose();

    // An anonymous browser cannot reach the admin surface either.
    await anonPage.goto('/admin');
    await anonPage.waitForURL('**/admin/login**');
    expect(anonPage.url()).toContain('/admin/login');
  });

  test('a customer account is refused by the credentials gate', async ({ page: anonPage }) => {
    const data = readData();
    await anonPage.goto('/admin/login');
    await anonPage.locator('input[name="email"]').fill(data.customerEmail);
    await anonPage.locator('input[name="password"]').fill(data.customerPassword);
    await anonPage.getByRole('button', { name: 'Sign In' }).click();

    await expect(anonPage).toHaveURL(/\/admin\/login/);
    await expect(anonPage.locator('[role="alert"]').first()).toBeVisible();
  });

  test('a wrong password is rejected without a session', async ({ page: anonPage }) => {
    const data = readData();
    await anonPage.goto('/admin/login');
    await anonPage.locator('input[name="email"]').fill(data.adminEmail);
    await anonPage.locator('input[name="password"]').fill('definitely-not-the-password');
    await anonPage.getByRole('button', { name: 'Sign In' }).click();

    await expect(anonPage.locator('[role="alert"]').first()).toBeVisible();
    expect(anonPage.url()).toContain('/admin/login');
  });

  test('a live event updates badge, counter and toast with no page reload', async () => {
    await page.goto('/admin');
    await expect(page.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible();

    // Survives only if no full document reload happens.
    await page.evaluate(() => {
      (window as unknown as { __e2eReloadMarker?: string }).__e2eReloadMarker = 'alive';
    });

    const pendingBefore = Number((await statValue(page, 'Pending Bookings').innerText()).trim());
    expect(Number.isFinite(pendingBefore)).toBe(true);

    const created = await createBooking(context.request);
    expect(created.ok).toBe(true);
    expect(created.bookingNumber).toBeTruthy();

    // 1. The bell badge increments live.
    await expect(bellTrigger(page)).toHaveAttribute('aria-label', 'Notifications, 1 unread', {
      timeout: 20_000,
    });
    await expect(bellBadge(page)).toHaveText('1');

    // 2. Exactly ONE toast - no duplicate stacking, no repeat of one event.
    //    The dropdown is closed, so [role="status"] can only be the toast layer.
    expect(await toastWith(page, `New Booking ${created.bookingNumber}`).count()).toBe(1);

    // 3. The dashboard counter increments without a page reload.
    await expect
      .poll(async () => Number((await statValue(page, 'Pending Bookings').innerText()).trim()), {
        timeout: 20_000,
        message: 'Pending Bookings must update without a reload',
      })
      .toBe(pendingBefore + 1);

    // 4. Still the very same document.
    expect(
      await page.evaluate(
        () => (window as unknown as { __e2eReloadMarker?: string }).__e2eReloadMarker
      )
    ).toBe('alive');
  });

  test('click-through opens the booking the notification refers to', async () => {
    await bellTrigger(page).click();
    const panel = bellPanel(page);
    await expect(panel).toBeVisible();

    // Newest first: the top item is the booking created a moment ago.
    const viewButton = panel.locator('button', { hasText: 'View' }).first();
    await expect(viewButton).toBeVisible();
    await viewButton.click();

    await page.waitForURL(/\/admin\/bookings\/[a-z0-9]+/i);
    expect(page.url()).toMatch(/\/admin\/bookings\/[a-z0-9]+/i);
    await expect(bellPanel(page)).toHaveCount(0);
  });

  test('status change raises BOOKING_STATUS_CHANGED and succeeds without SMTP', async () => {
    const list = await context.request.get(`/api/bookings?search=${encodeURIComponent(bookingA)}`);
    expect(list.status()).toBe(200);
    const body = (await list.json()) as { data: Array<{ id: string; status: string }> };
    const record = body.data.find((row) => row.status === 'PENDING');
    expect(record, `expected a PENDING booking for ${bookingA}`).toBeTruthy();

    // PATCH delegates to updateBookingStatus, the single source of truth for
    // "did the status change" -> notification + confirmation email.
    const patch = await context.request.patch(`/api/bookings/${record!.id}`, {
      data: { status: 'CONFIRMED' },
    });
    // SMTP is stripped from .env.e2e, so this doubles as proof that a missing
    // mail server can never fail a status change.
    expect(patch.status()).toBe(200);

    await expect
      .poll(async () => readBellPanel(page), {
        timeout: 25_000,
        message: 'BOOKING_STATUS_CHANGED should arrive over the open SSE stream',
      })
      .toContain(bookingA);

    await expect(bellPanel(page)).toContainText('Booking Confirmed');
    await bellTrigger(page).click();
  });

  test('the contact form raises NEW_CONTACT_MESSAGE', async ({ browser }) => {
    // An anonymous visitor fills in the real public form.
    const visitorContext = await browser.newContext({ baseURL: BASE_URL });
    const visitor = await visitorContext.newPage();
    try {
      await visitor.goto('/contact');
      await visitor.locator('input[name="name"]').fill('E2E Test Contact');
      await visitor.locator('input[name="email"]').fill('e2e-contact@example.com');
      await visitor.locator('input[name="phone"]').fill('+923001234567');
      await visitor.locator('select[name="subject"]').selectOption({ index: 1 });
      await visitor
        .locator('textarea[name="message"]')
        .fill('E2E message body that is comfortably longer than ten characters.');
      // The honeypot must stay untouched - a filled one is rejected as spam.
      await expect(visitor.locator('input[name="honeypot"]')).toHaveValue('');

      await visitor.getByRole('button', { name: 'Send Message' }).click();
      // Scoped to `#main-content`: the same sentence is also mirrored into the
      // global `role="status"` toast layer, and an unscoped getByText would be
      // a strict-mode violation (two matches) rather than a real failure.
      await expect(
        visitor
          .locator('#main-content')
          .getByText('Thank you — your message has been received.')
      ).toBeVisible({ timeout: 20_000 });
    } finally {
      await visitorContext.close();
    }
    // The staff bell picks it up live.
    await expect
      .poll(async () => readBellPanel(page), {
        timeout: 25_000,
        message: 'NEW_CONTACT_MESSAGE should appear in the bell',
      })
      .toContain('New Contact Message');
    await expect(bellPanel(page)).toContainText('from E2E Test Contact');
    await bellTrigger(page).click();
  });

  test('the stream reconnects and recovers notifications missed while offline', async () => {
    await page.goto('/admin');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Dashboard' }),
      // Kept as expect()'s second argument so the detail is only computed for
      // this assertion, and only if it actually runs.
      `landed on ${page.url()} with cookies ${(await context.cookies())
        .map((cookie) => cookie.name)
        .join(',')}`
    ).toBeVisible();

    // Browser A goes offline; a separate anonymous API context stays online.
    // Probe installed first: tells us whether Chromium dispatches an `offline`
    // event at all when the context goes offline, which is what the provider
    // listens for. Without this we would be guessing.
    await page.evaluate(() => {
      const w = window as unknown as { __e2eOfflineFired?: boolean };
      w.__e2eOfflineFired = false;
      window.addEventListener('offline', () => {
        w.__e2eOfflineFired = true;
      });
    });
    await context.setOffline(true);
    const offlineEventFired = await page.evaluate(
      () => (window as unknown as { __e2eOfflineFired?: boolean }).__e2eOfflineFired === true
    );

    // Three questions a pass/fail alone cannot answer: does the browser still
    // reach the local server while "offline", does the EventSource try to
    // reconnect underneath us, and which network events actually landed.
    const fetchWhileOffline = await page.evaluate(async () => {
      try {
        const res = await fetch('/api/notifications?limit=1', { cache: 'no-store' });
        return `status=${res.status}`;
      } catch (error) {
        return `blocked:${(error as Error).message}`;
      }
    });
    const streamAttempts: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('/api/notifications/stream')) {
        streamAttempts.push(`${Date.now() % 100000}:${req.url().slice(-6)}`);
      }
    });
    const offlineApi = await anonymousApi();

    let lastOnline: boolean | null = null;
    let lastPanel = '';
    try {
      await expect
        .poll(async () => {
          lastOnline = await page.evaluate(() => navigator.onLine);
          lastPanel = await readBellPanel(page);
          return lastPanel.includes('Reconnecting');
        }, {
          timeout: 45_000,
          message: 'the bell should report that the stream dropped',
        })
        .toBe(true);
      await bellTrigger(page).click();

      // Publish an event browser A cannot receive.
      const missed = await createBooking(offlineApi);
      expect(missed.ok).toBe(true);

      await context.setOffline(false);

      // Recovery comes from the database on reconnect - no manual refresh.
      await expect
        .poll(async () => readBellPanel(page), {
          timeout: 60_000,
          message: 'the missed notification should be recovered on reconnect',
        })
        .toContain(`New Booking ${missed.bookingNumber}`);

      // Nothing was duplicated by the reconnect: every notification is present
      // exactly once (seeded, live, status change, contact, missed).
      const items = bellPanel(page).locator('li');
      expect(await items.count()).toBeGreaterThanOrEqual(5);
      const text = await bellPanel(page).innerText();
      expect(text.split(`New Booking ${missed.bookingNumber}`).length - 1).toBe(1);

      await bellTrigger(page).click();
      await offlineApi.dispose();
    } catch (error) {
      // Failure-only forensics: without these three facts an offline test is
      // indistinguishable from a lost session, a dead browser network, or a
      // provider that never noticed the drop.
      console.log(
        `[e2e-diag] offline poll: offlineEventDispatched=${offlineEventFired} ` +
          `fetchWhileOffline=${fetchWhileOffline} navigator.onLine=${lastOnline} ` +
          `streamAttempts=${streamAttempts.length} panel=${JSON.stringify(lastPanel.slice(0, 200))}`
      );
      await context.setOffline(false);
      await offlineApi.dispose();
      throw error;
    }
  });

  test('mark-all clears every unread item and persists across a reload', async () => {
    await page.goto('/admin');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Dashboard' }),
      `landed on ${page.url()} with cookies ${(await context.cookies())
        .map((cookie) => cookie.name)
        .join(',')}`
    ).toBeVisible();

    await bellTrigger(page).click();
    const panel = bellPanel(page);
    await expect(panel).toBeVisible();

    const markAll = panel.getByRole('button', { name: 'Mark all read' });
    if (await markAll.isEnabled()) await markAll.click();

    await expect(bellTrigger(page)).toHaveAttribute('aria-label', 'Notifications, none unread');
    await bellTrigger(page).click();

    await page.reload();
    await expect(page.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible();
    await expect(bellTrigger(page)).toHaveAttribute('aria-label', 'Notifications, none unread');
  });

  test('WhatsApp is a wa.me click-to-chat link carrying the booking reference', async () => {
    const created = await createBooking(context.request);
    expect(created.ok).toBe(true);
    expect(created.whatsappUrl).toBeTruthy();
    expect(created.whatsappUrl).toMatch(/^https:\/\/wa\.me\/\+?\d+/);
    expect(created.whatsappUrl).toContain('923056846811');
    expect(decodeURIComponent(created.whatsappUrl!)).toContain(created.bookingNumber!);
  });
});
