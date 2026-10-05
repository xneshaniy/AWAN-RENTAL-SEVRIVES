/**
 * Generates the raster image assets that are derived from SVG sources.
 *
 *   node scripts/generate-image-assets.mjs
 *
 * Outputs:
 *   src/app/icon.svg                  (hand-maintained source of the logo)
 *   src/app/apple-icon.png            180x180, full bleed (iOS masks it itself)
 *   public/favicon.ico                16/32/48 PNG entries in a classic ICO
 *   public/placeholder-vehicle.png    800x600 fallback thumbnail
 *   public/og-image.jpg               1200x630 social share card
 *
 * The placeholder is rasterised on purpose: next/image refuses to run SVG
 * through the optimizer unless dangerouslyAllowSVG is enabled, which would be
 * an unnecessary risk while remotePatterns allows any host. Rasterising once at
 * build-authoring time keeps the optimizer strict.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const svg = readFileSync(resolve(root, 'src/app/icon.svg'));

/** Same logo artwork, but a full-bleed square: iOS applies its own mask. */
const appleSvg = Buffer.from(
  [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">',
    '<rect width="64" height="64" fill="#0369a1"/>',
    '<path d="M21 31 L26 22 H38 L43 31 Z" fill="#e0f2fe"/>',
    '<rect x="12" y="31" width="40" height="12" rx="5" fill="#ffffff"/>',
    '<circle cx="21" cy="45" r="5.5" fill="#082f49"/>',
    '<circle cx="43" cy="45" r="5.5" fill="#082f49"/>',
    '<circle cx="21" cy="45" r="2" fill="#e0f2fe"/>',
    '<circle cx="43" cy="45" r="2" fill="#e0f2fe"/>',
    '</svg>',
  ].join('')
);

mkdirSync(resolve(root, 'src/app'), { recursive: true });
mkdirSync(resolve(root, 'public'), { recursive: true });

await sharp(appleSvg).resize(180, 180).png().toFile(resolve(root, 'src/app/apple-icon.png'));

/** Sizes embedded in the .ico, smallest first. */
const SIZES = [16, 32, 48];
const pngs = [];
for (const size of SIZES) {
  pngs.push({ size, data: await sharp(svg).resize(size, size).png().toBuffer() });
}

// ICONDIR (6 bytes) + one 16-byte ICONDIRENTRY per image, then the image data.
const header = Buffer.alloc(6 + pngs.length * 16);
header.writeUInt16LE(0, 0); // reserved, must be 0
header.writeUInt16LE(1, 2); // type 1 = icon
header.writeUInt16LE(pngs.length, 4);

let offset = header.length;
pngs.forEach((entry, i) => {
  const p = 6 + i * 16;
  header.writeUInt8(entry.size % 256, p); // width (0 == 256)
  header.writeUInt8(entry.size % 256, p + 1); // height
  header.writeUInt8(0, p + 2); // colour count, 0 = true colour
  header.writeUInt8(0, p + 3); // reserved
  header.writeUInt16LE(1, p + 4); // colour planes
  header.writeUInt16LE(32, p + 6); // bits per pixel
  header.writeUInt32LE(entry.data.length, p + 8);
  header.writeUInt32LE(offset, p + 12);
  offset += entry.data.length;
});

writeFileSync(resolve(root, 'public/favicon.ico'), Buffer.concat([header, ...pngs.map((e) => e.data)]));

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
 */
const ogSvg = Buffer.from(
  [
    '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">',
    '<defs>',
    '<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">',
    '<stop offset="0%" stop-color="#075985"/>',
    '<stop offset="55%" stop-color="#0369a1"/>',
    '<stop offset="100%" stop-color="#082f49"/>',
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
    // Logo lock-up, reusing the apple-icon artwork so the mark always matches.
    '<g transform="translate(96 168)">',
    '<rect x="0" y="0" width="152" height="152" rx="34" fill="#ffffff"/>',
    '<g transform="translate(3.4 -11) scale(2.4)">',
    '<path d="M21 31 L26 22 H38 L43 31 Z" fill="#0369a1"/>',
    '<rect x="12" y="31" width="40" height="12" rx="5" fill="#082f49"/>',
    '<circle cx="21" cy="45" r="5.5" fill="#075985"/>',
    '<circle cx="43" cy="45" r="5.5" fill="#075985"/>',
    '<circle cx="21" cy="45" r="2" fill="#ffffff"/>',
    '<circle cx="43" cy="45" r="2" fill="#ffffff"/>',
    '</g>',
    '</g>',
    // Brand name + tagline.
    '<text x="296" y="248" fill="#ffffff" font-family="Segoe UI, Helvetica, Arial, sans-serif"',
    ' font-size="74" font-weight="700" letter-spacing="-1">AWAN RENTAL SERVICE</text>',
    '<text x="296" y="310" fill="#e0f2fe" font-family="Segoe UI, Helvetica, Arial, sans-serif"',
    ' font-size="36" font-weight="400">Car Rental &amp; Ground Transportation Across Pakistan</text>',
    // Footer strip: domain on the left, phone on the right.
    '<rect x="0" y="534" width="1200" height="96" fill="#000000" fill-opacity="0.28"/>',
    '<text x="96" y="590" fill="#ffffff" font-family="Segoe UI, Helvetica, Arial, sans-serif"',
    ' font-size="32" font-weight="600">awanrentalservice.org</text>',
    '<text x="1104" y="590" text-anchor="end" fill="#bae6fd"',
    ' font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="32" font-weight="600">',
    '+92 305 6846811</text>',
    '</svg>',
  ].join('')
);

await sharp(ogSvg).jpeg({ quality: 88, mozjpeg: true }).toFile(resolve(root, 'public/og-image.jpg'));

console.log(
  'wrote src/app/apple-icon.png, public/favicon.ico, public/placeholder-vehicle.png, public/og-image.jpg'
);
