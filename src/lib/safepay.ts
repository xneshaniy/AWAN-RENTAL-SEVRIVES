/**
 * Minimal SafePay (getsafepay.com) client for the hosted Express Checkout flow.
 *
 * Deliberately dependency-free: everything here is a thin, typed wrapper over
 * three documented endpoints plus URL construction, using Node's built-in
 * `fetch`. The official `@sfpy/node-core` SDK is not used because it imports
 * `axios` at module scope while listing it only as a devDependency (a runtime
 * landmine) and exposes `params?: any` everywhere, while still requiring us to
 * write webhook verification ourselves.
 *
 * Endpoints (confirmed against the SDK source and the Express Checkout guide):
 *   POST  {host}/order/payments/v3/          create a payment tracker
 *   POST  {host}/client/passport/v1/token    short-lived auth token for checkout
 *   GET   {host}/reporter/api/v1/payments/{tracker}   read tracker state
 *
 * Card data never reaches this server - the shopper types it on SafePay's own
 * hosted pages, so the integration stays in PCI SAQ A scope.
 *
 * Never log `apiSecret` or `webhookSecrets`.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';

export type SafepayEnvironment = 'development' | 'sandbox' | 'production';

/** Currency PKR uses: 1 PKR = 100 paisa. SafePay takes the lowest denomination. */
export const SAFEPAY_CURRENCY = 'PKR';

/** Tracker state that means "money captured". Per SafePay's Express Checkout guide. */
export const TRACKER_COMPLETED = 'TRACKER_ENDED';

const API_HOSTS: Record<SafepayEnvironment, string> = {
  development: 'https://dev.api.getsafepay.com',
  sandbox: 'https://sandbox.api.getsafepay.com',
  // Live payments.
  production: 'https://api.getsafepay.com',
};

/** Hosted Checkout page bases - matches `createCheckoutUrl` in the official SDK. */
const CHECKOUT_BASES: Record<SafepayEnvironment, string> = {
  development: 'https://dev.api.getsafepay.com/embedded/',
  sandbox: 'https://sandbox.api.getsafepay.com/embedded/',
  production: 'https://getsafepay.com/embedded/',
};

export interface SafepayConfig {
  /** Public account identifier (`sec_...`). Sent in the session body. */
  apiKey: string;
  /** Private key authenticating server-side calls (header `X-SFPY-MERCHANT-SECRET`). */
  apiSecret: string;
  /**
   * One or more webhook shared secrets. Multiple entries are supported so a key
   * rotation can be rolled without dropping queued events, which SafePay
   * explicitly warns are signed with the previous key.
   */
  webhookSecrets: string[];
  environment: SafepayEnvironment;
}

/** Thrown for transport/API failures. Never carries credentials in its message. */
export class SafepayError extends Error {
  readonly status: number;

  constructor(message: string, status = 0) {
    super(message);
    this.name = 'SafepayError';
    this.status = status;
  }
}

function readEnvironment(): SafepayEnvironment {
  const raw = (process.env.SAFEPAY_ENV ?? '').trim().toLowerCase();
  return raw === 'production' || raw === 'development' ? raw : 'sandbox';
}

/**
 * Returns the configured client, or null when any required credential is
 * missing. Missing configuration is an expected state (payments simply stay
 * off), never an exception.
 */
export function getSafepayConfig(): SafepayConfig | null {
  const apiKey = (process.env.SAFEPAY_API_KEY ?? '').trim();
  const apiSecret = (process.env.SAFEPAY_API_SECRET ?? '').trim();
  const webhookSecret = (process.env.SAFEPAY_WEBHOOK_SECRET ?? '').trim();

  if (!apiKey || !apiSecret || !webhookSecret) return null;

  const webhookSecrets = webhookSecret
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (webhookSecrets.length === 0) return null;

  return { apiKey, apiSecret, webhookSecrets, environment: readEnvironment() };
}

export function isSafepayConfigured(): boolean {
  return getSafepayConfig() !== null;
}

/** SafePay takes amounts in the lowest denomination: PKR 12.50 -> 1250 paisa. */
export function toPaisa(amount: number): number {
  return Math.round(amount * 100);
}

/** Inverse of {@link toPaisa}. Returns whole+fractional rupees. */
export function fromPaisa(paisa: number): number {
  return paisa / 100;
}

/* -------------------------------------------------------------------------- */
/* HTTP                                                                        */
/* -------------------------------------------------------------------------- */

interface ApiResponseShape {
  data?: unknown;
  status?: { errors?: unknown[]; message?: string };
}

/** Pull a SafePay-style error string out of a response without echoing it raw. */
function describeApiFailure(status: number, payload: ApiResponseShape | null): string {
  const errors = payload?.status?.errors;
  if (Array.isArray(errors) && errors.length > 0) {
    const parts = errors.map((entry) => (typeof entry === 'string' ? entry : JSON.stringify(entry)));
    return `SafePay responded ${status}: ${parts.join(', ')}`;
  }
  if (typeof payload?.status?.message === 'string' && payload.status.message) {
    return `SafePay responded ${status}: ${payload.status.message}`;
  }
  return `SafePay responded ${status}`;
}

async function safepayFetch(
  config: SafepayConfig,
  path: string,
  body: unknown,
  method: 'GET' | 'POST' = 'POST'
): Promise<unknown> {
  const host = API_HOSTS[config.environment];
  const url = `${host}${path}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      // The header is what authenticates the call; it is never logged or thrown.
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-SFPY-MERCHANT-SECRET': config.apiSecret,
      },
      body: method === 'POST' ? JSON.stringify(body) : undefined,
      cache: 'no-store',
      signal: AbortSignal.timeout(15_000),
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'unknown error';
    throw new SafepayError(`Could not reach SafePay: ${reason}`);
  }

  let payload: ApiResponseShape | null = null;
  try {
    payload = (await response.json()) as ApiResponseShape;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new SafepayError(describeApiFailure(response.status, payload), response.status);
  }

  return payload?.data ?? null;
}

/* -------------------------------------------------------------------------- */
/* Tracker + hosted checkout                                                   */
/* -------------------------------------------------------------------------- */

export interface TrackerSnapshot {
  token: string;
  /** e.g. TRACKER_STARTED, TRACKER_ENDED, TRACKER_PARTIAL_REFUND. */
  state: string;
  environment?: string;
  /** Amount captured/read, in paisa, when SafePay reports one. */
  amount?: number;
  currency?: string;
}

function pickQuoteAmount(tracker: unknown): { amount?: number; currency?: string } {
  if (!tracker || typeof tracker !== 'object') return {};
  const totals = (tracker as { purchase_totals?: { quote_amount?: { amount?: unknown; currency?: unknown } } })
    .purchase_totals;
  const quote = totals?.quote_amount;
  if (!quote) return {};
  const amount = typeof quote.amount === 'number' ? quote.amount : Number(quote.amount);
  const currency = typeof quote.currency === 'string' ? quote.currency : undefined;
  return Number.isFinite(amount) ? { amount, currency } : { currency };
}

function readToken(value: unknown): string | null {
  if (!value || typeof value !== 'object') return null;
  const token = (value as { token?: unknown }).token;
  return typeof token === 'string' && token.length > 0 ? token : null;
}

/**
 * Creates the hosted-checkout payment session: a tracker plus the Checkout URL
 * the shopper is redirected to. `orderId` is echoed back in webhook
 * `metadata.order_id`, so it carries the booking reference.
 */
export async function createCheckoutSession(input: {
  amountPaisa: number;
  orderId: string;
  redirectUrl: string;
  cancelUrl: string;
  currency?: string;
}): Promise<{ tracker: string; checkoutUrl: string }> {
  const config = getSafepayConfig();
  if (!config) throw new SafepayError('SafePay is not configured');

  const currency = input.currency ?? SAFEPAY_CURRENCY;

  const session = await safepayFetch(config, '/order/payments/v3/', {
    merchant_api_key: config.apiKey,
    intent: 'CYBERSOURCE',
    mode: 'payment',
    entry_mode: 'raw',
    currency,
    amount: input.amountPaisa,
    metadata: { order_id: input.orderId },
    include_fees: false,
  });

  const tracker = readToken((session as { tracker?: unknown } | null)?.tracker);
  if (!tracker) throw new SafepayError('SafePay did not return a tracker token');

  // Short-lived token the hosted page uses to authenticate itself to us.
  const passport = await safepayFetch(config, '/client/passport/v1/token', {});
  const tbt = typeof passport === 'string' && passport.length > 0 ? passport : null;
  if (!tbt) throw new SafepayError('SafePay did not return an authentication token');

  return { tracker, checkoutUrl: buildCheckoutUrl(config.environment, tracker, tbt, input) };
}

/**
 * Builds the hosted Checkout URL. Same shape as the official SDK's
 * `createCheckoutUrl`: `{base}?environment={env}&<encoded params>`.
 */
export function buildCheckoutUrl(
  environment: SafepayEnvironment,
  tracker: string,
  tbt: string,
  input: { redirectUrl: string; cancelUrl: string; orderId: string }
): string {
  const params: Record<string, string> = {
    environment,
    tracker,
    tbt,
    source: 'hosted',
    order_id: input.orderId,
    redirect_url: input.redirectUrl,
    cancel_url: input.cancelUrl,
  };

  const query = Object.entries(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');

  return `${CHECKOUT_BASES[environment]}?${query}`;
}

/**
 * Reads the current state of a tracker from SafePay's reporter API. Used both
 * to show the shopper their result on return and as an independent confirmation
 * path when a webhook is late or never arrives.
 */
export async function fetchTracker(tracker: string): Promise<TrackerSnapshot | null> {
  const config = getSafepayConfig();
  if (!config) return null;

  const data = await safepayFetch(
    config,
    `/reporter/api/v1/payments/${encodeURIComponent(tracker)}`,
    undefined,
    'GET'
  );

  const found = (data as { tracker?: unknown } | null)?.tracker;
  if (!found || typeof found !== 'object') return null;

  const value = found as { token?: unknown; state?: unknown; environment?: unknown };
  const state = typeof value.state === 'string' ? value.state : '';
  if (!state) return null;

  return {
    token: typeof value.token === 'string' ? value.token : tracker,
    state,
    environment: typeof value.environment === 'string' ? value.environment : undefined,
    ...pickQuoteAmount(found),
  };
}

/* -------------------------------------------------------------------------- */
/* Webhook signature verification                                              */
/* -------------------------------------------------------------------------- */

/**
 * SafePay signs each webhook with HMAC-SHA512 over the JSON payload, sent in
 * the `X-SFPY-SIGNATURE` header (see "Verify HMAC signatures" in their docs:
 * `crypto.createHmac("sha512", secret).update(data).digest("hex")`).
 *
 * The docs show `Buffer.from(JSON.stringify(payload))` - a re-serialisation of
 * the parsed body. Re-serialising can differ from the bytes that actually
 * arrived (key order, number formatting), so both the raw bytes and the
 * canonical re-serialisation are accepted. That does not weaken anything: an
 * attacker who cannot produce a valid HMAC for one form cannot produce one for
 * the other either.
 *
 * Returns true when any accepted signature matches any configured secret.
 */
export function verifyWebhookSignature(
  rawBody: string,
  headerSignature: string | null | undefined,
  secrets: string[]
): boolean {
  if (!headerSignature || secrets.length === 0 || rawBody.length === 0) return false;

  const candidates = headerSignature
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
  if (candidates.length === 0) return false;

  const serializations: string[] = [rawBody];
  try {
    const canonical = JSON.stringify(JSON.parse(rawBody));
    if (canonical !== rawBody) serializations.push(canonical);
  } catch {
    // Not valid JSON: only the raw bytes can be verified.
  }

  // A plain array rather than a Set: duplicate entries are harmless (the same
  // digest is just compared twice) and arrays iterate without needing
  // downlevelIteration, which this tsconfig target does not enable.
  const expected: string[] = [];
  for (const secret of secrets) {
    for (const serialization of serializations) {
      expected.push(createHmac('sha512', secret).update(serialization, 'utf8').digest('hex'));
    }
  }

  for (const candidate of candidates) {
    for (const signature of expected) {
      if (constantTimeEquals(candidate, signature)) return true;
    }
  }

  return false;
}

/** Length-safe `timingSafeEqual` over two ASCII strings. */
function constantTimeEquals(a: string, b: string): boolean {
  const left = Buffer.from(a, 'utf8');
  const right = Buffer.from(b, 'utf8');
  // `timingSafeEqual` throws on a length mismatch; hashes are fixed length, so
  // a mismatch only happens for a malformed header.
  if (left.length !== right.length || left.length === 0) return false;
  return timingSafeEqual(left, right);
}
