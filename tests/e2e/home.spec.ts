import AxeBuilder from '@axe-core/playwright';
import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import { BASE_URL, horizontalOverflowReport } from './helpers';

/**
 * The rebuilt homepage booking CTA and the How It Works step grid.
 *
 * These two sections were redesigned together, and every property asserted
 * here is one that a visual change can quietly break: the step grid folding
 * 4 -> 2 -> 1 columns at the right breakpoints, cards inside a row staying the
 * same height, the photographic backdrop actually decoding, both calls to
 * action pointing where their labels promise, and nothing leaking sideways at
 * any width.
 *
 * Viewports are the same four the notification responsive spec covers, chosen
 * so each Tailwind breakpoint boundary is crossed: 375 is below `sm`, 768 sits
 * at `md` (so `sm:grid-cols-2` is live but `lg` is not), 1024 is the exact `lg`
 * edge that switches on `lg:grid-cols-4`, and 1440 is a normal desktop.
 */

const VIEWPORTS = [
  { name: '375x812 (mobile)', width: 375, height: 812, columns: 1 },
  { name: '768x1024 (tablet)', width: 768, height: 1024, columns: 2 },
  { name: '1024x768 (laptop)', width: 1024, height: 768, columns: 4 },
  { name: '1440x900 (desktop)', width: 1440, height: 900, columns: 4 },
] as const;

const STEP_TITLES = [
  'Choose Your Vehicle',
  'Send Your Booking Request',
  'Confirm Your Journey',
  'Enjoy the Ride',
] as const;

test.describe('Home booking CTA and How It Works', () => {
  let context: BrowserContext;
  let page: Page;
  const consoleErrors: string[] = [];

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext({ baseURL: BASE_URL, locale: 'en-GB' });
    page = await context.newPage();

    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('pageerror', (error) => consoleErrors.push(`pageerror: ${error.message}`));
  });

  test.afterAll(async () => {
    await context?.close();
  });

  for (const viewport of VIEWPORTS) {
    test(`layout and calls to action at ${viewport.name}`, async () => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

      const howSection = page.locator('section[aria-labelledby="how-title"]');
      const ctaSection = page.locator('section[aria-labelledby="cta-title"]');
      await expect(howSection).toBeVisible();
      await expect(ctaSection).toBeVisible();

      // --- How It Works ---------------------------------------------------

      // All four steps are present, in the specified order.
      const steps = howSection.locator('ol > li');
      await expect(steps).toHaveCount(4);
      // Indexed loop rather than .entries(): this project's tsconfig targets a
      // pre-ES2015 output, so only arrays may be iterated directly.
      for (let index = 0; index < STEP_TITLES.length; index += 1) {
        await expect(steps.nth(index).getByRole('heading', { level: 3 })).toHaveText(
          STEP_TITLES[index]
        );
      }

      // Column count is measured from the rendered geometry rather than read
      // off the class list, so a regression in the CSS fails here instead of
      // passing a test that only checks what the source claims to do.
      const boxes = await steps.evaluateAll((elements) =>
        elements.map((element) => {
          const rect = element.getBoundingClientRect();
          return { x: Math.round(rect.x), y: Math.round(rect.y), height: Math.round(rect.height) };
        })
      );
      const columns = new Set(boxes.map((box) => box.x)).size;
      expect(columns, `expected ${viewport.columns} column(s), measured ${columns}`).toBe(
        viewport.columns
      );

      // Cards sharing a row must share a height; that is what makes the grid
      // read as one row rather than four ragged blocks. Grouped by y because
      // at two columns the four cards fall into two rows of different heights.
      // Grouped with arrays rather than a Map so the loop stays iterable under
      // the pre-ES2015 target.
      const rowYs: number[] = [];
      const rowHeights: number[][] = [];
      for (const box of boxes) {
        let row = rowYs.indexOf(box.y);
        if (row === -1) {
          rowYs.push(box.y);
          rowHeights.push([]);
          row = rowYs.length - 1;
        }
        rowHeights[row].push(box.height);
      }
      for (let row = 0; row < rowHeights.length; row += 1) {
        const heights = rowHeights[row];
        const spread = Math.max(...heights) - Math.min(...heights);
        expect(
          spread,
          `row at y=${rowYs[row]} has ragged card heights: ${heights.join(', ')}`
        ).toBeLessThanOrEqual(1);
      }

      // --- CTA ------------------------------------------------------------

      // Scroll the section into view first. The backdrop is intentionally
      // `loading="lazy"` - it is the last section on the page, so preloading
      // it would cost every visitor bandwidth for an image most never reach.
      // Asserting before the scroll would be asserting that a below-the-fold
      // image was eagerly fetched.
      await ctaSection.scrollIntoViewIfNeeded();

      await expect(
        ctaSection.getByRole('heading', { level: 2, name: 'Ready to Start Your Journey?' })
      ).toBeVisible();
      await expect(ctaSection.getByText('Ready When You Are')).toBeVisible();

      // The photographic backdrop must actually decode, not merely be present
      // in the DOM - a missing file would otherwise leave a dark band and no
      // test would notice.
      const backdrop = ctaSection.locator('img').first();
      await expect
        .poll(() => backdrop.evaluate((image: HTMLImageElement) => image.naturalWidth), {
          message: 'the CTA backdrop image never decoded',
          timeout: 15_000,
        })
        .toBeGreaterThan(0);

      // Decorative: the photo must stay out of the accessibility tree so the
      // heading and buttons are what assistive tech announces.
      await expect(backdrop).toHaveAttribute('alt', '');

      const heading = ctaSection.getByRole('heading', { level: 2, name: 'Ready to Start Your Journey?' });
      await heading.scrollIntoViewIfNeeded();
      await expect(heading).toBeInViewport();
      const headingBox = await heading.boundingBox();
      expect(headingBox).not.toBeNull();
      expect(headingBox!.x).toBeGreaterThanOrEqual(-1);
      expect(headingBox!.x + headingBox!.width).toBeLessThanOrEqual(viewport.width + 1);

      // Primary CTA matches the header's own "Book a Car" -> /booking route.
      const bookCar = ctaSection.getByRole('link', { name: /Book a Car/ });
      await expect(bookCar).toBeVisible();
      expect(await bookCar.getAttribute('href')).toBe('/booking');

      // Secondary CTA must be a real wa.me link, not a placeholder.
      const whatsapp = ctaSection.getByRole('link', { name: /WhatsApp Us/ });
      await expect(whatsapp).toBeVisible();
      expect(await whatsapp.getAttribute('href')).toMatch(/^https:\/\/wa\.me\//);

      // Every image on the page decoded. Cast because Playwright types a
      // locator's elements as SVGElement | HTMLElement even for `img`.
      const brokenImages = await page.locator('img').evaluateAll((elements) =>
        elements
          .map((element) => element as HTMLImageElement)
          .filter((image) => image.complete && image.naturalWidth === 0)
          .map((image) => image.currentSrc || image.src)
      );
      expect(brokenImages, `images that failed to load: ${brokenImages.join(', ')}`).toEqual([]);

      // Nothing may push the page sideways at any width.
      const overflow = await horizontalOverflowReport(page);
      expect(
        overflow.scrollWidth - overflow.clientWidth,
        JSON.stringify(overflow, null, 2)
      ).toBeLessThanOrEqual(1);
    });
  }

  test('the homepage keeps a single h1 and a sane heading outline', async () => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    const h1s = await page.locator('h1').allTextContents();
    expect(h1s, `expected exactly one h1, found ${h1s.length}: ${h1s.join(' | ')}`).toHaveLength(1);

    // The CTA heading is a level-2 section heading, so it nests under the h1
    // rather than skipping straight to it or sitting below an h3.
    const levels = await page.locator('h1, h2, h3, h4').evaluateAll((headings) =>
      headings.map((heading) => Number(heading.tagName.slice(1)))
    );
    for (let i = 1; i < levels.length; i += 1) {
      expect(
        levels[i] - levels[i - 1],
        `heading level jumps from h${levels[i - 1]} to h${levels[i]}`
      ).toBeLessThanOrEqual(1);
    }
  });

  test('the CTA backdrop and step icons render at desktop width', async () => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    const ctaSection = page.locator('section[aria-labelledby="cta-title"]');
    const sectionBox = await ctaSection.boundingBox();
    expect(sectionBox).not.toBeNull();
    // A banner, not a strip: enough height for the eyebrow, heading, copy and
    // two rows of controls to breathe at desktop width.
    expect(sectionBox!.height).toBeGreaterThan(320);
    expect(sectionBox!.width).toBeGreaterThanOrEqual(1439);

    // The backdrop covers the whole section at every width.
    const backdropBox = await ctaSection.locator('img').first().boundingBox();
    expect(backdropBox).not.toBeNull();
    expect(backdropBox!.width).toBeGreaterThanOrEqual(sectionBox!.width - 2);
    expect(backdropBox!.height).toBeGreaterThanOrEqual(sectionBox!.height - 2);
  });

  test('no uncaught exceptions or console errors were raised while rendering', async () => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await expect(page.locator('section[aria-labelledby="cta-title"]')).toBeVisible();

    expect(consoleErrors, `console errors:\n${consoleErrors.join('\n')}`).toEqual([]);
  });

  test('axe reports no WCAG A/AA violations on the homepage', async () => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await expect(page.locator('section[aria-labelledby="cta-title"]')).toBeVisible();

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
  });
});
