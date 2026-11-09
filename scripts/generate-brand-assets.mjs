/**
 * Builds the raster exports of the Awan Rental Service artwork:
 *
 *   public/brand-mark.png   the badge/car mark, 600 x 600, transparent
 *   public/brand-logo.png   the full lockup, 1200 x 400, transparent
 *
 * The website itself does not load these files: the header renders
 * <BrandMark> as inline SVG and <Logo> sets the wordmark as live text, which
 * keeps everything sharp at any size. These PNGs are the downloadable /
 * email / social versions of the same artwork.
 *
 * Both source SVGs are self-contained. The lockup's lettering is outlined
 * from Poppins, so rasterising does not depend on a font being installed.
 *
 * Run: node scripts/generate-brand-assets.mjs
 */
import sharp from 'sharp';
import { mkdirSync, readFileSync } from 'node:fs';

const MARK_SRC = 'src/assets/logo-mark.svg';
const LOCKUP_SRC = 'src/assets/logo-lockup.svg';
const OUT_DIR = 'public';

mkdirSync(OUT_DIR, { recursive: true });

const mark = readFileSync(MARK_SRC);
const lockup = readFileSync(LOCKUP_SRC);

await sharp(mark)
  .resize(600, 600)
  .png({ compressionLevel: 9 })
  .toFile(`${OUT_DIR}/brand-mark.png`);

await sharp(lockup)
  .resize(1200, 400)
  .png({ compressionLevel: 9 })
  .toFile(`${OUT_DIR}/brand-logo.png`);

console.log('brand-mark.png  600x600');
console.log('brand-logo.png  1200x400');
