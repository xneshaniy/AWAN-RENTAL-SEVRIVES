import assert from 'node:assert/strict';
import { createHmac, createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, describe, test } from 'node:test';
import {
  buildCheckoutUrl,
  fromPaisa,
  getSafepayConfig,
  toPaisa,
  verifyWebhookSignature,
} from '@/lib/safepay';
import {
  computeDepositPaisa,
  DEPOSIT_DEFAULTS,
  describeDeposit,
  signDepositToken,
  verifyDepositToken,
} from '@/lib/deposit';

/**
 * Tests for the SafePay integration.
 *
 * The webhook signature check is the only thing standing between the public
 * internet and the payments table, so it gets the most attention here: an
 * attacker who can forge a `payment.succeeded` event can set an arbitrary
 * booking to PAID. Everything else (deposit maths, the authorisation token,
 * configuration parsing) exists so a misconfiguration fails closed rather than
 * quietly taking the wrong amount of money.
 */

const SECRET = 'whsec_test_secret_value_for_unit_tests_only';
const BODY = JSON.stringify({
  token: 'evt_123',
  version: '2.0.0',
  type: 'payment.succeeded',
  data: { tracker: 'track_abc', amount: 20000, currency: 'PKR', metadata: { order_id: 'ARS-ABC123' } },
});

function sign512(payload: string, secret = SECRET): string {
  return createHmac('sha512', secret).update(payload, 'utf8').digest('hex');
}

/* -------------------------------------------------------------------------- */

describe('SafePay webhook signature verification', () => {
  test('accepts a valid HMAC-SHA512 over the raw body', () => {
    assert.equal(verifyWebhookSignature(BODY, sign512(BODY), [SECRET]), true);
  });

  test('accepts the canonical re-serialisation SafePay documents', () => {
    // Their docs sign Buffer.from(JSON.stringify(payload)) - a re-parse of the
    // raw bytes. Pretty-printed bytes must still verify against that digest.
    const pretty = JSON.stringify(JSON.parse(BODY), null, 2);
    assert.notEqual(pretty, BODY, 'the two serialisations must actually differ');
    assert.equal(verifyWebhookSignature(pretty, sign512(BODY), [SECRET]), true);
  });

  test('rejects a signature made with the wrong secret', () => {
    assert.equal(verifyWebhookSignature(BODY, sign512(BODY, 'not-the-real-secret'), [SECRET]), false);
  });

  test('rejects a payload tampered with after signing', () => {
    const signature = sign512(BODY);
    const tampered = BODY.replace('"amount":20000', '"amount":1');
    assert.notEqual(tampered, BODY);
    assert.equal(verifyWebhookSignature(tampered, signature, [SECRET]), false);
  });

  test('rejects SHA256 - the algorithm must not be attacker-selectable', () => {
    // SafePay signs with sha512 (128 hex chars). A 64-char sha256 digest of the
    // correct body must never be accepted.
    const sha256 = createHash('sha256').update(BODY, 'utf8').digest('hex');
    assert.equal(sha256.length, 64);
    assert.equal(verifyWebhookSignature(BODY, sha256, [SECRET]), false);
  });

  test('rejects a missing, empty or malformed header', () => {
    const signature = sign512(BODY);
    assert.equal(verifyWebhookSignature(BODY, null, [SECRET]), false);
    assert.equal(verifyWebhookSignature(BODY, undefined, [SECRET]), false);
    assert.equal(verifyWebhookSignature(BODY, '', [SECRET]), false);
    assert.equal(verifyWebhookSignature(BODY, '   ', [SECRET]), false);
    assert.equal(verifyWebhookSignature(BODY, 'x'.repeat(128), [SECRET]), false);
    assert.equal(verifyWebhookSignature('', signature, [SECRET]), false);
  });

  test('rejects everything when no webhook secret is configured', () => {
    assert.equal(verifyWebhookSignature(BODY, sign512(BODY), []), false);
  });

  test('accepts any of several secrets, so a rotation does not drop events', () => {
    // SafePay warns that queued events keep arriving signed with the previous
    // key after a rotation. Both keys must verify, and nothing else may.
    const previous = 'whsec_previous_key';
    const secrets = [SECRET, previous];

    assert.equal(verifyWebhookSignature(BODY, sign512(BODY), secrets), true);
    assert.equal(verifyWebhookSignature(BODY, sign512(BODY, previous), secrets), true);
    assert.equal(verifyWebhookSignature(BODY, sign512(BODY, 'some-other-key'), secrets), false);
  });

  test('accepts a comma-separated signature list when one of them matches', () => {
    const good = sign512(BODY);
    const junk = 'a'.repeat(128);

    assert.equal(verifyWebhookSignature(BODY, `${junk}, ${good}`, [SECRET]), true);
    assert.equal(verifyWebhookSignature(BODY, `${junk}, ${'b'.repeat(128)}`, [SECRET]), false);
  });

  test('does not leak the secret through its return value', () => {
    assert.equal(verifyWebhookSignature(BODY, 'nope', [SECRET]), false);
    assert.equal(verifyWebhookSignature(BODY, 'nope', [SECRET]), false);
  });
});

/* -------------------------------------------------------------------------- */

describe('SafePay configuration', () => {
  const saved = process.env;

  afterEach(() => {
    process.env = saved;
  });

  function withEnv(vars: Record<string, string | undefined>): void {
    process.env = { ...saved };
    for (const [key, value] of Object.entries(vars)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }

  test('is absent until every credential is present', () => {
    withEnv({
      SAFEPAY_API_KEY: 'sec_public',
      SAFEPAY_API_SECRET: '',
      SAFEPAY_WEBHOOK_SECRET: 'hook',
    });
    assert.equal(getSafepayConfig(), null, 'a missing API secret must fail closed');

    withEnv({
      SAFEPAY_API_KEY: 'sec_public',
      SAFEPAY_API_SECRET: 'secret',
      SAFEPAY_WEBHOOK_SECRET: '',
    });
    assert.equal(getSafepayConfig(), null, 'a missing webhook secret must fail closed - payments stay off');
  });

  test('splits a comma-separated webhook secret list for key rotation', () => {
    withEnv({
      SAFEPAY_API_KEY: 'sec_public',
      SAFEPAY_API_SECRET: 'secret',
      SAFEPAY_WEBHOOK_SECRET: ' key-one , key-two ',
    });
    const config = getSafepayConfig();
    assert.ok(config);
    assert.deepEqual(config.webhookSecrets, ['key-one', 'key-two']);
  });

  test('only leaves the sandbox when SAFEPAY_ENV is explicitly production', () => {
    const base = {
      SAFEPAY_API_KEY: 'sec_public',
      SAFEPAY_API_SECRET: 'secret',
      SAFEPAY_WEBHOOK_SECRET: 'hook',
    };

    for (const [value, expected] of [
      [undefined, 'sandbox'],
      ['', 'sandbox'],
      ['sandbox', 'sandbox'],
      ['development', 'development'],
      ['production', 'production'],
      ['PRODUCTION', 'production'],
      ['live', 'sandbox'], // unknown values must not go live
    ] as const) {
      withEnv({ ...base, SAFEPAY_ENV: value });
      assert.equal(getSafepayConfig()?.environment, expected, `SAFEPAY_ENV=${String(value)}`);
    }
  });
});

/* -------------------------------------------------------------------------- */

describe('SafePay amounts and checkout URL', () => {
  test('converts between rupees and paisa without drifting', () => {
    assert.equal(toPaisa(12.5), 1250);
    assert.equal(fromPaisa(1250), 12.5);
    assert.equal(toPaisa(0.1 + 0.2), 30, 'floating point must not leak into a money amount');
    assert.equal(toPaisa(1999.99), 199999);
  });

  test('builds the hosted checkout URL on the right host with encoded params', () => {
    const url = buildCheckoutUrl('sandbox', 'track_1', 'tbt value', {
      redirectUrl: 'https://example.com/booking/success/ARS-1?a=1',
      cancelUrl: 'https://example.com/booking/success/ARS-1?deposit=cancelled',
      orderId: 'ARS-ABC123',
    });

    const parsed = new URL(url);
    assert.equal(parsed.origin + parsed.pathname, 'https://sandbox.api.getsafepay.com/embedded/');
    assert.equal(parsed.searchParams.get('environment'), 'sandbox');
    assert.equal(parsed.searchParams.get('tracker'), 'track_1');
    assert.equal(parsed.searchParams.get('tbt'), 'tbt value');
    assert.equal(parsed.searchParams.get('source'), 'hosted');
    assert.equal(parsed.searchParams.get('order_id'), 'ARS-ABC123');
    // Round-tripping through URL decoding is what the hosted page will do.
    assert.equal(parsed.searchParams.get('redirect_url'), 'https://example.com/booking/success/ARS-1?a=1');
    assert.equal(parsed.searchParams.get('cancel_url'), 'https://example.com/booking/success/ARS-1?deposit=cancelled');
  });

  test('the live checkout host is never the sandbox host', () => {
    const url = buildCheckoutUrl('production', 'track_1', 'tbt', {
      redirectUrl: 'https://x.test/ok',
      cancelUrl: 'https://x.test/cancel',
      orderId: 'ARS-1',
    });
    assert.ok(!url.includes('sandbox'), 'a production checkout must not point at the sandbox');
    assert.ok(url.startsWith('https://getsafepay.com/embedded/'));
  });
});

/* -------------------------------------------------------------------------- */

describe('deposit calculation', () => {
  test('the default rule is 20% of the booking total', () => {
    assert.deepEqual(DEPOSIT_DEFAULTS, { enabled: true, type: 'PERCENTAGE', value: 20 });
    assert.equal(computeDepositPaisa(50_000, DEPOSIT_DEFAULTS), 10_000_00, '20% of 50000 is 10000 rupees');
    assert.equal(describeDeposit(DEPOSIT_DEFAULTS), '20% of the total');
  });

  test('supports a fixed amount', () => {
    const config = { enabled: true, type: 'FIXED_AMOUNT' as const, value: 7500 };
    assert.equal(computeDepositPaisa(50_000, config), 750_000, 'PKR 7500 in paisa');
    assert.equal(describeDeposit(config), 'PKR 7,500 of the total');
  });

  test('returns null when deposits are switched off', () => {
    assert.equal(computeDepositPaisa(50_000, { ...DEPOSIT_DEFAULTS, enabled: false }), null);
  });

  test('returns null rather than a deposit nobody should pay', () => {
    // Zero, negative and non-finite totals.
    assert.equal(computeDepositPaisa(0, DEPOSIT_DEFAULTS), null);
    assert.equal(computeDepositPaisa(-100, DEPOSIT_DEFAULTS), null);
    assert.equal(computeDepositPaisa(Number.NaN, DEPOSIT_DEFAULTS), null);
    // A deposit that rounds away to nothing at all.
    assert.equal(computeDepositPaisa(1, { enabled: true, type: 'PERCENTAGE', value: 0.1 }), null);
    // A deposit at or above the total would be full payment, which this
    // integration deliberately does not do.
    assert.equal(computeDepositPaisa(1000, { enabled: true, type: 'PERCENTAGE', value: 100 }), null);
    assert.equal(computeDepositPaisa(500, { enabled: true, type: 'FIXED_AMOUNT', value: 500 }), null);
    assert.equal(computeDepositPaisa(500, { enabled: true, type: 'FIXED_AMOUNT', value: 900 }), null);
  });

  test('clamps an out-of-range percentage instead of overcharging', () => {
    const over = computeDepositPaisa(10_000, { enabled: true, type: 'PERCENTAGE', value: 500 });
    assert.equal(over, null, '100% is the ceiling, so the result must not exceed the total');
    const under = computeDepositPaisa(10_000, { enabled: true, type: 'PERCENTAGE', value: -5 });
    assert.equal(under, null, 'a negative percentage must not credit the customer');
  });

  test('rounds money to whole paisa', () => {
    // 33.333% of 9999 = 3332.96667... rupees -> 3332.97 -> 333297 paisa.
    assert.equal(
      computeDepositPaisa(9999, { enabled: true, type: 'PERCENTAGE', value: 33.333 }),
      333_297
    );
    // A whole-rupee result must carry across as exactly 100 paisa each.
    assert.equal(computeDepositPaisa(1000, { enabled: true, type: 'PERCENTAGE', value: 10 }), 10_000);
  });
});

/* -------------------------------------------------------------------------- */

describe('deposit authorisation token', () => {
  const saved = process.env;
  const now = 1_700_000_000_000;

  afterEach(() => {
    process.env = saved;
  });

  function withSecret(secret: string | undefined): void {
    process.env = { ...saved };
    if (secret === undefined) delete process.env.NEXTAUTH_SECRET;
    else process.env.NEXTAUTH_SECRET = secret;
  }

  test('round-trips for the booking it was minted for', () => {
    withSecret('a-sufficiently-long-signing-secret');
    const token = signDepositToken('booking-1', now);
    assert.ok(token);
    assert.equal(verifyDepositToken(token, 'booking-1', now), true);
    // Still valid for the rest of its lifetime.
    assert.equal(verifyDepositToken(token, 'booking-1', now + 5 * 60 * 60 * 1000), true);
  });

  test('rejects a token presented against a different booking', () => {
    withSecret('a-sufficiently-long-signing-secret');
    const token = signDepositToken('booking-1', now);
    assert.ok(token);
    assert.equal(verifyDepositToken(token, 'booking-2', now), false, 'a token must be bound to one booking');
  });

  test('rejects an expired token', () => {
    withSecret('a-sufficiently-long-signing-secret');
    const token = signDepositToken('booking-1', now);
    assert.ok(token);
    assert.equal(verifyDepositToken(token, 'booking-1', now + 7 * 60 * 60 * 1000), false);
  });

  test('rejects a tampered payload or signature', () => {
    withSecret('a-sufficiently-long-signing-secret');
    const token = signDepositToken('booking-1', now);
    assert.ok(token);

    const parts = token.split('.');
    const forgedExpiry = String(Number(parts[2]) + 100_000);
    const forged = `${parts[0]}.${parts[1]}.${forgedExpiry}.${parts[3]}`;
    assert.equal(verifyDepositToken(forged, 'booking-1', now), false, 'extending the expiry must not work');

    const resigned = `${parts[0]}.${parts[1]}.${parts[2]}.${'0'.repeat(parts[3].length)}`;
    assert.equal(verifyDepositToken(resigned, 'booking-1', now), false);

    assert.equal(verifyDepositToken(`${token}x`, 'booking-1', now), false);
    assert.equal(verifyDepositToken('v1.booking-1.99999999999.abc.def', 'booking-1', now), false);
  });

  test('fails closed when no signing secret is configured', () => {
    withSecret(undefined);
    assert.equal(signDepositToken('booking-1', now), null);
    assert.equal(verifyDepositToken('anything', 'booking-1', now), false);

    withSecret('short');
    assert.equal(signDepositToken('booking-1', now), null, 'a trivially guessable secret must not sign');
    assert.equal(verifyDepositToken('anything', 'booking-1', now), false);
  });

  test('rejects empty or absent tokens', () => {
    withSecret('a-sufficiently-long-signing-secret');
    assert.equal(verifyDepositToken(null, 'booking-1', now), false);
    assert.equal(verifyDepositToken(undefined, 'booking-1', now), false);
    assert.equal(verifyDepositToken('', 'booking-1', now), false);
    assert.equal(verifyDepositToken(signDepositToken('booking-1', now), '', now), false);
  });
});

/* -------------------------------------------------------------------------- */

/**
 * The webhook handler's ordering cannot be exercised without SafePay, so the
 * parts that must never regress are asserted against the source itself - the
 * same technique the robots.txt tests use.
 */
describe('webhook route source invariants', () => {
  const routeFile = path.join(
    process.cwd(),
    'src',
    'app',
    'api',
    'payments',
    'safepay',
    'webhook',
    'route.ts'
  );
  const source = readFileSync(routeFile, 'utf8');

  test('reads the raw body rather than a parsed one', () => {
    // The signature covers the bytes that arrived. Going through request.json()
    // would make verification depend on our own re-serialisation matching
    // SafePay's, which is exactly the fragility the raw read avoids.
    assert.match(source, /await request\.text\(\)/, 'must read the raw body');
    assert.doesNotMatch(source, /request\.json\(\)/, 'parsing first would lose the signed bytes');
  });

  test('verifies the signature before anything is written to the database', () => {
    const verifyAt = source.indexOf('verifyWebhookSignature(');
    const writeAt = source.indexOf('paymentEvent.create');

    assert.ok(verifyAt > 0, 'the signature must be checked');
    assert.ok(writeAt > 0, 'the event must still be recorded');
    assert.ok(
      verifyAt < writeAt,
      'an unauthenticated caller must never cause a row to be written - verify before any create()'
    );
  });

  test('does not acknowledge a webhook it failed to verify', () => {
    const verifyAt = source.indexOf('verifyWebhookSignature(');
    const tail = source.slice(verifyAt);
    assert.match(tail, /status: 401/, 'an invalid signature must not be acknowledged with 200');
  });

  test('never prints a credential', () => {
    // Log wording may mention that signature verification failed; what must
    // never happen is interpolating the value itself or the config object.
    assert.doesNotMatch(source, /\$\{signature\}/, 'the received signature must not be interpolated into a log');
    assert.doesNotMatch(source, /\$\{[^}]*\bapiSecret\b[^}]*\}/, 'the API secret must never be logged');
    assert.doesNotMatch(source, /\$\{[^}]*\bwebhookSecrets?\b[^}]*\}/, 'the webhook secret must never be logged');
    assert.doesNotMatch(
      source,
      /console\.(log|warn|error|info)\([^)]*\bconfig\b/,
      'the config object holds every credential - never log it'
    );
    assert.doesNotMatch(source, /console\.(log|warn|error|info)\([^)]*rawBody/);
  });
});

describe('what a signed event is allowed to change', () => {
  const settleFile = path.join(process.cwd(), 'src', 'lib', 'safepay-settlement.ts');
  const settleSource = readFileSync(settleFile, 'utf8');

  test('settlement never invents a payment row from the event payload', () => {
    // The row written before the shopper leaves for SafePay is the proof that
    // we asked SafePay to collect this money. If settlement may create one out
    // of the payload, an event naming any tracker plus a plausible order id
    // credits a booking we never charged for - and a second event carrying a
    // different tracker credits that booking again, which is exactly what the
    // unique tracker exists to prevent. An event we cannot tie to a checkout we
    // started is recorded as UNMATCHED and left for a human instead.
    assert.doesNotMatch(
      settleSource,
      /payment\.create\(/,
      'a settlement may only update a row checkout created - never invent one'
    );
  });

  test('an event for a tracker we never issued is reported UNMATCHED', async () => {
    const { settleSafePayDeposit } = await import('@/lib/safepay-settlement');
    const { prisma } = await import('@/lib/prisma');

    const before = await prisma.payment.count();
    const result = await settleSafePayDeposit({
      tracker: 'track_never_issued_by_this_merchant',
      // Well formed, and real in this database - and still not enough on its
      // own. The tracker is what says whether we ever asked for this money, so
      // this assertion has to hold whichever booking the order id names.
      orderId: 'ARS-VZGCO6',
      amountPaisa: 497200,
      currency: 'PKR',
    });
    const after = await prisma.payment.count();

    assert.equal(result.outcome, 'UNMATCHED');
    assert.equal(after, before, 'a settlement must never create a payment row');
  });
});
