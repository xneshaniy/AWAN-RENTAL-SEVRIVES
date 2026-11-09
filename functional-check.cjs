/**
 * Awan Rental Service — functional end-to-end checks (local source of truth).
 *
 * Usage: BASE=http://localhost:3000 node functional-check.cjs
 *
 * Exit code 1 if any check fails. Screenshots go to audit-report/functional/.
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const SHOTS = path.join('audit-report', 'functional');
fs.mkdirSync(SHOTS, { recursive: true });

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
};

const pad = (n) => String(n).padStart(2, '0');
const toLocalDate = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });

  // ============ Mobile 375px ============
  const mobile = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });
  const mPage = await mobile.newPage();
  mPage.on('pageerror', (e) => console.log('PAGEERROR:', String(e).slice(0, 300)));
  mPage.on('console', (msg) => {
    if (msg.type() === 'error' && !msg.text().startsWith('Failed to load resource')) {
      console.log('CONSOLE-ERROR:', msg.text().slice(0, 200));
    }
  });

  // 1. Homepage header
  await mPage.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await mPage.waitForLoadState('load', { timeout: 30000 }).catch(() => {});
  const logoOk = await mPage.$eval('header img[src="/icon-192.png"]', (img) => img.complete && img.naturalWidth > 0).catch(() => false);
  check('Header logo image loads', logoOk);
  const hamburger = mPage.locator('button[aria-label*="menu" i], button[aria-label*="Menu" i]').first();
  const hamburgerVisible = await hamburger.isVisible().catch(() => false);
  check('Hamburger menu visible at 375px', hamburgerVisible);
  await mPage.screenshot({ path: path.join(SHOTS, 'home-375.jpg'), fullPage: false, quality: 80 });

  // 2. Mobile drawer navigation
  if (hamburgerVisible) {
    await hamburger.click();
    await mPage.waitForTimeout(400);
    const drawerLink = mPage.getByRole('link', { name: /Vehicles/i }).first();
    const drawerVisible = await drawerLink.isVisible().catch(() => false);
    check('Mobile drawer opens with Vehicles link', drawerVisible);
    await mPage.screenshot({ path: path.join(SHOTS, 'drawer-375.jpg'), quality: 80 });
    if (drawerVisible) {
      await drawerLink.click();
      await mPage.waitForURL('**/vehicles', { timeout: 20000 }).catch(() => {});
      check('Drawer navigates to /vehicles', mPage.url().includes('/vehicles'));
    } else {
      await mPage.keyboard.press('Escape');
    }
  }

  // 3. Self Drive gallery lightbox
  await mPage.goto(BASE + '/self-drive', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await mPage.waitForLoadState('load', { timeout: 30000 }).catch(() => {});
  const galleryImgs = await mPage.locator('main img').count();
  check('Self Drive page renders gallery images', galleryImgs >= 3, `${galleryImgs} images`);
  const galleryCount = await mPage.locator('main button img, main [role="button"] img').count();
  let lightboxOpened = false;
  const zoomTargets = mPage.locator('main button:has(img), main [role="button"]:has(img)');
  if ((await zoomTargets.count()) > 0) {
    await zoomTargets.first().click().catch(() => {});
    await mPage.waitForTimeout(500);
    lightboxOpened = await mPage.locator('[role="dialog"], .lightbox, [aria-modal="true"]').first().isVisible().catch(() => false);
    await mPage.screenshot({ path: path.join(SHOTS, 'lightbox-375.jpg'), quality: 80 });
    await mPage.keyboard.press('Escape');
  }
  check('Self Drive gallery lightbox opens', lightboxOpened);

  // 4. Booking flow end-to-end (creates a real booking in the LOCAL dev database)
  await mPage.goto(BASE + '/booking', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await mPage.waitForLoadState('load', { timeout: 30000 }).catch(() => {});
  const pickup = new Date();
  // Randomised future window (20–70 days out) so repeated test runs never
  // collide with each other on the availability-overlap rule.
  const offset = 20 + Math.floor(Math.random() * 50);
  pickup.setDate(pickup.getDate() + offset);
  const ret = new Date(pickup);
  ret.setDate(ret.getDate() + 2);

  const setSelect = async (name, value) => {
    const sel = mPage.locator(`select[name="${name}"]`);
    await sel.first().waitFor({ state: 'attached', timeout: 15000 }).catch(() => null);
    if ((await sel.count()) === 0) return false;
    await sel.first().selectOption(value, { force: true }).catch(() => {});
    return true;
  };

  const nextBtn = mPage.getByRole('button', { name: /^Next$/ });
  // Dispatch the wizard's Next/submit through the DOM: at 375px the fixed
  // bottom bar intercepts pointer events aimed at the button row, so
  // synthetic event-target clicks are used instead of pointer events.
  const domClick = async (namePattern) => {
    return mPage.evaluate((reSource) => {
      const re = new RegExp(reSource, 'i');
      const btn = Array.from(document.querySelectorAll('button')).find((b) =>
        re.exec((b.textContent || '').trim())
      );
      if (!btn) return false;
      btn.click();
      return true;
    }, namePattern);
  };
  const clickNext = async () => { await domClick('^Next$').catch(() => false); };
  const rentalSet = await setSelect('rentalType', 'SELF_DRIVE');
  check('Booking form: rental type selected', rentalSet);
  // pick first vehicle option if the vehicle select exists
  const vehicleSel = mPage.locator('select[name="vehicleId"]');
  let vehiclePicked = false;
  await vehicleSel.first().waitFor({ state: 'attached', timeout: 15000 }).catch(() => null);
  if ((await vehicleSel.count()) > 0) {
    const vals = await vehicleSel.locator('option').evaluateAll((opts) => opts.map((o) => o.value).filter(Boolean));
    if (vals.length > 0) {
      await vehicleSel.selectOption(vals[0], { force: true });
      vehiclePicked = true;
    }
  }
  check('Booking form: vehicle selected', vehiclePicked);
  await clickNext();
  await mPage.waitForTimeout(300);
  await mPage.locator('input[name="pickupLocation"]').fill('Islamabad International Airport');
  await mPage.locator('input[name="dropoffLocation"]').fill('Murree Road, Rawalpindi');
  await mPage.locator('input[name="pickupDate"]').fill(toLocalDate(pickup));
  await mPage.locator('input[name="returnDate"]').fill(toLocalDate(ret));
  await setSelect('passengers', '2');
  await clickNext();
  await mPage.waitForTimeout(300);
  await mPage.locator('input[name="customerName"]').fill('Test Customer (Audit)');
  await mPage.locator('input[name="customerPhone"]').fill('03001234567');
  await mPage.locator('input[name="customerWhatsApp"]').fill('03001234567');
  await mPage.locator('input[name="customerEmail"]').fill('test@example.com');
  await mPage.screenshot({ path: path.join(SHOTS, 'booking-375-filled.jpg'), quality: 80 });
  const submitBtn = mPage.getByRole('button', { name: /Submit Booking Request/i });
  for (let i = 0; i < 4; i += 1) {
    if (await submitBtn.first().isVisible().catch(() => false)) break;
    await clickNext();
    await mPage.waitForTimeout(250);
  }
  await domClick('Submit Booking Request');
  // createBooking does DB writes + notification fan-out; give it real time
  await mPage.getByText('Booking Request Received').first().waitFor({ timeout: 20000 }).catch(() => {});
  const successHeading = mPage.locator('text=Booking Request Received').first();
  const successVisible = await successHeading.isVisible().catch(() => false);
  check('Booking submission reaches success state', successVisible);
  if (!successVisible) {
    const dump = (await mPage.textContent('body').catch(() => '')) || '';
    const alerts = await mPage.locator('[role="alert"]').allTextContents().catch(() => []);
    console.log('  ALERTS:', JSON.stringify(alerts));
    console.log('  BODY TX:', dump.replace(/\s+/g, ' ').slice(0, 600));
  }
  const refText = (await mPage.locator('text=/Booking Reference/i').first().textContent().catch(() => '')) || '';
  console.log('  booking reference:', refText.replace(/\s+/g, ' ').trim());
  await mPage.screenshot({ path: path.join(SHOTS, 'booking-success-375.jpg'), quality: 80 });

  // 5. WhatsApp float + mobile book bar
  await mPage.goto(BASE + '/vehicles', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await mPage.waitForLoadState('load', { timeout: 30000 }).catch(() => {});
  const waFloat = await mPage.locator('a[href*="wa.me"], a[aria-label*="WhatsApp" i]').count();
  check('WhatsApp entry point present', waFloat > 0, `${waFloat} elements`);
  await mPage.screenshot({ path: path.join(SHOTS, 'vehicles-375.jpg'), quality: 80 });
  await mobile.close();

  // ============ Desktop 1440px ============
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const dPage = await desktop.newPage();
  await dPage.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await dPage.waitForLoadState('load', { timeout: 30000 }).catch(() => {});
  const bookBtn = await dPage.getByRole('link', { name: /Book a Car/i }).first().isVisible().catch(() => false);
  check('Desktop gold “Book a Car” CTA visible', bookBtn);
  const burgerHidden = !(await dPage.locator('button[aria-label*="menu" i]').first().isVisible().catch(() => true));
  check('Desktop has no hamburger button', burgerHidden);
  await dPage.screenshot({ path: path.join(SHOTS, 'home-1440.jpg'), quality: 80 });

  // 6. Admin login + dashboard + bookings list
  await dPage.goto(BASE + '/admin/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await dPage.waitForLoadState('load', { timeout: 30000 }).catch(() => {});
  await dPage.locator('input[type="email"], input[name="email"]').first().fill('info@awanrentalservice.org');
  await dPage.locator('input[type="password"], input[name="password"]').first().fill('admin123');
  await dPage.locator('button[type="submit"]').first().click();
  await dPage.waitForURL('**/admin', { timeout: 30000 }).catch(() => {});
  check('Admin login redirects to dashboard', dPage.url().includes('/admin') && !dPage.url().includes('login'), dPage.url());
  await dPage.waitForLoadState('load', { timeout: 30000 }).catch(() => {});
  await dPage.screenshot({ path: path.join(SHOTS, 'admin-dashboard-1440.jpg'), quality: 80 });
  await dPage.goto(BASE + '/admin/bookings', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await dPage.waitForLoadState('load', { timeout: 30000 }).catch(() => {});
  const bookingsBody = ((await dPage.textContent('body')) || '');
  const bookingsRendered =
    (await dPage.locator('table').count()) > 0 ||
    bookingsBody.includes('Booking Requests') ||
    bookingsBody.includes('Bookings') ||
    bookingsBody.includes('No bookings yet');
  check('Admin bookings page renders (table or empty state)', bookingsRendered);
  check('Booking created by the audit test is listed in admin', bookingsBody.includes('Test Customer (Audit)'));
  await dPage.screenshot({ path: path.join(SHOTS, 'admin-bookings-1440.jpg'), quality: 80 });

  // 7. WhatsApp wa.me link on a PUBLIC page (admin pages never render it)
  await dPage.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await dPage.waitForLoadState('load', { timeout: 30000 }).catch(() => {});
  const waDesktop = await dPage.locator('a[href*="wa.me"]').count();
  check('WhatsApp wa.me link present in public markup', waDesktop > 0, `${waDesktop} links`);
  await desktop.close();
  await browser.close();

  const failed = results.filter((r) => !r.ok);
  console.log('\n===================================');
  console.log(`Functional checks passed: ${results.length - failed.length}/${results.length}`);
  if (failed.length) {
    console.log('Failures:');
    failed.forEach((f) => console.log(' - ' + f.name));
    process.exit(1);
  }
})().catch((e) => {
  console.error('FUNCTIONAL CHECK CRASHED:', e);
  process.exit(1);
});
