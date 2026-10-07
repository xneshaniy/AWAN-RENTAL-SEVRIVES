import AxeBuilder from '@axe-core/playwright';
import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import {
  BASE_URL,
  bellPanel,
  bellTrigger,
  createBooking,
  login,
  readData,
  resetNotifications,
} from './helpers';

/**
 * Keyboard and accessibility checks for the notification bell, executed in a
 * real browser against the built application.
 *
 * These are behavioural assertions, not source-code inspection: the test
 * physically tabs to the control, presses Enter/Space/Escape and measures the
 * rendered focus ring. The final test runs axe-core over the dashboard with
 * the dropdown open.
 */
test.describe('Notification bell keyboard accessibility', () => {
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

    const seeded = await createBooking(context.request);
    if (!seeded.ok) throw new Error(`Could not seed a booking: HTTP ${seeded.status}`);
  });

  test.afterAll(async () => {
    await context?.close();
  });

  test('the trigger is reachable with the Tab key', async () => {
    await page.goto('/admin');
    await expect(page.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible();

    // Start from the very top of the document so the walk is honest.
    await page.evaluate(() => {
      (document.activeElement as HTMLElement | null)?.blur();
      document.body.focus();
    });

    let reached = false;
    let presses = 0;
    for (; presses < 80 && !reached; presses += 1) {
      await page.keyboard.press('Tab');
      reached = await page.evaluate(() => {
        const label = document.activeElement?.getAttribute('aria-label') ?? '';
        return label.startsWith('Notifications');
      });
    }

    expect(
      reached,
      `the notification trigger must be reachable by keyboard (gave up after ${presses} tabs)`
    ).toBe(true);
    await expect(bellTrigger(page)).toBeFocused();
  });

  test('the trigger publishes aria-label and aria-expanded', async () => {
    await expect(bellTrigger(page)).toHaveAttribute('aria-label', /^Notifications/);
    await expect(bellTrigger(page)).toHaveAttribute('aria-expanded', 'false');
    await expect(bellTrigger(page)).toHaveAttribute('aria-haspopup', 'dialog');
  });

  test('keyboard focus is visibly indicated', async () => {
    // Reached by Tab in the previous test, so :focus-visible is active.
    await expect(bellTrigger(page)).toBeFocused();
    const ring = await bellTrigger(page).evaluate((el) => {
      const style = getComputedStyle(el);
      return { boxShadow: style.boxShadow, outlineStyle: style.outlineStyle };
    });
    // `focus-visible:ring-2` must actually paint something; a control whose
    // focus is invisible is a real accessibility failure.
    expect(
      ring.boxShadow !== 'none' && ring.boxShadow !== '',
      `focus ring box-shadow was "${ring.boxShadow}"`
    ).toBe(true);
  });

  test('Enter opens the dropdown and moves focus into it', async () => {
    await expect(bellTrigger(page)).toBeFocused();
    await page.keyboard.press('Enter');

    const panel = bellPanel(page);
    await expect(panel).toBeVisible();
    await expect(bellTrigger(page)).toHaveAttribute('aria-expanded', 'true');
    await expect(panel).toHaveAttribute('role', 'dialog');
    await expect(panel).toHaveAttribute('aria-label', 'Notifications');
    await expect(panel).toBeFocused();
  });

  test('Space also toggles the dropdown', async () => {
    await page.keyboard.press('Escape');
    await expect(bellPanel(page)).toHaveCount(0);
    await expect(bellTrigger(page)).toBeFocused();

    await page.keyboard.press('Space');
    await expect(bellPanel(page)).toBeVisible();
    await expect(bellTrigger(page)).toHaveAttribute('aria-expanded', 'true');
  });

  test('keyboard users can reach the controls inside the panel', async () => {
    await expect(bellPanel(page)).toBeFocused();

    // The first Tab from the panel container lands on its first control,
    // which is "Mark all read".
    await page.keyboard.press('Tab');
    const focusedName = await page.evaluate(
      () => document.activeElement?.textContent?.trim() ?? ''
    );
    expect(focusedName).toContain('Mark all read');

    // Every interactive element in the panel has an accessible name.
    const panel = bellPanel(page);
    const names = await panel.locator('button').evaluateAll((buttons) =>
      buttons.map((button) =>
        (
          button.getAttribute('aria-label') ??
          button.textContent ??
          ''
        ).trim()
      )
    );
    expect(names.length).toBeGreaterThan(0);
    for (const name of names) {
      expect(name.length, 'every button in the panel must have an accessible name').toBeGreaterThan(0);
    }
  });

  test('Escape closes the panel and returns focus to the trigger', async () => {
    await page.keyboard.press('Escape');
    await expect(bellPanel(page)).toHaveCount(0);
    await expect(bellTrigger(page)).toBeFocused();
    await expect(bellTrigger(page)).toHaveAttribute('aria-expanded', 'false');

    // Focus must not have vanished into <body>.
    const activeIsBody = await page.evaluate(() => document.activeElement === document.body);
    expect(activeIsBody).toBe(false);
  });

  test('axe reports no WCAG A/AA violations on the dashboard with the dropdown open', async () => {
    await bellTrigger(page).click();
    await expect(bellPanel(page)).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    const summary = results.violations.map(
      (violation) =>
        `${violation.id} (${violation.impact}) - ${violation.nodes.length} node(s): ` +
        violation.nodes
          .slice(0, 3)
          .map((node) => node.target.join(' '))
          .join(' | ')
    );
    expect(summary, `axe violations:\n${summary.join('\n')}`).toEqual([]);

    await page.keyboard.press('Escape');
    await expect(bellPanel(page)).toHaveCount(0);
  });
});
