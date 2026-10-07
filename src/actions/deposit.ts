'use server';

import { headers } from 'next/headers';
import { SITE_URL } from '@/config/site';
import { prisma } from '@/lib/prisma';
import { normalizeBookingReference } from '@/lib/booking';
import { acceptsDeposit, computeDepositPaisa, readDepositConfig, verifyDepositToken } from '@/lib/deposit';
import { createCheckoutSession, isSafepayConfigured, toPaisa } from '@/lib/safepay';
import { clientIpFromHeaders } from '@/lib/rate-limit';
import { rateLimitShared } from '@/lib/rate-limit-db';

export interface StartDepositResult {
  success: boolean;
  /** Absolute SafePay hosted-checkout URL to redirect the shopper to. */
  checkoutUrl?: string;
  error?: string;
}

/**
 * Starts a SafePay hosted-checkout session for a booking deposit.
 *
 * Server action (POST-only) called from the booking receipt page. Everything
 * that matters is recomputed here - the caller supplies only the booking
 * reference and the token the receipt page handed it:
 *
 *   - the reference is shape-validated before it touches the database
 *   - the token is an HMAC minted by the server component that rendered the
 *     page and is bound to this booking and a 6h expiry, so a third-party site
 *     cannot invoke this action cold
 *   - the amount comes from the booking's own total and the deposit settings,
 *     never from anything the browser sends
 *   - rate limited per IP + booking, because each attempt creates a real
 *     payment session at SafePay
 *
 * Fails safe: any problem returns a message and no redirect, and the receipt
 * page still works normally without it.
 */
export async function startSafePayDeposit(
  bookingNumberInput: unknown,
  tokenInput: unknown
): Promise<StartDepositResult> {
  if (typeof bookingNumberInput !== 'string' || typeof tokenInput !== 'string') {
    return { success: false, error: 'Invalid request.' };
  }

  const reference = normalizeBookingReference(bookingNumberInput);
  if (!reference) {
    return { success: false, error: 'Invalid booking reference.' };
  }

  if (!isSafepayConfigured()) {
    return { success: false, error: 'Online deposits are not available right now.' };
  }

  let ip = 'unknown';
  try {
    ip = clientIpFromHeaders(headers());
  } catch {
    ip = 'unknown';
  }

  if (
    !(await rateLimitShared(`deposit:${ip}:${reference}`, {
      limit: 5,
      windowMs: 10 * 60 * 1000,
    }))
  ) {
    return {
      success: false,
      error: 'Too many payment attempts. Please wait a few minutes and try again.',
    };
  }

  try {
    const booking = await prisma.booking.findUnique({
      where: { bookingNumber: reference },
      select: {
        id: true,
        bookingNumber: true,
        status: true,
        totalAmount: true,
        paidAmount: true,
      },
    });

    if (!booking) {
      return { success: false, error: 'Booking not found.' };
    }

    if (!verifyDepositToken(tokenInput, booking.id)) {
      return {
        success: false,
        error: 'This payment session has expired. Please refresh the page and try again.',
      };
    }

    if (!acceptsDeposit(booking.status)) {
      return {
        success: false,
        error: 'This booking can no longer accept an online deposit.',
      };
    }

    // Already settled in full, or a deposit already received for it.
    const remaining = Number(booking.totalAmount) - Number(booking.paidAmount);
    if (remaining <= 0) {
      return { success: false, error: 'This booking is already fully paid.' };
    }

    const existingDeposit = await prisma.payment.findFirst({
      where: { bookingId: booking.id, method: 'SAFEPAY', status: 'PAID' },
      select: { id: true },
    });
    if (existingDeposit) {
      return { success: false, error: 'A deposit has already been received for this booking.' };
    }

    const config = await readDepositConfig();
    if (!config.enabled) {
      return { success: false, error: 'Online deposits are turned off.' };
    }

    const configured = computeDepositPaisa(Number(booking.totalAmount), config);
    if (configured === null) {
      return { success: false, error: 'No deposit is due for this booking.' };
    }

    // Never ask for more than what is left to pay.
    const amountPaisa = Math.min(configured, toPaisa(remaining));
    if (amountPaisa <= 0) {
      return { success: false, error: 'No deposit is due for this booking.' };
    }

    const receiptUrl = `${SITE_URL}/booking/success/${encodeURIComponent(booking.bookingNumber)}`;

    const { tracker, checkoutUrl } = await createCheckoutSession({
      amountPaisa,
      orderId: booking.bookingNumber,
      redirectUrl: receiptUrl,
      cancelUrl: `${receiptUrl}?deposit=cancelled`,
    });

    // The row is written before the shopper pays so `tracker` is bound to this
    // booking. That binding is what lets the webhook and the return path find
    // the right row - and what stops a tracker from one booking being presented
    // against another. `status` (UNPAID) is the authority here; `paidAt` is
    // rewritten when the payment actually settles.
    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        amount: amountPaisa / 100,
        method: 'SAFEPAY',
        status: 'UNPAID',
        tracker,
        currency: 'PKR',
        notes: 'SafePay deposit - checkout started, awaiting payment',
      },
    });

    return { success: true, checkoutUrl };
  } catch (error) {
    console.error('[safepay] could not start deposit checkout:', error);
    return {
      success: false,
      error: 'We could not start the payment just now. Please try again.',
    };
  }
}
