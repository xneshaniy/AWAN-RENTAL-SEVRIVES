/**
 * Maps the red in Logo/logo.png onto the site's primary green.
 *
 *   import { recolourRaw, recolourBrandSource } from './recolour-brand.mjs';
 *
 * WHY THIS EXISTS
 *
 * Logo/logo.png is tracked brand artwork, so it is deliberately never edited on
 * disk. Every raster the brand is built from - the header mark, the footer
 * lockup, every favicon and the social share card - is regenerated from that one
 * file, so the recolour is applied at generation time instead. The source stays
 * pristine, the mapping lives in one reviewable place, and reverting the brand
 * colour is a git checkout of the generated PNGs.
 *
 * HOW IT WORKS
 *
 * The artwork's saturated red measures hsl(0.28, 99.1%, 42.7%) (#d90202); the
 * site's primary is hsl(142.43, 71.9%, 29.2%) (#15803d). Rather than swapping
 * a hex - which would band the anti-aliased edges - each red pixel has its hue
 * moved to the brand hue while saturation and lightness are scaled by the ratio
 * between the two colours, so every blend keeps its relationship to its
 * neighbours.
 *
 * Two guards keep the recolour from damaging anything that is not brand red:
 *
 *   hue  - only pixels inside 330deg..30deg are touched, so the near-neutral
 *          cyan-tinted pixels that sit just under the white cutoff are left
 *          exactly as they are.
 *   sat  - pixels below 0.12 saturation are skipped. The black wordmark's
 *          anti-aliasing is a run of very slightly warm greys; without this
 *          guard their (arbitrary) computed hue would land in the red wedge and
 *          the type would pick up a green fringe.
 *
 * The lightness ramp protects the pale pink halo where the red fades into the
 * white plate: full scaling is applied at or below 0.6 lightness (which lands
 * the solid artwork precisely on #15803d), none at or above 0.85 (so the
 * faintest edge pixels keep their value), and a smooth interpolation in between.
 */
import sharp from 'sharp';

/** Measured from Logo/logo.png - the colour this module replaces. */
const SOURCE_RED = { h: 0.28, s: 0.9906, l: 0.4275 };

/** hsl(142.43, 71.85%, 29.2%) - must match `primary.600` in tailwind.config.ts. */
const PRIMARY_GREEN = { h: 142.43, s: 0.7185, l: 0.292 };

const S_RATIO = PRIMARY_GREEN.s / SOURCE_RED.s;
const L_RATIO = PRIMARY_GREEN.l / SOURCE_RED.l;

/** Red-family wedge, wrapping through 0deg. */
const HUE_MIN = 330;
const HUE_MAX = 30;
/** Below this a pixel is neutral (wordmark anti-aliasing), not brand red. */
const SAT_FLOOR = 0.12;
/** Full recolour at/below 0.6 lightness, none at/above 0.85. */
const RAMP_LO = 0.6;
const RAMP_HI = 0.85;

function ramp(l) {
  if (l <= RAMP_LO) return 1;
  if (l >= RAMP_HI) return 0;
  return (RAMP_HI - l) / (RAMP_HI - RAMP_LO);
}

function hslToRgb(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = h / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r;
  let g;
  let b;
  if (hp < 1) [r, g, b] = [c, x, 0];
  else if (hp < 2) [r, g, b] = [x, c, 0];
  else if (hp < 3) [r, g, b] = [0, c, x];
  else if (hp < 4) [r, g, b] = [0, x, c];
  else if (hp < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const m = l - c / 2;
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}

/**
 * Recolours a raw RGB(A) pixel buffer in place and returns how many pixels it
 * changed. `channels` is 3 for the brand-asset script's plain RGB load.
 */
export function recolourRaw(data, channels = 3) {
  let changed = 0;
  for (let i = 0; i + 2 < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;
    if (d === 0) continue;

    let h;
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
    if (h > HUE_MAX && h < HUE_MIN) continue;

    const l = (max + min) / 510;
    const s = d / (255 * (1 - Math.abs(2 * l - 1)));
    if (!(s >= SAT_FLOOR)) continue;

    const w = ramp(l);
    const [nr, ng, nb] = hslToRgb(
      PRIMARY_GREEN.h,
      s * (1 - w * (1 - S_RATIO)),
      l * (1 - w * (1 - L_RATIO))
    );
    data[i] = Math.max(0, Math.min(255, Math.round(nr)));
    data[i + 1] = Math.max(0, Math.min(255, Math.round(ng)));
    data[i + 2] = Math.max(0, Math.min(255, Math.round(nb)));
    changed++;
  }
  return changed;
}

/**
 * Reads a logo file and returns it as a PNG buffer with the red already mapped
 * to primary green. Suitable for feeding straight into any `sharp()` call in
 * place of the file path.
 */
export async function recolourBrandSource(filePath) {
  const { data, info } = await sharp(filePath)
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const changed = recolourRaw(data, info.channels);

  return sharp(data, {
    raw: { width: info.width, height: info.height, channels: info.channels },
  })
    .png()
    .toBuffer()
    .then((buf) => {
      if (changed === 0) {
        throw new Error(`${filePath}: no brand-red pixels found - recolour would silently do nothing`);
      }
      return buf;
    });
}
