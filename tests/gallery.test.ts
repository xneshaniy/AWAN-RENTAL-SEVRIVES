import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, test } from 'node:test';

/**
 * Regression tests for the gallery upload bug.
 *
 * THE BUG, proved from build artefacts rather than guessed:
 *
 * `/gallery` used no dynamic API and declared no route segment config, so
 * Next.js statically prerendered it. `.next/server/app/gallery.html` existed
 * (123 KB, 255 baked-in image URLs) and
 * `prerender-manifest.json` recorded it with `initialRevalidateSeconds:
 * false` - meaning the page NEVER revalidated. A photo uploaded in the admin
 * panel was written to PostgreSQL, but the public Gallery kept serving the
 * build-time snapshot until the next deploy.
 *
 * There was also nowhere in the admin panel to see gallery media at all:
 * `ADMIN_NAV` had no Gallery entry.
 *
 * These tests fail if either half of the fix is reverted.
 */

const root = process.cwd();
const galleryPagePath = resolve(root, 'src', 'app', 'gallery', 'page.tsx');
const adminGalleryPath = resolve(
  root,
  'src',
  'app',
  'admin',
  '(dashboard)',
  'gallery',
  'page.tsx'
);
const typesPath = resolve(root, 'src', 'types', 'index.ts');
const adminShellPath = resolve(root, 'src', 'components', 'admin', 'AdminShell.tsx');

describe('public gallery is rendered per request', () => {
  test('src/app/gallery/page.tsx opts out of static prerendering', () => {
    const source = readFileSync(galleryPagePath, 'utf8');
    assert.match(
      source,
      /export const dynamic = 'force-dynamic';/,
      'without `export const dynamic = "force-dynamic"` Next.js will freeze the ' +
        'gallery at build time and uploads will stop appearing until the next deploy'
    );
  });

  test('the opt-out is documented so it is not removed as dead code', () => {
    const source = readFileSync(galleryPagePath, 'utf8');
    assert.match(
      source,
      /initialRevalidateSeconds/,
      'the comment must keep explaining WHY this page cannot be static'
    );
    assert.match(source, /gallery\.html/, 'the comment must cite the artefact it froze');
  });

  test('the built output does not prerender /gallery', () => {
    const manifestPath = resolve(root, '.next', 'prerender-manifest.json');
    if (!existsSync(manifestPath)) {
      // `npm run build` has not been run yet - the source assertion above
      // still covers the regression, so this is not a silent pass.
      console.log('    (no .next build present - skipping the artefact check)');
      return;
    }

    assert.equal(
      existsSync(resolve(root, '.next', 'server', 'app', 'gallery.html')),
      false,
      'gallery.html must not exist: its presence means the page was frozen at build time'
    );

    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
      routes: Record<string, { initialRevalidateSeconds: number | false }>;
    };
    assert.equal(
      Object.prototype.hasOwnProperty.call(manifest.routes, '/gallery'),
      false,
      '/gallery must not appear in the prerender manifest'
    );
  });
});

describe('the admin panel has a gallery view', () => {
  test('the admin gallery page exists', () => {
    assert.ok(existsSync(adminGalleryPath), 'src/app/admin/(dashboard)/gallery/page.tsx is missing');
  });

  test('the admin gallery page is reachable from the sidebar', () => {
    const types = readFileSync(typesPath, 'utf8');
    const navMatch = types.match(/export const ADMIN_NAV = \[([\s\S]*?)\n\];/);
    assert.ok(navMatch, 'ADMIN_NAV could not be located');
    assert.match(
      navMatch[1],
      /href: '\/admin\/gallery'/,
      'ADMIN_NAV has no Gallery entry, so uploaded media cannot be seen in Admin'
    );
  });

  test('the sidebar renders an icon for the new entry', () => {
    const shell = readFileSync(adminShellPath, 'utf8');
    assert.match(shell, /'\/admin\/gallery':\s*Images/, 'AdminShell needs an ICONS_BY_HREF entry');
  });

  test('the admin gallery page keeps the staff-only gate', () => {
    const source = readFileSync(adminGalleryPath, 'utf8');
    assert.match(
      source,
      /await requireStaffAccess\(\);/,
      'the gallery must repeat the staff check rather than rely on the layout alone'
    );
  });

  test('the admin gallery page shows only non-archived vehicles', () => {
    const source = readFileSync(adminGalleryPath, 'utf8');
    assert.match(
      source,
      /archivedAt: null/,
      'archived vehicles are excluded from the public gallery and must match here'
    );
  });
});
