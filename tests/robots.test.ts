import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { readdirSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import type { MetadataRoute } from 'next';
import robots from '@/app/robots';
import { SITE_URL } from '@/config/site';

/**
 * Unit tests for `/robots.txt` (`src/app/robots.ts`).
 *
 * These exist because of one specific, easy-to-introduce bug: a crawler uses
 * only the most specific user-agent group that names it, never the union of
 * every matching group. So a named AI group that repeats `allow: '/'` but
 * forgets `disallow` would quietly out-permission the `*` group and expose
 * /admin/ and /api/ to that crawler. The tests pin both halves of that.
 */

type Rule = {
  userAgent?: string | string[];
  allow?: string | string[];
  disallow?: string | string[];
};

function allRules(): Rule[] {
  const rules: MetadataRoute.Robots['rules'] = robots().rules;
  return Array.isArray(rules) ? rules : [rules];
}

function agents(rule: Rule): string[] {
  return rule.userAgent === undefined ? [] : ([] as string[]).concat(rule.userAgent);
}

function paths(value: string | string[] | undefined): string[] {
  return value === undefined ? [] : ([] as string[]).concat(value);
}

describe('robots.txt policy', () => {
  test('publishes the sitemap and host from SITE_URL', () => {
    const result = robots();
    assert.equal(result.sitemap, `${SITE_URL}/sitemap.xml`);
    assert.equal(result.host, SITE_URL);
  });

  test('serves a catch-all group that allows the public site', () => {
    const wildcard = allRules().find((rule) => agents(rule).includes('*'));
    assert.ok(wildcard, 'a `User-agent: *` group is required');
    assert.ok(paths(wildcard.allow).includes('/'), 'the public site must be allowed');
    assert.ok(!paths(wildcard.disallow).includes('/'), 'a blanket `Disallow: /` would hide the whole site');
  });

  test('blocks admin and API paths from every group, not just the wildcard', () => {
    for (const rule of allRules()) {
      const disallow = paths(rule.disallow);
      const label = agents(rule).join(', ') || '(unnamed rule)';

      assert.ok(disallow.includes('/admin/'), `${label} must block /admin/`);
      assert.ok(disallow.includes('/api/'), `${label} must block /api/`);
      assert.ok(!disallow.includes('/vehicles'), `${label} must not block the public vehicle pages`);
    }
  });

  test('every named AI group repeats the full block list', () => {
    const rules = allRules();
    const wildcard = rules.find((rule) => agents(rule).includes('*'));
    assert.ok(wildcard);

    const expected = paths(wildcard.disallow);

    for (const rule of rules) {
      if (rule === wildcard) continue;

      assert.deepEqual(
        paths(rule.disallow),
        expected,
        `${agents(rule).join(', ')} must inherit the exact block list - robots.txt does not merge groups`,
      );
      assert.deepEqual(
        paths(rule.allow),
        paths(wildcard.allow),
        `${agents(rule).join(', ')} must be allowed exactly as far as the wildcard`,
      );
    }
  });

  test('names the major answer engines explicitly', () => {
    const declared = new Set(allRules().flatMap(agents));

    for (const bot of [
      'GPTBot',
      'OAI-SearchBot',
      'ChatGPT-User',
      'ClaudeBot',
      'PerplexityBot',
      'Google-Extended',
      'CCBot',
    ]) {
      assert.ok(declared.has(bot), `${bot} must be named so the invitation is auditable, not implied by a wildcard`);
    }
  });

  test('keeps the AI crawler list de-duplicated', () => {
    const declared = allRules().flatMap(agents);
    assert.equal(
      new Set(declared).size,
      declared.length,
      `duplicate user-agent entries: ${declared.filter((a, i) => declared.indexOf(a) !== i).join(', ')}`,
    );
  });
});

/**
 * The IndexNow helper runs straight through Node (`npm run indexnow`), with no
 * tsx loader, so TypeScript syntax in it is a parse error at run time rather
 * than a compile error - which is exactly how it shipped once. These guard the
 * parts a test can check offline.
 */
describe('IndexNow submission tooling', () => {
  const script = path.join(process.cwd(), 'scripts', 'submit-indexnow.mjs');

  test('the script is JavaScript Node can actually parse', () => {
    const result = spawnSync(process.execPath, ['--check', script], { encoding: 'utf8' });
    assert.equal(
      result.status,
      0,
      `node --check rejected scripts/submit-indexnow.mjs (a .mjs file run without tsx must be plain JS):\n${result.stderr}`,
    );
  });

  test('package.json exposes both entry points', () => {
    const pkg = JSON.parse(readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
    assert.equal(pkg.scripts?.indexnow, 'node scripts/submit-indexnow.mjs');
    assert.equal(pkg.scripts?.['test:robots'], 'node --env-file-if-exists=.env --import tsx tests/robots.test.ts');
  });

  test('the published key file matches the URL it is served under', () => {
    const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.txt$/i;
    const keys = readdirSync(path.join(process.cwd(), 'public')).filter((file) => uuid.test(file));

    assert.equal(keys.length, 1, `expected exactly one IndexNow key file in public/, found ${keys.length}`);

    const expected = keys[0].replace(/\.txt$/i, '');
    const actual = readFileSync(path.join(process.cwd(), 'public', keys[0]), 'utf8').trim();

    // IndexNow verifies ownership by comparing the file body with the filename,
    // so a mismatch here means every submission would be rejected with 403.
    assert.equal(actual.toLowerCase(), expected.toLowerCase(), 'key file body must equal its filename minus .txt');
  });

  test('the script only sends public data to the public endpoint', () => {
    const source = readFileSync(script, 'utf8');
    assert.match(source, /https:\/\/api\.indexnow\.org\/indexnow/, 'must target the public IndexNow endpoint');
    assert.doesNotMatch(source, /process\.env/, 'must not read credentials - the key is published on purpose');
    assert.doesNotMatch(source, /DATABASE_URL|API_TOKEN|SMTP_PASSWORD/, 'must not touch any secret');
  });
});
