/**
 * Post-build: make `.next/standalone` a fully runnable bundle.
 *
 * Next.js does not copy static assets into the standalone output on its own —
 * `node .next/standalone/server.js` will 404 every image and CSS file unless
 * `public/` and `.next/static/` are placed alongside it. This runs after
 * `next build` so either runtime (`next start` or the standalone server) works.
 */
import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const standalone = join(root, '.next', 'standalone');

if (!existsSync(standalone)) {
  // `output: 'standalone'` was removed — nothing to do.
  console.log('[copy-standalone] no .next/standalone found, skipping');
  process.exit(0);
}

const copies = [];

const publicDir = join(root, 'public');
if (existsSync(publicDir)) {
  cpSync(publicDir, join(standalone, 'public'), { recursive: true });
  copies.push('public/');
}

const staticDir = join(root, '.next', 'static');
if (existsSync(staticDir)) {
  const dest = join(standalone, '.next', 'static');
  mkdirSync(dest, { recursive: true });
  cpSync(staticDir, dest, { recursive: true });
  copies.push('.next/static/');
}

console.log(
  copies.length
    ? `[copy-standalone] copied ${copies.join(' + ')} into .next/standalone`
    : '[copy-standalone] nothing to copy',
);
