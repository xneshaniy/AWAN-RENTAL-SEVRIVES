/**
 * Deposit-on-booking configuration and maths.
 *
 * A booking deposit is the amount the customer pays through SafePay's hosted
 * checkout to secure a booking request; the balance is collected offline. The
 * deposit is only ever computed here, server-side, from the booking's own
 * total - a client-supplied amount is never read.
 *
 * Settings live in the SiteSettings table so an admin can change them without a
 * redeploy; every key has a documented code default for databases where the row
 * does not exist yet (nothing is seeded).
 */
import { createHmac, timingSafeEqual } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { normalizeBookingReference } from '@/lib/booking';
import { isSafepayConfigured, toPaisa } from '@/lib/safepay';

export const DEPOSIT_ENABLED_KEY = 'deposit_enabled';
export const DEPOSIT_TYPE_KEY = 'deposit_type';
export const DEPOSIT_VALUE_KEY = 'deposit_value';

export type DepositType = 'PERCENTAGE' | 'FIXED_AMOUNT';

export interface DepositConfig {
  enabled: boolean;
  type: DepositType;
  /** Percentage (1-100) when type is PERCENTAGE, otherwise PKR. */
  value: number;
}

/** Effective defaults when the matching SiteSettings row does not exist. */
export const DEPOSIT_DEFAULTS: DepositConfig = {
  enabled: true,
  type: 'PERCENTAGE',
  value: 20,
};

function parseEnabled(raw: string | undefined): boolean {
  if (raw === undefined) return DEPOSIT_DEFAULTS.enabled;
  const normalised = raw.trim().toLowerCase();
  if (normalised === '') return false; // row exists but is blank: explicitly off
  if (normalised === 'true') return true;
  if (normalised === 'false') return false;
  return DEPOSIT_DEFAULTS.enabled;
}

function parseType(raw: string | undefined): DepositType {
  const normalised = (raw ?? '').trim().toUpperCase();
  return normalised === 'FIXED_AMOUNT' ? 'FIXED_AMOUNT' : 'PERCENTAGE';
}

function parseValue(raw: string | undefined): number {
  const parsed = Number((raw ?? '').trim());
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEPOSIT_DEFAULTS.value;
}

/** Reads the deposit settings, falling back to {@link DEPOSIT_DEFAULTS}. */
export async function readDepositConfig(): Promise<DepositConfig> {
  const [enabledSetting, typeSetting, valueSetting] = await Promise.all([
    prisma.setting.findUnique({ where: { key: DEPOSIT_ENABLED_KEY } }),
    prisma.setting.findUnique({ where: { key: DEPOSIT_TYPE_KEY } }),
    prisma.setting.findUnique({ where: { key: DEPOSIT_VALUE_KEY } }),
  ]);

  const type = parseType(typeSetting?.value);
  const value = parseValue(valueSetting?.value);
  return {
    enabled: parseEnabled(enabledSetting?.value),
    type,
    // Percentages are clamped once here so the value shown to an admin and the
    // value used in the maths can never disagree.
    value: type === 'PERCENTAGE' ? Math.min(value, 100) : value,
  };
}

/**
 * Computes the deposit for a booking total, in paisa (SafePay's lowest
 * denomination), or null when no deposit should be offered:
 *
 *  - deposits are switched off
 *  - the booking total is not a positive number
 *  - the computed amount rounds to zero
 *  - the computed amount is >= the total (that would be full payment, which
 *    this integration deliberately does not do)
 */
export function computeDepositPaisa(totalAmount: number, config: DepositConfig): number | null {
  if (!config.enabled) return null;
  if (!Number.isFinite(totalAmount) || totalAmount <= 0) return null;

  const raw =
    config.type === 'FIXED_AMOUNT'
      ? config.value
      : (totalAmount * Math.min(Math.max(config.value, 0), 100)) / 100;

  if (!Number.isFinite(raw) || raw <= 0) return null;

  // Money to 2 decimal places, then to paisa for SafePay.
  const rounded = Math.round(raw * 100) / 100;
  if (rounded <= 0 || rounded >= totalAmount) return null;

  return toPaisa(rounded);
}

/**
 * Plain-language description of the deposit rule, for the public receipt page
 * and for admin hints. Falls back to the default rule when unset.
 */
export function describeDeposit(config: DepositConfig): string {
  if (config.type === 'FIXED_AMOUNT') {
    return `PKR ${config.value.toLocaleString('en-PK')} of the total`;
  }
  return `${Math.round(config.value)}% of the total`;
}

/* -------------------------------------------------------------------------- */
/* Deposit authorisation token                                                 */
/* -------------------------------------------------------------------------- */

/**
 * The booking receipt page is reachable by anyone holding the ARS-XXXXXX
 * reference, and that reference stays the primary capability. This token adds a
 * second, short-lived check: it is minted by the server component that renders
 * the page and handed to the client as a prop (never placed in the URL, so it
 * cannot leak through `Referer` or a bookmarked link). Because server actions
 * only accept POSTs, this stops a third-party site from invoking the checkout
 * action without first rendering our page.
 */
const TOKEN_VERSION = 'v1';
const TOKEN_TTL_SECONDS = 6 * 60 * 60; // 6 hours

function signingSecret(): string | null {
  const secret = process.env.NEXTAUTH_SECRET;
  return secret && secret.length >= 16 ? secret : null;
}

export function signDepositToken(bookingId: string, now: number = Date.now()): string | null {
  const secret = signingSecret();
  if (!secret || !bookingId) return null;

  const expiresAt = Math.floor(now / 1000) + TOKEN_TTL_SECONDS;
  const payload = `${TOKEN_VERSION}.${bookingId}.${expiresAt}`;
  const signature = createHmac('sha256', secret).update(payload, 'utf8').digest('hex');

  return `${payload}.${signature}`;
}

/** True when the token was minted for this exact booking and has not expired. */
export function verifyDepositToken(
  token: string | null | undefined,
  bookingId: string,
  now: number = Date.now()
): boolean {
  const secret = signingSecret();
  if (!secret || !token || !bookingId) return false;

  const parts = token.split('.');
  if (parts.length !== 4) return false;

  const [version, tokenBookingId, expiresAtRaw, signature] = parts;
  if (version !== TOKEN_VERSION || tokenBookingId !== bookingId) return false;

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || Math.floor(now / 1000) > expiresAt) return false;

  const expected = createHmac('sha256', secret)
    .update(`${version}.${bookingId}.${expiresAtRaw}`, 'utf8')
    .digest('hex');

  const left = Buffer.from(signature, 'utf8');
  const right = Buffer.from(expected, 'utf8');
  if (left.length !== right.length || left.length === 0) return false;
  return timingSafeEqual(left, right);
}

/* -------------------------------------------------------------------------- */
/* Public offer                                                                */
/* -------------------------------------------------------------------------- */

/** Booking statuses that may still take a deposit. */
export function acceptsDeposit(status: string): boolean {
  return status === 'PENDING' || status === 'CONFIRMED' || status === 'ACTIVE';
}

export interface DepositOffer {
  bookingId: string;
  bookingNumber: string;
  /** Paisa to charge now, or null when no deposit should be offered. */
  depositPaisa: number | null;
  /** Plain-language rule, e.g. "20% of the total". */
  rule: string;
  /** A SafePay deposit has already been received for this booking. */
  alreadyPaid: boolean;
  /** Server-minted token required by `startSafePayDeposit`. */
  token: string | null;
}

/**
 * Builds the deposit offer shown on the booking receipt page.
 *
 * The receipt deliberately exposes no financials, so this returns only what the
 * customer needs to act - the deposit figure and the rule that produced it -
 * and never the booking total or what has already been paid.
 *
 * Returns null when the reference is malformed or no booking matches, so the
 * caller can fall back to the plain receipt.
 */
export async function getDepositOffer(reference: string): Promise<DepositOffer | null> {
  const normalized = normalizeBookingReference(reference);
  if (!normalized) return null;

  const booking = await prisma.booking.findUnique({
    where: { bookingNumber: normalized },
    select: { id: true, bookingNumber: true, status: true, totalAmount: true, paidAmount: true },
  });
  if (!booking) return null;

  const [config, settled] = await Promise.all([
    readDepositConfig(),
    prisma.payment.findFirst({
      where: { bookingId: booking.id, method: 'SAFEPAY', status: 'PAID' },
      select: { id: true },
    }),
  ]);

  const total = Number(booking.totalAmount);
  const remaining = total - Number(booking.paidAmount);
  const configured = computeDepositPaisa(total, config);
  const capped = configured === null ? null : Math.min(configured, toPaisa(Math.max(remaining, 0)));

  const payable = acceptsDeposit(booking.status) && !settled && isSafepayConfigured();
  const depositPaisa = payable && capped !== null && capped > 0 ? capped : null;

  return {
    bookingId: booking.id,
    bookingNumber: booking.bookingNumber,
    depositPaisa,
    rule: describeDeposit(config),
    alreadyPaid: Boolean(settled),
    token: depositPaisa === null ? null : signDepositToken(booking.id),
  };
}
