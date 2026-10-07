/**
 * Pushes every URL in the live sitemap to IndexNow.
 *
 * IndexNow is free and needs no account. Publishing a key file at
 * `/<key>.txt` proves ownership of the domain, and each POST asks Bing,
 * Yandex, Ecosia, Seznam and Naver to (re-)crawl the listed URLs - the search
 * indexes several of the AI assistants draw their answers from. This is the
 * fastest code-side route from "the site changed" to "an engine can cite it".
 *
 * Nothing sent here is secret: the key is published on purpose and the payload
 * is public sitemap URLs only. No credentials, no paid service, no accounts.
 *
 * Usage:
 *   npm run indexnow                 # submit the production sitemap
 *   npm run indexnow -- --dry-run    # list the URLs without submitting
 *   npm run indexnow -- https://staging.example.com
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const DEFAULT_BASE_URL = 'https://awanrentalservice.org';
const ENDPOINT = 'https://api.indexnow.org/indexnow';
const PUBLIC_DIR = 'public';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const baseUrl = (args.find((arg) => !arg.startsWith('--')) ?? DEFAULT_BASE_URL).replace(/\/+$/, '');

/**
 * The key file is the single source of truth: its filename minus `.txt` is
 * the key, and its contents must match. Deriving it here means the key can
 * never drift between the file IndexNow fetches and the file we sign with.
 */
function findKey(): { key: string; keyFile: string } {
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.txt$/i;
  const keyFile = readdirSync(PUBLIC_DIR).find((file) => uuid.test(file));

  if (!keyFile) {
    throw new Error(`No IndexNow key file (a <uuid>.txt) found in ${PUBLIC_DIR}/ - cannot sign a submission.`);
  }

  const key = keyFile.replace(/\.txt$/i, '');
  const contents = readFileSync(join(PUBLIC_DIR, keyFile), 'utf8').trim();

  if (contents.toLowerCase() !== key.toLowerCase()) {
    throw new Error(`${keyFile}: contents must equal the filename minus ".txt", found "${contents}".`);
  }

  return { key, keyFile };
}

/** Pulls every `<loc>` out of a sitemap, following a sitemap index if that is what we got. */
async function collectUrls(): Promise<string[]> {
  const sitemapUrl = `${baseUrl}/sitemap.xml`;
  const res = await fetch(sitemapUrl);

  if (!res.ok) {
    throw new Error(`GET ${sitemapUrl} -> HTTP ${res.status}. Is the site reachable?`);
  }

  const xml = await res.text();
  const locs = (pattern: RegExp) => [...xml.matchAll(pattern)].map((match) => match[1].trim());

  if (/<sitemapindex[\s>]/i.test(xml)) {
    const children = locs(/<loc>([^<]+)<\/loc>/g);
    const nested: string[][] = [];

    for (const child of children) {
      const childRes = await fetch(child);
      if (!childRes.ok) throw new Error(`GET ${child} -> HTTP ${childRes.status}`);
      nested.push([...(await childRes.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim()));
    }

    return nested.flat();
  }

  return locs(/<loc>([^<]+)<\/loc>/g);
}

async function main(): Promise<void> {
  const { key, keyFile } = findKey();
  const urls = await collectUrls();

  if (urls.length === 0) {
    throw new Error(`${baseUrl}/sitemap.xml contained no <loc> entries - nothing to submit.`);
  }

  const host = new URL(baseUrl).host;
  const payload = {
    host,
    key,
    keyLocation: `${baseUrl}/${keyFile}`,
    urlList: urls,
  };

  if (dryRun) {
    console.log(`IndexNow dry run for ${host} (${keyFile}) - ${urls.length} URL(s), no request sent:`);
    urls.forEach((url) => console.log(`  ${url}`));
    return;
  }

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload),
  });

  // 200 = accepted, 202 = accepted but awaiting key-file validation.
  const ok = res.status === 200 || res.status === 202;
  const detail = (await res.text()).slice(0, 300);

  console.log(`IndexNow ${host}: submitted ${urls.length} URL(s) -> HTTP ${res.status}`);
  if (detail) console.log(detail);

  if (!ok) {
    console.error(
      `Submission rejected. Check that ${payload.keyLocation} is publicly reachable and returns text/plain.`,
    );
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  console.error(`IndexNow failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
