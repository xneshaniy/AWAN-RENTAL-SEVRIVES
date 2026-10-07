/**
 * Builds the two layout brand assets out of Logo/logo.png:
 *
 *   public/brand-mark.png   car + swoosh only (the wordmark cropped off),
 *                           transparent background - used in the header.
 *   public/brand-logo.png   full lockup, also transparent, with an even
 *                           margin - used in the footer and the 404 page.
 *
 * BOTH assets are transparent. The lockup used to be composited onto a solid
 * white plate, which meant the image itself decided where a white rectangle
 * appeared - impossible to place on anything but a white surface, and a
 * jarring box on the dark footer. The plate is gone; the background is now
 * flooded away exactly as it is for the mark, and any surface dark enough to
 * swallow the black wordmark supplies its own light card in CSS instead (see
 * Footer and not-found.tsx).
 *
 * The header shows the mark next to the company name as real text, so the
 * name is never baked into pixels there. The footer and the 404 show the
 * full lockup at a size where its own wordmark stays legible.
 *
 * Run: node scripts/generate-brand-assets.mjs
 */
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

const SRC = 'Logo/logo.png';
const OUT_DIR = 'public';

/** Margin, in source pixels, around the full lockup. Now transparent, so it
 *  doubles as the breathing room a caller's CSS card needs. */
const PLATE_PADDING = 44;
/** Near-white is treated as background when measuring the artwork's bbox. */
const WHITE_THRESHOLD = 246;
/**
 * Floods are deliberately a little more tolerant than the bbox scan.
 *
 * The source art sits on white, so every edge pixel is a blend of artwork and
 * white. Stopping at 246 leaves a band of 200-245 pixels opaque, which reads
 * as a white fringe the moment the transparent asset lands on a dark surface.
 * 232 eats that band without reaching any artwork: the outline that separates
 * plate from art is near-black, so there is no bridge to cross.
 */
const FLOOD_THRESHOLD = 232;

const { data, info } = await sharp(SRC)
  .flatten({ background: { r: 255, g: 255, b: 255 } })
  .raw()
  .toBuffer({ resolveWithObject: true });

const W = info.width;
const H = info.height;
const CH = info.channels;
const idx = (x, y) => (y * W + x) * CH;
const isWhite = (i) =>
  data[i] >= WHITE_THRESHOLD &&
  data[i + 1] >= WHITE_THRESHOLD &&
  data[i + 2] >= WHITE_THRESHOLD;

/*
 * The delivered PNG carries a single dark 1px row along its bottom edge
 * (pure artwork bleed, not part of the logo). Ignore it everywhere below so
 * it never lands in an asset.
 */
const ARTIFACT_ROWS = 1;
const USABLE_H = H - ARTIFACT_ROWS;

// --- content bounding box, excluding the artifact row ---------------------
let minX = Infinity;
let maxX = -1;
let minY = Infinity;
let maxY = -1;
for (let y = 0; y < USABLE_H; y++) {
  for (let x = 0; x < W; x++) {
    if (isWhite(idx(x, y))) continue;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
}
if (maxX < 0) throw new Error(`${SRC}: no artwork found`);

/*
 * Split the lockup from the car. The car's front bumper reaches almost to
 * the left edge (x ~ 11) while the "Awan" wordmark starts well inboard
 * (x ~ 149), so the first row where the left edge retreats and stays put is
 * the seam. Searched downward from below the roof line.
 */
const leftmostInk = (y) => {
  if (y < 0 || y >= USABLE_H) return -1;
  for (let x = 0; x < W; x++) if (!isWhite(idx(x, y))) return x;
  return -1;
};

/*
 * The car's front bumper is the widest thing in the lockup and reaches almost
 * to the left edge, while the wordmark starts well inboard. Anchor on the
 * single widest row first: searching from the top of the artwork would stop at
 * the narrow roof line instead of the seam.
 */
let widestRow = -1;
let widestLeft = Infinity;
for (let y = minY; y <= maxY; y++) {
  const left = leftmostInk(y);
  if (left < 0) continue;
  if (left < widestLeft) {
    widestLeft = left;
    widestRow = y;
  }
}
if (widestRow < 0 || widestLeft > 60) {
  throw new Error(`${SRC}: car not found (widest row starts at x=${widestLeft})`);
}

let seam = -1;
for (let y = widestRow; y + 6 <= USABLE_H; y++) {
  let settled = true;
  for (let k = 0; k < 6 && settled; k++) {
    const left = leftmostInk(y + k);
    if (left < 0 || left < 60) settled = false;
  }
  if (settled) {
    seam = y;
    break;
  }
}
if (seam < 0) {
  throw new Error(`${SRC}: could not locate the car/wordmark seam`);
}

// --- public/brand-mark.png : car only, background flooded away ------------
const markLeft = Math.max(0, minX - 6);
const markRight = Math.min(W - 1, maxX + 6);
const markTop = Math.max(0, minY - 8);
const markBottom = Math.min(USABLE_H - 1, seam + 3);
const markW = markRight - markLeft + 1;
const markH = markBottom - markTop + 1;

const markSrc = Buffer.alloc(markW * markH * 3);
for (let y = 0; y < markH; y++) {
  for (let x = 0; x < markW; x++) {
    const s = idx(markLeft + x, markTop + y);
    const d = (y * markW + x) * 3;
    markSrc[d] = data[s];
    markSrc[d + 1] = data[s + 1];
    markSrc[d + 2] = data[s + 2];
  }
}

/**
 * Flood-fills the plate in from the crop edges and clears its alpha. Only the
 * background-connected white goes transparent, so white that sits *inside* the
 * artwork (wheel hubs, body panels) stays solid.
 */
function floodBackground(src, sw, sh) {
  const out = Buffer.alloc(sw * sh * 4);
  const seen = new Uint8Array(sw * sh);
  const stack = [];

  const push = (x, y) => {
    const p = y * sw + x;
    if (seen[p]) return;
    const i = p * 3;
    if (src[i] < FLOOD_THRESHOLD || src[i + 1] < FLOOD_THRESHOLD || src[i + 2] < FLOOD_THRESHOLD) return;
    seen[p] = 1;
    stack.push(p);
  };

  for (let x = 0; x < sw; x++) {
    push(x, 0);
    push(x, sh - 1);
  }
  for (let y = 0; y < sh; y++) {
    push(0, y);
    push(sw - 1, y);
  }

  while (stack.length) {
    const p = stack.pop();
    const x = p % sw;
    const y = (p / sw) | 0;
    if (x > 0) push(x - 1, y);
    if (x < sw - 1) push(x + 1, y);
    if (y > 0) push(x, y - 1);
    if (y < sh - 1) push(x, y + 1);
  }

  let cleared = 0;
  for (let p = 0; p < sw * sh; p++) {
    const i = p * 3;
    const o = p * 4;
    out[o] = src[i];
    out[o + 1] = src[i + 1];
    out[o + 2] = src[i + 2];
    if (seen[p]) {
      out[o + 3] = 0;
      cleared++;
    } else {
      out[o + 3] = 255;
    }
  }
  return { out, cleared, total: sw * sh };
}

const mark = floodBackground(markSrc, markW, markH);
const markClearPct = (mark.cleared / mark.total) * 100;
if (markClearPct < 35 || markClearPct > 85) {
  throw new Error(`${SRC}: mark transparency ${markClearPct.toFixed(1)}% looks wrong - flood fill leaked or stalled`);
}

// --- public/brand-logo.png : full lockup, transparent background -----------
const contentW = maxX - minX + 1;
const contentH = maxY - minY + 1;
const plateW = contentW + PLATE_PADDING * 2;
const plateH = contentH + PLATE_PADDING * 2;
const plate = Buffer.alloc(plateW * plateH * 3, 255);
for (let y = 0; y < contentH; y++) {
  for (let x = 0; x < contentW; x++) {
    const s = idx(minX + x, minY + y);
    const d = ((y + PLATE_PADDING) * plateW + (x + PLATE_PADDING)) * 3;
    plate[d] = data[s];
    plate[d + 1] = data[s + 1];
    plate[d + 2] = data[s + 2];
  }
}

/*
 * Flood the same way the mark does. The plate is seeded as white so the flood
 * can enter from every side, and only background-CONNECTED white clears -
 * white inside the artwork (the car's body panels, the space enclosed by the
 * swoosh) stays solid, which is what keeps the lockup readable when it is not
 * sitting on a white page.
 */
const lockup = floodBackground(plate, plateW, plateH);
const lockupClearPct = (lockup.cleared / lockup.total) * 100;
if (lockupClearPct < 35 || lockupClearPct > 97) {
  throw new Error(
    `${SRC}: lockup transparency ${lockupClearPct.toFixed(1)}% looks wrong - flood fill leaked or stalled`
  );
}

mkdirSync(OUT_DIR, { recursive: true });
await sharp(mark.out, { raw: { width: markW, height: markH, channels: 4 } })
  .png({ compressionLevel: 9 })
  .toFile(`${OUT_DIR}/brand-mark.png`);
await sharp(lockup.out, { raw: { width: plateW, height: plateH, channels: 4 } })
  .png({ compressionLevel: 9 })
  .toFile(`${OUT_DIR}/brand-logo.png`);

console.log(
  [
    `seam y=${seam}`,
    `brand-mark.png  ${markW}x${markH}  transparent ${markClearPct.toFixed(1)}%`,
    `brand-logo.png  ${plateW}x${plateH}  transparent ${lockupClearPct.toFixed(1)}%  margin ${PLATE_PADDING}px`,
  ].join('\n'),
);
