import { PrismaClient } from '@prisma/client';
import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import { resolve } from 'node:path';
import { BASE_URL, GALLERY_VEHICLE_PREFIX, login, readData, toastWith } from './helpers';

/**
 * STEP 9 - the complete gallery upload flow, driven through a real browser.
 *
 *   Admin UI -> vehicle form "Upload Photo" -> GET/POST /api/admin/upload
 *   -> Cloudinary -> the form's image row -> "Create Vehicle" -> the database
 *   -> /admin/gallery -> the public /gallery -> a hard reload of /gallery
 *
 * Every link in that chain is asserted against something real: a rendered
 * toast, the value in the image input, a direct Prisma read, or the DOM of the
 * admin and public gallery pages. Nothing here treats an HTTP 200 as proof
 * that a photo was stored.
 *
 * WHY A NEW VEHICLE RATHER THAN AN EDIT
 *
 * The eight production vehicle records must not be modified, and an edit that
 * fails half way leaves a stray row on a real record. Creating a row of our
 * own - named with `GALLERY_VEHICLE_PREFIX` so global-setup/global-teardown
 * can find it by prefix - means a failure can never damage the fleet, and the
 * record is removed even when the run is killed.
 *
 * KNOWN COST: each run uploads one 7 KB image to the project's Cloudinary
 * account. The application exposes no delete endpoint and running an
 * unguarded destructive call against the production media CDN from a test
 * harness is not worth the 7 KB, so the asset is intentionally left behind.
 */
const FIXTURE_IMAGE = resolve(process.cwd(), 'public', 'placeholder-vehicle.png');

/** The image file input - distinguished from the clip input by its `accept`. */
const IMAGE_FILE_INPUT = 'input[accept^="image/"]';

/** Finds our photo in the public gallery's DOM, wherever next/image put it. */
async function findPhotoOnPublicGallery(page: Page, url: string): Promise<boolean> {
  const encoded = encodeURIComponent(url);
  return page.evaluate(
    ([raw, enc]) =>
      Array.from(document.querySelectorAll('img')).some((img) => {
        const src = img.getAttribute('src') ?? '';
        const srcset = img.getAttribute('srcset') ?? '';
        return src.includes(enc) || src.includes(raw) || srcset.includes(enc);
      }),
    [url, encoded]
  );
}

test.describe.serial('Gallery upload flow (STEP 9)', () => {
  let context: BrowserContext;
  let page: Page;
  let prisma: PrismaClient | undefined;

  /** Filled by test 1 and asserted by tests 2 and 3. */
  let vehicleName = '';
  let uploadedUrl = '';

  test.beforeAll(async ({ browser }) => {
    prisma = new PrismaClient();

    context = await browser.newContext({
      baseURL: BASE_URL,
      viewport: { width: 1280, height: 900 },
      locale: 'en-GB',
    });
    page = await context.newPage();

    const data = readData();
    await login(page, data.adminEmail, data.adminPassword);
  });

  test.afterAll(async () => {
    await context?.close();
    await prisma?.$disconnect();
  });

  test('the upload reaches Cloudinary and is stored on a new vehicle', async () => {
    vehicleName = `${GALLERY_VEHICLE_PREFIX} ${Date.now().toString(36)}`;

    await page.goto('/admin/vehicles/create');
    await expect(page.getByRole('heading', { level: 1, name: 'Add Vehicle' })).toBeVisible();

    // The button only renders once GET /api/admin/upload answers `configured`,
    // so waiting for it is itself the assertion that this environment can
    // really upload rather than silently offering a button that 503s.
    const uploadButton = page.getByRole('button', { name: 'Upload Photo' });
    await expect(uploadButton, 'uploads are not configured on this environment').toBeVisible({
      timeout: 20_000,
    });

    await page.locator(IMAGE_FILE_INPUT).setInputFiles(FIXTURE_IMAGE);
    await expect(
      toastWith(page, 'Photo uploaded - remember to save the vehicle.'),
      'the upload must report success before we look for the result'
    ).toBeVisible({ timeout: 30_000 });

    // The returned CDN URL is what the vehicle form will actually save -
    // reading it from the field proves the response landed in the form state.
    //
    // Exactly one row is expected: the form opens with a blank placeholder so
    // a URL can be pasted, and an upload used to append underneath it, leaving
    // an empty field above the new photo that made the upload look like it had
    // failed. The count assertion is the regression guard for that.
    const imageRows = page.locator('input[aria-label^="Image URL "]');
    await expect(imageRows).toHaveCount(1);
    const imageRow = page.locator('input[aria-label="Image URL 1"]');
    await expect(imageRow).toHaveValue(/^https:\/\/res\.cloudinary\.com\//);
    uploadedUrl = await imageRow.inputValue();

    await page.locator('[name="name"]').fill(vehicleName);
    await page.locator('[name="licensePlate"]').fill(`E2E-${Date.now().toString(36).slice(-6)}`);
    await page.locator('[name="brand"]').fill('E2E');
    await page.locator('[name="model"]').fill('Probe');
    await page.locator('[name="year"]').fill('2024');
    await page.locator('[name="category"]').selectOption('SEDAN');
    await page.locator('[name="transmission"]').selectOption('AUTOMATIC');
    await page.locator('[name="fuelType"]').selectOption('PETROL');
    await page.locator('[name="seats"]').fill('5');
    await page.locator('[name="doors"]').fill('4');
    await page.locator('[name="luggageCapacity"]').fill('2');
    await page.locator('[name="dailyRate"]').fill('9000');
    // Scoped to textarea: `<meta name="description">` in the document head
    // shares the same name attribute and makes an unscoped locator ambiguous.
    await page
      .locator('textarea[name="description"]')
      .fill('Vehicle created by the gallery upload browser test to prove the full media flow.');

    const createdToast = toastWith(page, 'Vehicle created');
    await page.getByRole('button', { name: 'Create Vehicle' }).click();
    await expect(createdToast).toBeVisible({ timeout: 20_000 });
    await page.waitForURL('**/admin/vehicles', { timeout: 20_000 });

    // Direct database read: the row exists, holds the exact CDN URL, and is
    // not archived (both galleries filter on `archivedAt: null`).
    const row = await prisma!.vehicle.findFirst({
      where: { name: vehicleName },
      select: { id: true, images: true, imageCategories: true, archivedAt: true },
    });
    expect(row, 'the created vehicle must exist in the database').not.toBeNull();
    expect(row!.archivedAt).toBeNull();
    expect(row!.images, 'the stored images array must contain the uploaded URL').toContain(
      uploadedUrl
    );
    const index = row!.images.indexOf(uploadedUrl);
    expect(row!.imageCategories[index]).toBe('EXTERIOR');
  });

  test('the upload appears in the admin gallery', async () => {
    await page.goto('/admin/gallery');
    await expect(page.getByRole('heading', { level: 1, name: 'Gallery Media' })).toBeVisible();

    const section = page.locator(`section[aria-label="Media for ${vehicleName}"]`);
    await expect(section, 'the new vehicle must have its own media card').toBeVisible();

    const photo = section.locator(`img[src="${uploadedUrl}"]`);
    await expect(photo, 'the admin gallery must render the uploaded CDN URL').toBeVisible();
    await expect(photo).toHaveAttribute('alt', new RegExp(vehicleName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    await expect(section).toContainText('1 photo');
  });

  test('the upload is served by the public gallery and survives a reload', async () => {
    await page.goto('/gallery');
    await expect(page.getByRole('heading', { level: 1, name: 'Gallery' })).toBeVisible();

    // `/gallery` is `force-dynamic`, so a photo uploaded after the build must
    // be in the very next response. A prerendered page - the original defect -
    // would never show it, which is exactly what this catches.
    await expect
      .poll(() => findPhotoOnPublicGallery(page, uploadedUrl), {
        timeout: 25_000,
        message: 'the freshly uploaded photo must appear on the public gallery',
      })
      .toBe(true);

    // And it must really decode, not merely occupy a slot: next/image has to
    // fetch the remote asset through /_next/image for the tile to paint.
    await expect
      .poll(
        () =>
          page.evaluate(
            (enc) => {
              const img = Array.from(document.querySelectorAll('img')).find((el) =>
                (el.getAttribute('src') ?? '').includes(enc)
              );
              return img ? img.naturalWidth : -1;
            },
            encodeURIComponent(uploadedUrl)
          ),
        { timeout: 25_000, message: 'the gallery tile must actually render pixels' }
      )
      .toBeGreaterThan(0);

    await page.reload();
    await expect(page.getByRole('heading', { level: 1, name: 'Gallery' })).toBeVisible();
    await expect
      .poll(() => findPhotoOnPublicGallery(page, uploadedUrl), {
        timeout: 25_000,
        message: 'the photo must still be on the gallery after a hard reload',
      })
      .toBe(true);
  });

  test('the upload endpoint refuses an anonymous caller', async ({ browser }) => {
    const anonymous = await browser.newContext({ baseURL: BASE_URL });
    try {
      expect((await anonymous.request.get('/api/admin/upload')).status()).toBe(401);
      expect((await anonymous.request.post('/api/admin/upload')).status()).toBe(401);
    } finally {
      await anonymous.close();
    }
  });
});
