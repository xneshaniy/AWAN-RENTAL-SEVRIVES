/**
 * Applies a SafePay deposit outcome to the database.
 *
 * Shared by two independent callers:
 *   - the webhook (`/api/payments/safepay/webhook`) - authoritative
 *   - the checkout return path, which re-reads the tracker from SafePay with
 *     our own secret. That is a fallback for a late or missing webhook, and it
 *     is safe precisely because the state is fetched server-to-server rather
 *     than taken from anything the browser sends.
 *
 * Both callers are idempotent. The guard is `payments.tracker` being UNIQUE:
 * every checkout attempt has at most one row, and a repeated delivery finds it
 * already PAID and becomes a DUPLICATE instead of a second charge. Booking
 * totals are never incremented - they are recomputed from the sum of settled
 * payments inside the same transaction, so replaying an event any number of
 * times produces the same result.
 *
 * Amounts are always SafePay's own figures, authenticated by the webhook HMAC
 * or by the reporter API call. Nothing here reads an amount from the client.
 */
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import { createNotification } from '@/lib/notifications';
import { normalizeBookingReference } from '@/lib/booking';
import { fetchTracker, fromPaisa, TRACKER_COMPLETED } from '@/lib/safepay';

export type SettleOutcome = 'APPLIED' | 'DUPLICATE' | 'UNMATCHED' | 'IGNORED' | 'ERROR';

export interface SettleResult {
  outcome: SettleOutcome;
  paymentId?: string;
  bookingId?: string;
  bookingNumber?: string;
  message?: string;
}

interface SettleParams {
  /** SafePay tracker token (`track_...`) - the primary lookup key. */
  tracker?: string | null;
  /** Booking reference echoed back through `metadata.order_id`. */
  orderId?: string | null;
  /** Amount actually captured, in paisa, when the event carries one. */
  amountPaisa?: number | null;
  currency?: string | null;
}

interface BookingBrief {
  id: string;
  bookingNumber: string;
  totalAmount: unknown;
  status: string;
}

type TxResult =
  | {
      kind: 'settled';
      paymentId: string;
      bookingId: string;
      bookingNumber: string;
      paid: number;
      total: number;
      /** Reported amount differed from what the checkout session asked for. */
      mismatch: boolean;
    }
  | { kind: 'duplicate'; paymentId: string }
  | { kind: 'blocked'; message: string };

/** Status derived from how much of the booking total has been settled. */
function statusFor(paid: number, total: number): 'UNPAID' | 'PARTIAL' | 'PAID' {
  if (paid <= 0) return 'UNPAID';
  if (paid >= total) return 'PAID';
  return 'PARTIAL';
}

/**
 * Recomputes `paidAmount` / `paymentStatus` from settled payments.
 * Recomputation rather than increment is what makes replay safe.
 */
async function recomputeBookingPayment(
  tx: Prisma.TransactionClient,
  bookingId: string
): Promise<{ paid: number; total: number } | null> {
  const [sum, booking] = await Promise.all([
    tx.payment.aggregate({ where: { bookingId, status: 'PAID' }, _sum: { amount: true } }),
    tx.booking.findUnique({ where: { id: bookingId }, select: { totalAmount: true } }),
  ]);

  if (!booking) return null;

  const paid = Number(sum._sum.amount ?? 0);
  const total = Number(booking.totalAmount);

  await tx.booking.update({
    where: { id: bookingId },
    data: { paidAmount: paid, paymentStatus: statusFor(paid, total) },
  });

  return { paid, total };
}

/**
 * Marks a deposit settled and refreshes the booking's paid total.
 *
 * Returns UNMATCHED instead of throwing when an event cannot be tied to a
 * booking, so the caller can still store the raw event for a human to look at.
 */
export async function settleSafePayDeposit(params: SettleParams): Promise<SettleResult> {
  const tracker = (params.tracker ?? '').trim() || null;
  const rawOrderId = (params.orderId ?? '').trim() || null;
  const orderId = rawOrderId ? normalizeBookingReference(rawOrderId) : null;
  const amountPaisa = params.amountPaisa ?? null;
  const currency = params.currency ?? 'PKR';

  if (!tracker) {
    return { outcome: 'UNMATCHED', message: 'Event carried no tracker to match against' };
  }

  try {
    const existing = await prisma.payment.findUnique({
      where: { tracker },
      select: {
        id: true,
        status: true,
        amount: true,
        booking: { select: { id: true, bookingNumber: true, totalAmount: true, status: true } },
      },
    });

    if (existing && existing.status === 'PAID') {
      return { outcome: 'DUPLICATE', paymentId: existing.id, message: 'Already settled' };
    }

    // Only the checkout row written before the shopper was sent to SafePay may
    // say which booking this tracker belongs to. An event naming a tracker we
    // never issued is refused even when its order id points at a real booking:
    // crediting on the order id alone would let a second event carrying a
    // different tracker credit the same booking again, which is exactly what
    // the unique tracker exists to prevent, and it would turn a misrouted or
    // forged-but-signed event into money on somebody's booking. The raw event
    // is still stored by the caller so a human can reconcile it.
    if (!existing) {
      return {
        outcome: 'UNMATCHED',
        message: `Tracker ${tracker} does not belong to any checkout started here${
          orderId ? ` (event named order ${orderId})` : ''
        }`,
      };
    }

    const booking: BookingBrief = existing.booking;

    if (booking.status === 'CANCELLED' || booking.status === 'NO_SHOW') {
      return {
        outcome: 'UNMATCHED',
        message: `Booking ${booking.bookingNumber} is ${booking.status}; refusing to settle`,
      };
    }

    // `booking` comes from the row we just matched, so it is never null past
    // this point - and because it is a `const`, that narrowing survives inside
    // the transaction callback below.
    const expected = Number(existing.amount);
    const reported = amountPaisa !== null ? fromPaisa(amountPaisa) : null;

    // A deposit can never exceed the booking itself. SafePay's figure is
    // authenticated, so this is an anomaly rather than an attack - but an
    // anomaly is exactly what should NOT be auto-applied to someone's booking.
    // The raw event is still recorded by the caller for a human to reconcile.
    if (reported !== null && reported > Number(booking.totalAmount) + 0.005) {
      return {
        outcome: 'UNMATCHED',
        message: `SafePay reported ${reported} which exceeds the booking total of ${Number(booking.totalAmount)}`,
      };
    }

    const result: TxResult = await prisma.$transaction(
      async (tx) => {
        let row = tracker
          ? await tx.payment.findUnique({
              where: { tracker },
              select: { id: true, status: true, amount: true, bookingId: true },
            })
          : null;

        if (row && row.status === 'PAID') return { kind: 'duplicate', paymentId: row.id };

        if (!row) {
          // Nothing deletes a payment row, so a miss here means the row never
          // existed - the same refusal already made above the transaction. A
          // row is never invented from the event: it is the proof that we
          // started this checkout, and without that proof the event cannot be
          // tied to money we asked SafePay to collect.
          return { kind: 'blocked', message: `Tracker ${tracker} not found during settlement` };
        }

        const nextAmount = reported ?? Number(row.amount);
        const updated = await tx.payment.update({
          where: { id: row.id },
          data: {
            status: 'PAID',
            amount: nextAmount,
            currency,
            paidAt: new Date(),
          },
          select: { id: true, bookingId: true },
        });

        const totals = await recomputeBookingPayment(tx, updated.bookingId);
        if (!totals) return { kind: 'blocked', message: 'Booking vanished during settlement' };

        return {
          kind: 'settled',
          paymentId: updated.id,
          bookingId: updated.bookingId,
          bookingNumber: booking.bookingNumber,
          paid: totals.paid,
          total: totals.total,
          mismatch: reported !== null && Math.abs(reported - expected) > 0.005,
        };
      },
      { timeout: 10_000 }
    );

    if (result.kind === 'duplicate') {
      return { outcome: 'DUPLICATE', paymentId: result.paymentId, message: 'Already settled' };
    }
    if (result.kind === 'blocked') {
      return { outcome: 'UNMATCHED', message: result.message };
    }

    // Best-effort: a notification failure must never fail a settled payment.
    await createNotification({
      type: 'BOOKING_STATUS_CHANGED',
      title: 'Booking deposit received',
      message: `SafePay deposit settled for ${result.bookingNumber} - PKR ${result.paid.toLocaleString('en-PK')} of PKR ${result.total.toLocaleString('en-PK')} received.`,
      link: `/admin/bookings/${result.bookingNumber}`,
      bookingId: result.bookingId,
      meta: { source: 'safepay', tracker, mismatch: result.mismatch },
    });

    return {
      outcome: 'APPLIED',
      paymentId: result.paymentId,
      bookingId: result.bookingId,
      bookingNumber: result.bookingNumber,
      message: result.mismatch ? 'Settled at SafePay\'s reported amount, which differed from the session' : undefined,
    };
  } catch (error) {
    // A unique violation on `tracker` means a concurrent delivery won the race.
    if (isUniqueViolation(error)) {
      return { outcome: 'DUPLICATE', message: 'Concurrent settlement detected' };
    }
    return { outcome: 'ERROR', message: error instanceof Error ? error.message : 'unknown error' };
  }
}

/** True when Prisma reported a unique-constraint violation. */
function isUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  return (error as { code?: unknown }).code === 'P2002';
}

/**
 * Records a failed deposit attempt against its checkout row. Never touches the
 * booking's totals - no money moved.
 */
export async function markSafePayDepositFailed(params: {
  tracker?: string | null;
  message?: string | null;
}): Promise<SettleOutcome> {
  const tracker = (params.tracker ?? '').trim();
  if (!tracker) return 'UNMATCHED';

  try {
    const payment = await prisma.payment.findUnique({
      where: { tracker },
      select: { id: true, status: true },
    });
    if (!payment) return 'UNMATCHED';
    // Never downgrade a settled payment because of a later failure event.
    if (payment.status === 'PAID') return 'DUPLICATE';

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'FAILED',
        notes: (params.message ?? 'SafePay reported a failed payment').slice(0, 500),
      },
    });
    return 'APPLIED';
  } catch {
    return 'ERROR';
  }
}

/**
 * Applies a `payment.refunded` event.
 *
 * A full refund (SafePay's `balance` back to zero) removes the payment from the
 * booking's settled total. A partial refund is deliberately NOT applied: taking
 * the whole payment out would understate what was actually received, so the
 * event is only recorded and staff are told to adjust it by hand.
 */
export async function applySafePayRefund(params: {
  tracker?: string | null;
  /** Remaining amount after the refund, in paisa. Null when not reported. */
  balancePaisa?: number | null;
}): Promise<{ outcome: SettleOutcome; message?: string }> {
  const tracker = (params.tracker ?? '').trim();
  if (!tracker) return { outcome: 'UNMATCHED', message: 'Refund event carried no tracker' };

  if (params.balancePaisa === null || params.balancePaisa === undefined) {
    return { outcome: 'IGNORED', message: 'Refund event reported no remaining balance' };
  }
  if (params.balancePaisa > 0) {
    return {
      outcome: 'IGNORED',
      message: 'Partial refund - adjust the booking manually',
    };
  }

  try {
    const payment = await prisma.payment.findUnique({
      where: { tracker },
      select: { id: true, status: true, bookingId: true },
    });
    if (!payment) return { outcome: 'UNMATCHED', message: 'No payment for this tracker' };
    if (payment.status === 'REFUNDED') return { outcome: 'DUPLICATE', message: 'Already refunded' };

    const bookingNumber = await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: 'REFUNDED', notes: 'SafePay reported a full refund' },
      });
      const totals = await recomputeBookingPayment(tx, payment.bookingId);
      const booking = await tx.booking.findUnique({
        where: { id: payment.bookingId },
        select: { bookingNumber: true },
      });
      return { bookingNumber: booking?.bookingNumber ?? null, totals };
    });

    if (!bookingNumber.totals) return { outcome: 'UNMATCHED', message: 'Booking vanished during refund' };

    await createNotification({
      type: 'BOOKING_STATUS_CHANGED',
      title: 'Booking deposit refunded',
      message: `SafePay refunded the deposit for ${bookingNumber.bookingNumber} in full.`,
      link: `/admin/bookings/${bookingNumber.bookingNumber}`,
      bookingId: payment.bookingId,
      meta: { source: 'safepay', tracker },
    });

    return { outcome: 'APPLIED' };
  } catch (error) {
    if (isUniqueViolation(error)) return { outcome: 'DUPLICATE' };
    return { outcome: 'ERROR', message: error instanceof Error ? error.message : 'unknown error' };
  }
}

/* -------------------------------------------------------------------------- */
/* Checkout return path                                                        */
/* -------------------------------------------------------------------------- */

export type DepositReturnStatus = 'PAID' | 'PENDING' | 'MISMATCH' | 'UNAVAILABLE';

export interface DepositReturnResult {
  status: DepositReturnStatus;
  /** Customer-facing wording; safe to render on the receipt page. */
  message: string;
}

/**
 * Confirms a checkout after SafePay redirects the shopper back with
 * `?tracker=...`.
 *
 * The browser-supplied tracker is never trusted on its own: the row it matches
 * must exist and must belong to the booking reference in the URL, and "did it
 * settle?" is answered by asking SafePay directly with our own secret. The
 * webhook remains the authoritative path - this exists so a late or dropped
 * webhook still ends with the customer seeing the right thing, and settlement
 * goes through exactly the same idempotent function.
 */
export async function confirmSafePayDepositReturn(params: {
  tracker: string;
  bookingNumber: string;
}): Promise<DepositReturnResult> {
  const tracker = (params.tracker ?? '').trim();
  const reference = normalizeBookingReference(params.bookingNumber);

  if (!tracker || !reference || tracker.length > 200) {
    return { status: 'MISMATCH', message: 'We could not match this payment to your booking.' };
  }

  const row = await prisma.payment.findUnique({
    where: { tracker },
    select: { id: true, status: true, booking: { select: { bookingNumber: true } } },
  });

  if (!row || row.booking.bookingNumber !== reference) {
    // A tracker for some other booking, or one we never issued.
    return { status: 'MISMATCH', message: 'We could not match this payment to your booking.' };
  }

  if (row.status === 'PAID') {
    return { status: 'PAID', message: 'Your deposit has been received.' };
  }

  let snapshot;
  try {
    snapshot = await fetchTracker(tracker);
  } catch (error) {
    console.warn('[safepay] could not read tracker on return:', error);
    return {
      status: 'UNAVAILABLE',
      message: 'We could not confirm your payment just now. It will be recorded automatically.',
    };
  }

  if (!snapshot) {
    return {
      status: 'UNAVAILABLE',
      message: 'We could not confirm your payment just now. It will be recorded automatically.',
    };
  }

  if (snapshot.state !== TRACKER_COMPLETED) {
    return {
      status: 'PENDING',
      message: 'Your payment has not completed yet. You can safely close this page.',
    };
  }

  const settled = await settleSafePayDeposit({
    tracker,
    orderId: reference,
    amountPaisa: snapshot.amount ?? null,
    currency: snapshot.currency,
  });

  if (settled.outcome === 'APPLIED' || settled.outcome === 'DUPLICATE') {
    return { status: 'PAID', message: 'Your deposit has been received.' };
  }

  console.warn(`[safepay] return-path settlement ${settled.outcome}: ${settled.message ?? ''}`);
  return {
    status: 'MISMATCH',
    message: 'We received your payment but need to check it against your booking. We will be in touch.',
  };
}
