import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import {
  BASE_URL,
  bellBadge,
  bellPanel,
  bellTrigger,
  createBooking,
  horizontalOverflowReport,
  login,
  readData,
  resetNotifications,
} from './helpers';

/**
 * The notification bell and its dropdown at every required viewport.
 *
 * Each run asserts the same ten properties: the bell is visible, the badge is
 * not clipped, the panel stays inside the viewport, the panel is usable, the
 * notification text does not push the page sideways, Escape/close stays
 * reachable, there is no horizontal page overflow, the touch target is big
 * enough, the header is stable and the panel is correctly positioned.
 *
 * The seeded notification deliberately carries an unusually long pickup
 * location (171 characters) so a short, tidy message can never mask a
 * `break-words` regression.
 */

const VIEWPORTS = [
  { name: '375x812', width: 375, height: 812 },
  { name: '390x844', width: 390, height: 844 },
  { name: '412x915', width: 412, height: 915 },
  { name: '768', width: 768, height: 1024 },
  { name: '1024', width: 1024, height: 768 },
  { name: '1280', width: 1280, height: 800 },
  { name: '1440', width: 1440, height: 900 },
] as const;

const LONG_LOCATION =
  'Islamabad International Airport Terminal 1 Departures Long Haul Pickup Zone A1234567890' +
  '12345678901234567890123456789012345678901234567890123456789012345678901234567890';

test.describe('Responsive notification UI', () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    await resetNotifications();

    context = await browser.newContext({
      baseURL: BASE_URL,
      viewport: { width: 1280, height: 900 },
      locale: 'en-GB',
    });
    page = await context.newPage();

    const data = readData();
    await login(page, data.adminEmail, data.adminPassword);

    const seeded = await createBooking(context.request, { pickupLocation: LONG_LOCATION });
    if (!seeded.ok || !seeded.bookingNumber) {
      throw new Error(`Could not seed a booking: HTTP ${seeded.status}`);
    }
  });

  test.afterAll(async () => {
    await context?.close();
  });

  for (const viewport of VIEWPORTS) {
    test(`bell and dropdown at ${viewport.name}`, async () => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/admin');
      await expect(page.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible();

      // 1. The header is stable and does not itself overflow the viewport.
      const header = page.locator('header').first();
      await expect(header).toBeVisible();
      const headerBox = await header.boundingBox();
      expect(headerBox).not.toBeNull();
      expect(headerBox!.width).toBeLessThanOrEqual(viewport.width + 1);

      // 2. The bell is visible with a usable touch target (WCAG 2.5.8: >=24px).
      const bell = bellTrigger(page);
      await expect(bell).toBeVisible();
      const bellBox = await bell.boundingBox();
      expect(bellBox).not.toBeNull();
      expect(bellBox!.width).toBeGreaterThanOrEqual(24);
      expect(bellBox!.height).toBeGreaterThanOrEqual(24);

      // 3. The badge is rendered and completely on-screen - not clipped by an
      //    overflow:hidden ancestor nor pushed outside the viewport.
      const badge = bellBadge(page);
      await expect(badge).toBeVisible();
      await expect(badge).toBeInViewport();
      const badgeBox = await badge.boundingBox();
      expect(badgeBox).not.toBeNull();
      expect(badgeBox!.x).toBeGreaterThanOrEqual(0);
      expect(badgeBox!.y).toBeGreaterThanOrEqual(0);
      expect(badgeBox!.x + badgeBox!.width).toBeLessThanOrEqual(viewport.width);
      expect(badgeBox!.y + badgeBox!.height).toBeLessThanOrEqual(viewport.height);

      // Baseline: measure the page BEFORE the dropdown is involved so a
      // failure can be attributed to the dashboard or to the panel.
      const baselineOverflow = await horizontalOverflowReport(page);
      expect(
        baselineOverflow.scrollWidth - baselineOverflow.clientWidth,
        `baseline horizontal overflow on the dashboard itself:\n${JSON.stringify(baselineOverflow, null, 2)}`
      ).toBeLessThanOrEqual(1);

      // 4. Opening the dropdown keeps it fully inside the viewport.
      await bell.click();
      const panel = bellPanel(page);
      await expect(panel).toBeVisible();
      const panelBox = await panel.boundingBox();
      expect(panelBox).not.toBeNull();
      expect(panelBox!.x).toBeGreaterThanOrEqual(0);
      expect(panelBox!.y).toBeGreaterThanOrEqual(0);
      expect(panelBox!.x + panelBox!.width).toBeLessThanOrEqual(viewport.width + 1);
      expect(panelBox!.y + panelBox!.height).toBeLessThanOrEqual(viewport.height + 1);

      // 5. It is right-aligned under the bell, not floating in the middle.
      expect(Math.abs(panelBox!.x + panelBox!.width - (bellBox!.x + bellBox!.width))).toBeLessThan(48);

      // 6. The panel is usable: content and controls are present and hit.
      await expect(panel).toContainText('New Booking');
      const markAll = panel.getByRole('button', { name: 'Mark all read' });
      await expect(markAll).toBeVisible();
      const markAllBox = await markAll.boundingBox();
      expect(markAllBox).not.toBeNull();
      expect(markAllBox!.width).toBeGreaterThanOrEqual(24);
      expect(markAllBox!.height).toBeGreaterThanOrEqual(16);

      // 7. The page must not scroll sideways, with the dropdown open. The
      //    assertion carries the offending elements so a failure names them
      //    instead of reporting an anonymous "207".
      const openOverflow = await horizontalOverflowReport(page);
      expect(
        openOverflow.scrollWidth - openOverflow.clientWidth,
        JSON.stringify(openOverflow, null, 2)
      ).toBeLessThanOrEqual(1);

      // 8. The long text wrapped inside its own box rather than widening it.
      const titleBox = await panel.locator('p.break-words').first().boundingBox();
      expect(titleBox).not.toBeNull();
      expect(titleBox!.width).toBeLessThanOrEqual(panelBox!.width);

      // 9. Escape still closes it, and focus returns to the trigger, so the
      //    close affordance is reachable on a narrow screen too.
      await page.keyboard.press('Escape');
      await expect(panel).toHaveCount(0);
      await expect(bell).toBeFocused();
      await expect(bell).toHaveAttribute('aria-expanded', 'false');

      // 10. Closing must not have introduced overflow either.
      const closedOverflow = await horizontalOverflowReport(page);
      expect(
        closedOverflow.scrollWidth - closedOverflow.clientWidth,
        JSON.stringify(closedOverflow, null, 2)
      ).toBeLessThanOrEqual(1);
    });
  }
});
