/**
 * Counts how the site actually uses colour, so a palette change can be
 * scoped honestly instead of guessed at.
 *   node scripts/colour-usage.mjs
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve('src');

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(tsx?|css)$/.test(entry)) out.push(full);
  }
  return out;
}

const files = walk(ROOT);

const SHADES = '50|100|200|300|400|500|600|700|800|900|950';
const FAMILIES = ['primary', 'secondary', 'accent', 'green', 'amber', 'red', 'orange', 'yellow'];
const BACKGROUNDS = [
  'bg-background', 'bg-white', 'bg-gray', 'bg-slate', 'bg-neutral',
  'bg-zinc', 'bg-stone', 'bg-cream', 'bg-primary', 'bg-secondary', 'bg-accent',
];
const TEXTS = [
  'text-gray', 'text-slate', 'text-neutral', 'text-zinc',
  'text-foreground', 'text-primary', 'text-secondary', 'text-white', 'text-black',
];

const counts = Object.create(null);
const hexes = Object.create(null);
const bump = (key) => {
  counts[key] = (counts[key] || 0) + 1;
};

/** Every non-overlapping match of `re` in `text`, appended through `bump`. */
function countMatches(text, re) {
  let match;
  while ((match = re.exec(text)) !== null) {
    bump(match[0]);
  }
}

for (const file of files) {
  const text = readFileSync(file, 'utf8');

  for (const family of FAMILIES) {
    countMatches(text, new RegExp(`\\b${family}-(?:${SHADES})\\b`, 'g'));
  }
  for (const prefix of BACKGROUNDS) {
    countMatches(text, new RegExp(`\\b${prefix}[\\w-]*`, 'g'));
  }
  for (const prefix of TEXTS) {
    countMatches(text, new RegExp(`\\b${prefix}[\\w-]*`, 'g'));
  }
  for (const hex of text.match(/#[0-9a-fA-F]{6}\b/g) || []) {
    const key = hex.toLowerCase();
    hexes[key] = (hexes[key] || 0) + 1;
  }
}

const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
console.log(`files scanned: ${files.length}`);
console.log('\n-- class usage (top 45) --');
for (const [key, value] of sorted.slice(0, 45)) {
  console.log(`  ${String(value).padStart(4)}  ${key}`);
}

console.log('\n-- hardcoded hex in src (top 25) --');
const hexSorted = Object.entries(hexes).sort((a, b) => b[1] - a[1]);
for (const [key, value] of hexSorted.slice(0, 25)) {
  console.log(`  ${String(value).padStart(4)}  ${key}`);
}

const totals = Object.create(null);
for (const [key, value] of sorted) {
  const family = key.split('-')[0];
  totals[family] = (totals[family] || 0) + value;
}
console.log('\n-- totals by family --');
for (const [key, value] of Object.entries(totals).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(value).padStart(4)}  ${key}`);
}
