/**
 * Generates the raster image assets that are derived from the logo source.
 *
 *   node scripts/generate-image-assets.mjs
 *
 * Outputs:
 *   public/placeholder-vehicle.png    800x600 fallback thumbnail
 *   public/og-image.jpg               1200x630 social share card
 *
 * Icons (public/favicon.ico, public/favicon-*.png, public/apple-touch-icon.png,
 * public/site.webmanifest, src/app/icon.png, src/app/apple-icon.png) are
 * produced by scripts/generate-favicons.mjs from Logo/logo.png. Splitting the
 * outputs keeps the two scripts from overwriting each other's work.
 *
 * The placeholder is rasterised on purpose: next/image refuses to run SVG
 * through the optimizer unless dangerouslyAllowSVG is enabled, which would be
 * an unnecessary risk while remotePatterns allows any host. Rasterising once at
 * build-authoring time keeps the optimizer strict.
 */
import { readFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { recolourBrandSource } from './recolour-brand.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
/** Single source of truth for the brand artwork. */
const LOGO = resolve(root, 'Logo', 'logo.png');

mkdirSync(resolve(root, 'src/app'), { recursive: true });
mkdirSync(resolve(root, 'public'), { recursive: true });

const placeholderSvg = readFileSync(resolve(root, 'public/placeholder-vehicle.svg'));
await sharp(placeholderSvg)
  .resize(800, 600)
  .png({ compressionLevel: 9 })
  .toFile(resolve(root, 'public/placeholder-vehicle.png'));

/**
 * public/og-image.jpg — the social share card referenced by `getSEOConfig()`.
 * Without it every Facebook/WhatsApp/X share renders a broken preview, so it is
 * generated here rather than shipped by hand. 1200x630 is the dimension every
 * major platform crops to.
 *
 * The card is drawn as SVG (gradient, rings, typography) and the real logo is
 * composited on top afterwards, so the share image can never drift from the
 * actual brand artwork.
 */
const ogSvg = Buffer.from(
  [
    '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">',
    '<defs>',
    '<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">',
    '<stop offset="0%" stop-color="#116932"/>',
    '<stop offset="55%" stop-color="#15803d"/>',
    '<stop offset="100%" stop-color="#0c4b23"/>',
    '</linearGradient>',
    '<linearGradient id="shine" x1="0" y1="0" x2="1" y2="0">',
    '<stop offset="0%" stop-color="#ffffff" stop-opacity="0.14"/>',
    '<stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>',
    '</linearGradient>',
    '</defs>',
    '<rect width="1200" height="630" fill="url(#bg)"/>',
    // Faint rings keep the flat gradient from looking empty behind the text.
    '<g fill="none" stroke="#ffffff" stroke-opacity="0.09" stroke-width="2">',
    '<circle cx="1040" cy="120" r="180"/>',
    '<circle cx="1040" cy="120" r="280"/>',
    '<circle cx="120" cy="560" r="220"/>',
    '</g>',
    '<path d="M0 0 H620 L360 630 H0 Z" fill="url(#shine)"/>',
    // Brand name + tagline.
    '<text x="296" y="248" fill="#ffffff" font-family="Segoe UI, Helvetica, Arial, sans-serif"',
    ' font-size="74" font-weight="700" letter-spacing="-1">AWAN RENTAL SERVICE</text>',
    '<text x="296" y="310" fill="#ffebeb" font-family="Segoe UI, Helvetica, Arial, sans-serif"',
    ' font-size="36" font-weight="400">Car Rental &amp; Ground Transportation Across Pakistan</text>',
    // Footer strip: domain on the left, phone on the right.
    '<rect x="0" y="534" width="1200" height="96" fill="#000000" fill-opacity="0.28"/>',
    '<text x="96" y="590" fill="#ffffff" font-family="Segoe UI, Helvetica, Arial, sans-serif"',
    ' font-size="32" font-weight="600">awanrentalservice.org</text>',
    '<text x="1104" y="590" text-anchor="end" fill="#ffcccc"',
    ' font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="32" font-weight="600">',
    '+92 305 6846811</text>',
    '</svg>',
  ].join('')
);

const card = await sharp(ogSvg).png().toBuffer();

// Logo lock-up: 152x152 rounded plate at (96,168), matching the original
// layout. `dest-in` keeps only the part of the logo inside the rounded rect,
// so the artwork gets clean corners instead of a hard square edge.
const BOX = 152;
const mask = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${BOX}" height="${BOX}">` +
    `<rect width="${BOX}" height="${BOX}" rx="34" fill="#ffffff"/></svg>`
);
const plate = await sharp(await recolourBrandSource(LOGO))
  .resize(BOX, BOX, { fit: 'cover' })
  .composite([{ input: mask, blend: 'dest-in' }])
  .png()
  .toBuffer();

await sharp(card)
  .composite([{ input: plate, left: 96, top: 168 }])
  .jpeg({ quality: 88, mozjpeg: true })
  .toFile(resolve(root, 'public/og-image.jpg'));

console.log('wrote public/placeholder-vehicle.png, public/og-image.jpg');
