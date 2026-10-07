/**
 * SafePay webhook receiver.
 *
 * SafePay POSTs signed events here; the endpoint URL is configured in
 * Developers > Endpoints in the SafePay dashboard (sandbox and live separately -
 * each has its own shared secret).
 *
 * Order of operations follows SafePay's own guidance: verify the HMAC first and
 * refuse to acknowledge an event we cannot verify, then apply the change, then
 * acknowledge. The raw event is persisted either way, so an error in our own
 * business logic can never make a payment update disappear - and because the
 * settlement is idempotent, returning 5xx is Safe to let SafePay retry.
 *
 * No authentication session exists for this route: the HMAC over the shared
 * secret *is* the authentication.
 */
import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getSafepayConfig, verifyWebhookSignature } from '@/lib/safepay';
import {
  applySafePayRefund,
  markSafePayDepositFailed,
  settleSafePayDeposit,
  type SettleOutcome,
} from '@/lib/safepay-settlement';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function asFiniteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function asObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

/** Outcomes SafePay should not retry - the event is already accounted for. */
const ACKNOWLEDGED: SettleOutcome[] = ['APPLIED', 'DUPLICATE', 'IGNORED', 'UNMATCHED'];

export async function POST(request: NextRequest) {
  const config = getSafepayConfig();
  if (!config) {
    // Misconfigured endpoint: tell SafePay loudly rather than silently dropping
    // money events.
    return NextResponse.json({ error: 'SafePay is not configured' }, { status: 503 });
  }

  // The raw bytes are what gets signed, so read them before any parsing.
  const rawBody = await request.text();
  const signature = request.headers.get('x-sfpy-signature');

  if (!verifyWebhookSignature(rawBody, signature, config.webhookSecrets)) {
    // Not acknowledged, per SafePay's guidance on invalid signatures. Nothing
    // is written: an unauthenticated caller must never cause a database row.
    console.warn('[safepay] webhook rejected: signature verification failed');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Malformed JSON' }, { status: 400 });
  }

  const event = asObject(parsed);
  if (!event) return NextResponse.json({ error: 'Malformed event' }, { status: 400 });

  const eventToken = asString(event.token);
  const type = asString(event.type) ?? '';
  const version = asString(event.version);
  const data = asObject(event.data) ?? {};
  const tracker = asString(data.tracker);
  const metadata = asObject(data.metadata);
  const orderId = metadata ? asString(metadata.order_id) : null;

  // Retries of an event we already settled are acknowledged without re-running
  // anything or writing a second row.
  if (eventToken) {
    const seen = await prisma.paymentEvent.findFirst({
      where: { token: eventToken, outcome: { in: ['APPLIED', 'DUPLICATE'] } },
      select: { outcome: true },
    });
    if (seen) {
      return NextResponse.json({ received: true, outcome: seen.outcome, replayed: true });
    }
  }

  let outcome: SettleOutcome = 'IGNORED';
  let message: string | undefined;
  let paymentId: string | undefined;
  let bookingId: string | undefined;

  try {
    switch (type) {
      case 'payment.succeeded': {
        // SafePay sends `success: false` on a succeeded-type event when the
        // capture ultimately did not go through.
        if (data.success === false) {
          outcome = await markSafePayDepositFailed({
            tracker,
            message: asString(data.message) ?? 'SafePay reported success=false',
          });
          break;
        }
        const result = await settleSafePayDeposit({
          tracker,
          orderId,
          amountPaisa: asFiniteNumber(data.amount),
          currency: asString(data.currency),
        });
        outcome = result.outcome;
        message = result.message;
        paymentId = result.paymentId;
        bookingId = result.bookingId;
        break;
      }

      case 'payment.failed': {
        outcome = await markSafePayDepositFailed({
          tracker,
          message: asString(data.message),
        });
        message = asString(data.message) ?? undefined;
        break;
      }

      case 'payment.refunded': {
        const result = await applySafePayRefund({
          tracker,
          balancePaisa: asFiniteNumber(data.balance),
        });
        outcome = result.outcome;
        message = result.message;
        break;
      }

      default:
        // authorization.*, void.*, subscription.* and anything SafePay adds
        // later: recorded for the audit trail, no booking change implied.
        outcome = 'IGNORED';
        message = `No handler for event type ${type}`;
    }
  } catch (error) {
    outcome = 'ERROR';
    message = error instanceof Error ? error.message : 'unknown error';
  }

  // Persist the raw event regardless of outcome, so nothing is lost.
  try {
    await prisma.paymentEvent.create({
      data: {
        token: eventToken ?? `unsigned-${Date.now()}`,
        type: type || 'unknown',
        version,
        tracker,
        state: asString(data.state),
        amount: asFiniteNumber(data.amount),
        currency: asString(data.currency),
        merchantApiKey: asString(event.merchant_api_key),
        raw: parsed as Prisma.InputJsonValue,
        paymentId,
        bookingId,
        outcome,
      },
    });
  } catch (error) {
    console.error('[safepay] failed to persist webhook event:', error);
    return NextResponse.json({ error: 'Could not record event' }, { status: 500 });
  }

  if (message) {
    console.warn(`[safepay] ${type} -> ${outcome}: ${message}`);
  }

  if (!ACKNOWLEDGED.includes(outcome)) {
    // 5xx so SafePay retries; the event is already stored and settlement is
    // idempotent, so a retry cannot double-count.
    return NextResponse.json({ error: 'Event could not be applied' }, { status: 500 });
  }

  return NextResponse.json({ received: true, outcome });
}
