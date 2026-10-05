/**
 * Generates the full favicon / PWA icon set from a single logo file.
 *
 * Usage:
 *   node scripts/generate-favicons.mjs [path/to/logo.png]
 *
 * With no argument it looks for the first image inside ./Logo/
 *
 * Source formats: .svg .png .jpg .jpeg .webp
 * The logo is centred on a square transparent canvas at 86% scale so any
 * aspect ratio (wide wordmarks, tall marks) renders correctly at 16px.
 *
 * Outputs:
 *   public/favicon.ico              16 + 32 + 48 (PNG-compressed ICO)
 *   public/favicon-16x16.png
 *   public/favicon-32x32.png
 *   public/apple-touch-icon.png     180x180 (opaque white background, per Apple)
 *   public/icon-192.png             PWA
 *   public/icon-512.png             PWA
 *   public/site.webmanifest
 */
import sharp from 'sharp';
import { readdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LOGO_DIR = path.join(ROOT, 'Logo');
const PUBLIC = path.join(ROOT, 'public');
const SRC_APP = path.join(ROOT, 'src', 'app');
const SOURCE_EXTS = ['.svg', '.png', '.jpg', '.jpeg', '.webp'];
const COVER = 0.86; // logo occupies 86% of the square, so it never touches the edge

/** Brand colour from globals.css `--primary: 201 96% 32%` (HSL) → #0369A1 */
const THEME_COLOR = '#0369a1';

async function findSource() {
  const arg = process.argv[2];
  if (arg) {
    const p = path.resolve(ROOT, arg);
    await readFile(p); // throws early if missing
    return p;
  }
  const entries = await readdir(LOGO_DIR, { withFileTypes: true }).catch(() => []);
  const hit = entries.find(
    (e) => e.isFile() && SOURCE_EXTS.includes(path.extname(e.name).toLowerCase())
  );
  if (!hit) {
    console.error(
      `No logo found. Add an image (${SOURCE_EXTS.join(', ')}) to ${LOGO_DIR}` +
        `\nor pass a path: node scripts/generate-favicons.mjs <logo.png>`
    );
    process.exit(1);
  }
  return path.join(LOGO_DIR, hit.name);
}

/**
 * Renders `size`x`size`, logo centred on a transparent square (white for the
 * apple touch icon, which iOS composites onto a white page anyway).
 */
async function square(source, size, { background = null } = {}) {
  const buf = await readFile(source);
  const meta = await sharp(buf).metadata();

  // SVG without intrinsic dimensions: rasterise at 1024 wide first.
  let input = buf;
  if (meta.format === 'svg' && (!meta.width || !meta.height)) {
    input = await sharp(buf, { density: 300 }).resize(1024).png().toBuffer();
  }

  const fitted = await sharp(input)
    .resize(size, size, {
      fit: 'inside',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  const f = await sharp(fitted).metadata();
  const w = Math.min(size, Math.round(size * COVER));
  const h = Math.min(size, Math.round((w * f.height) / f.width));
  const scaled = await sharp(fitted)
    .resize(Math.min(size, w), Math.min(size, h), { fit: 'inside' })
    .png()
    .toBuffer();

  const canvas = {
    create: {
      width: size,
      height: size,
      channels: 4,
      background: background ?? { r: 0, g: 0, b: 0, alpha: 0 },
    },
  };

  const s = await sharp(scaled).metadata();
  return sharp(canvas)
    .composite([
      {
        input: scaled,
        gravity: 'centre',
        // gravity centres by the buffer's own bounds; compute exact offsets
        top: Math.max(0, Math.round((size - s.height) / 2)),
        left: Math.max(0, Math.round((size - s.width) / 2)),
      },
    ])
    .png()
    .toBuffer();
}

/** Minimal ICO container holding PNG-compressed entries (supported since Vista). */
function buildIco(pngs) {
  const count = pngs.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(count, 4);

  const entries = [];
  let offset = 6 + count * 16;
  for (const { size, data } of pngs) {
    const e = Buffer.alloc(16);
    e.writeUInt8(size === 256 ? 0 : size, 0); // width
    e.writeUInt8(size === 256 ? 0 : size, 1); // height
    e.writeUInt8(0, 2); // palette colours
    e.writeUInt8(0, 3); // reserved
    e.writeUInt16LE(1, 4); // colour planes
    e.writeUInt16LE(32, 6); // bits per pixel
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    entries.push(e);
    offset += data.length;
  }

  return Buffer.concat([header, ...entries, ...pngs.map((p) => p.data)]);
}

async function main() {
  const source = await findSource();
  const name = path.basename(source);
  console.log(`Source: ${name}`);

  const jobs = [
    ['favicon-16x16.png', 16, PUBLIC],
    ['favicon-32x32.png', 32, PUBLIC],
    ['icon-192.png', 192, PUBLIC],
    ['icon-512.png', 512, PUBLIC],
    ['apple-touch-icon.png', 180, PUBLIC, { background: { r: 255, g: 255, b: 255, alpha: 1 } }],
    ['icon.png', 512, SRC_APP], // replaces src/app/icon.svg
    ['apple-icon.png', 180, SRC_APP, { background: { r: 255, g: 255, b: 255, alpha: 1 } }],
  ];

  for (const [file, size, dir, opts] of jobs) {
    const buf = await square(source, size, opts);
    await writeFile(path.join(dir, file), buf);
    console.log(`  ${path.relative(ROOT, path.join(dir, file))}  ${size}x${size}  ${buf.length} B`);
  }

  const icoSizes = [16, 32, 48];
  const icoPngs = [];
  for (const s of icoSizes) icoPngs.push({ size: s, data: await square(source, s) });
  const ico = buildIco(icoPngs);
  await writeFile(path.join(PUBLIC, 'favicon.ico'), ico);
  console.log(`  public/favicon.ico  ${icoSizes.join('/')}  ${ico.length} B`);

  const manifest = {
    name: 'AWAN RENTAL SERVICE',
    short_name: 'Awan Rental',
    description:
      'Car rental and transportation services in Pakistan — self-drive, chauffeur, airport transfers and outstation travel.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#ffffff',
    theme_color: THEME_COLOR,
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
  await writeFile(
    path.join(PUBLIC, 'site.webmanifest'),
    JSON.stringify(manifest, null, 2) + '\n'
  );
  console.log('  public/site.webmanifest');

  console.log('\nDone. Run `npm run build` to pick up src/app/icon.png and apple-icon.png.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
