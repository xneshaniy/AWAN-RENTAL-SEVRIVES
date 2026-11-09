/**
 * Awan Rental Service - Complete local website audit.
 *
 * Usage: node audit-site.cjs
 * Output: audit-report/  (screenshots + AUDIT-REPORT.md)
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = 'http://localhost:3000';
const OUT = path.join('audit-report');
const SHOTS = path.join(OUT, 'screenshots');

const VIEWPORTS = [
  { id: '320', w: 320, h: 568, label: '320px small phone' },
  { id: '360', w: 360, h: 740, label: '360px Android' },
  { id: '375', w: 375, h: 812, label: '375px iPhone' },
  { id: '390', w: 390, h: 844, label: '390px iPhone' },
  { id: '414', w: 414, h: 896, label: '414px larger phone' },
  { id: '430', w: 430, h: 932, label: '430px Pro Max' },
  { id: '768', w: 768, h: 1024, label: '768px tablet' },
  { id: '1024', w: 1024, h: 768, label: '1024px small desktop' },
  { id: '1440', w: 1440, h: 900, label: '1440px desktop' },
];

const PUBLIC_PAGES = [
  '/',
  '/about',
  '/vehicles',
  '/booking',
  '/self-drive',
  '/services',
  '/contact',
  '/faq',
  '/gallery',
  '/blog',
  '/cancellation-policy',
  '/cookie-policy',
  '/privacy-policy',
  '/rental-terms',
  '/terms-and-conditions',
  '/airport-transfers',
  '/airport-transfer-islamabad',
  '/chauffeur-service',
  '/chauffeur-service-pakistan',
  '/commercial-vehicle-rental',
  '/corporate-travel',
  '/corporate-car-rental-pakistan',
  '/family-travel',
  '/event-transportation',
  '/intercity-travel',
  '/car-rental-islamabad',
  '/car-rental-lahore',
  '/car-rental-rawalpindi',
  '/self-drive-car-rental-pakistan',
];

const RESULTS = [];

function record(page, issue) {
  RESULTS.push({ page, ...issue });
}

async function auditPage(page, route) {
  const consoleErrors = [];
  const networkFailures = [];
  const failedRequests = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('requestfailed', (req) => {
    const failure = req.failure();
    networkFailures.push(`${req.method()} ${req.url()} - ${failure ? failure.errorText : 'failed'}`);
  });
  page.on('response', (res) => {
    if (res.status() >= 400) failedRequests.push(`${res.status()} ${res.url()}`);
  });

  let status = 0;
  try {
    const response = await page.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 45000 });
    // Give client-side content a chance to settle without waiting for the
    // never-ending /api/notifications/stream SSE subscription.
    await page.waitForLoadState('load', { timeout: 15000 }).catch(() => {});
    status = response ? response.status() : 0;
  } catch (err) {
    record(route, { severity: 'CRITICAL', category: 'Load', message: `Page failed to load: ${err.message}` });
  }

  // Check document headings / SEO
  const title = await page.title();
  const metaDesc = await page.$eval('head meta[name="description"]', (el) => el.content || '').catch(() => null);
  const h1 = await page.$$eval('h1', (els) => els.map((el) => el.textContent.trim())).catch(() => []);
  // WCAG: an image fails only when it has NO alt attribute at all.
  // alt="" is correct for decorative images and must not be flagged.
  const images = await page.$$eval('img', (imgs) => imgs.map((img) => ({
    src: img.currentSrc || img.src,
    alt: img.getAttribute('alt'), // null => attribute missing => WCAG failure
  })));
  const lang = await page.getAttribute('html', 'lang');
  const bodyText = ((await page.textContent('body')) || '').length;
  const hasFavicon = await page.$eval('link[rel~="icon"]', (el) => el.href).catch(() => null);

  // WCAG: an image fails only when it has NO alt attribute at all.
  const missingAlt = images.filter((img) => img.alt === null);
  for (const img of missingAlt) {
    record(route, { severity: 'MEDIUM', category: 'Accessibility', message: `Image has no alt attribute: ${img.src}` });
  }

  // Horizontal overflow is checked per viewport inside the screenshot loop
  // below (innerText metrics change with width).
  const headingStructure = await page.$$eval('h1, h2, h3', (els) => els.map((el) => ({ tag: el.tagName, text: el.textContent.trim() })));

  // Screenshots + horizontal-overflow check at every viewport
  let worstOverflow = { width: 1440, overflow: 0 };
  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.w, height: vp.h });
    await page.waitForTimeout(150); // allow reflow
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    if (scrollWidth > vp.w + 1) {
      record(route, { severity: 'CRITICAL', category: 'Layout', message: `Horizontal overflow at ${vp.w}px: scrollWidth ${scrollWidth}px > viewport ${vp.w}px` });
      if (scrollWidth - vp.w > worstOverflow.overflow) worstOverflow = { width: vp.w, overflow: scrollWidth - vp.w };
    }
    const safe = route === '/' ? 'home' : route.replace(/^\//, '').replace(/\//g, '_');
    fs.mkdirSync(SHOTS, { recursive: true });
    await page.screenshot({ path: path.join(SHOTS, `${safe}-${vp.id}.jpg`), fullPage: false, quality: 80 });
  }
  await page.setViewportSize({ width: 1440, height: 900 });

  if (!lang) record(route, { severity: 'HIGH', category: 'Accessibility', message: 'Missing <html lang> attribute' });
  if (!title) record(route, { severity: 'HIGH', category: 'SEO', message: 'Missing page title' });
  else if (title.length < 20) record(route, { severity: 'LOW', category: 'SEO', message: `Short title: "${title}"` });
  if (!metaDesc) record(route, { severity: 'MEDIUM', category: 'SEO', message: 'Missing meta description' });
  if (h1.length === 0) record(route, { severity: 'HIGH', category: 'SEO', message: 'No <h1> found' });
  if (!hasFavicon) record(route, { severity: 'LOW', category: 'SEO', message: 'No favicon link' });
  if (bodyText < 100) record(route, { severity: 'MEDIUM', category: 'Content', message: 'Page has suspiciously little content' });

  consoleErrors.forEach((e) =>
    record(route, { severity: 'HIGH', category: 'Console', message: e.slice(0, 300) })
  );
  networkFailures.forEach((e) =>
    record(route, { severity: 'HIGH', category: 'Network', message: e.slice(0, 300) })
  );
  failedRequests.forEach((e) =>
    record(route, { severity: 'HIGH', category: 'Network', message: e.slice(0, 300) })
  );

  return {
    status,
    title,
    imageCount: images.length,
    h1Count: h1.length,
    consoleErrors: consoleErrors.length,
    networkFailures: networkFailures.length,
    overflowWidth: worstOverflow.width,
    overflowPx: worstOverflow.overflow,
  };
}

(async () => {
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
  for (const sub of ['mobile', 'desktop']) fs.mkdirSync(path.join(OUT, sub), { recursive: true });

  const launchOptions = {
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  };

  const browser = await chromium.launch(launchOptions);
  const pagesReport = [];

  for (const route of PUBLIC_PAGES) {
    const page = await browser.newPage();
    console.log(`Auditing ${route}...`);
    const summary = await auditPage(page, route);
    pagesReport.push({ route, ...summary, screenshots: VIEWPORTS.map((v) => `${route === '/' ? 'home' : route.replace(/^\//, '').replace(/\//g, '_')}-${v.id}.jpg`) });
    await page.close();
  }

  // Vehicle detail page (first demo vehicle)
  const home = await browser.newPage();
  await home.goto(BASE + '/vehicles', { waitUntil: 'domcontentloaded', timeout: 45000 });
  const firstCarLink = await home.$eval('a[href^="/vehicles/"]', (a) => a.getAttribute('href')).catch(() => null);
  await home.close();
  if (firstCarLink) {
    const page = await browser.newPage();
    console.log(`Auditing ${firstCarLink}...`);
    const summary = await auditPage(page, firstCarLink);
    pagesReport.push({ route: firstCarLink, ...summary });
    await page.close();
  }

  await browser.close();

  // Build report text
  const critical = RESULTS.filter((r) => r.severity === 'CRITICAL');
  const high = RESULTS.filter((r) => r.severity === 'HIGH');
  const medium = RESULTS.filter((r) => r.severity === 'MEDIUM');
  const low = RESULTS.filter((r) => r.severity === 'LOW');

  let md = `# Awan Rental Service — Audit Report\n\n`;
  md += `Total pages audited: ${pagesReport.length}\n`;
  md += `Total findings: Critical ${critical.length}, High ${high.length}, Medium ${medium.length}, Low ${low.length}\n\n`;
  md += `## Critical (${critical.length})\n\n`;
  critical.forEach((r) => (md += `- [${r.severity}] ${r.page} — **${r.category}**: ${r.message}\n`));
  md += `\n## High (${high.length})\n\n`;
  high.forEach((r) => (md += `- [${r.severity}] ${r.page} — **${r.category}**: ${r.message}\n`));
  md += `\n## Medium (${medium.length})\n\n`;
  medium.forEach((r) => (md += `- [${r.severity}] ${r.page} — **${r.category}**: ${r.message}\n`));
  md += `\n## Low (${low.length})\n\n`;
  low.forEach((r) => (md += `- [${r.severity}] ${r.page} — **${r.category}**: ${r.message}\n`));
  md += `\n## Per-page summary\n\n`;
  pagesReport.forEach((p) => {
    md += `### ${p.route}\n`;
    md += `- Status: ${p.status}\n- Title: ${p.title}\n- Images: ${p.imageCount}, H1: ${p.h1Count}\n- Horizontal overflow: ${p.overflowPx > 0 ? `${p.overflowPx}px at ${p.overflowWidth}px viewport` : 'none'}\n- Console errors: ${p.consoleErrors}, network failures: ${p.networkFailures}\n\n`;
  });

  fs.writeFileSync(path.join(OUT, 'AUDIT-REPORT.md'), md);
  console.log('\nAUDIT COMPLETE');
  console.log(`  Pages audited: ${pagesReport.length}`);
  console.log(`  Critical: ${critical.length}`);
  console.log(`  High: ${high.length}`);
  console.log(`  Medium: ${medium.length}`);
  console.log(`  Low: ${low.length}`);
})().catch((e) => {
  console.error('AUDIT FAILED:', e);
  process.exit(1);
});
