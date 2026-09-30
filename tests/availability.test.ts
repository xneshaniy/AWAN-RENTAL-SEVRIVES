import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  rangesOverlap,
  isBookingBlocking,
  evaluateVehicleAvailability,
  type AvailabilityBlock,
  type AvailabilityBooking,
  type AvailabilityVehicle,
  type DateRange,
  type PendingHoldSettings,
} from '@/lib/availability';

/**
 * Unit tests for the pure availability rules (`@/lib/availability`).
 * No database, no HTTP - just the rules that the booking pipeline enforces
 * server-side. The database-backed scenarios live in `availability.db.test.ts`.
 */

const at = (value: string) => new Date(value);

/** Example booking from the spec: September 10 -> September 15, 2030. */
const EXISTING: DateRange = {
  startDate: at('2030-09-10T10:00'),
  endDate: at('2030-09-15T18:00'),
};

const HOLD_ENABLED: PendingHoldSettings = { enabled: true, hours: 24 };
const HOLD_DISABLED: PendingHoldSettings = { enabled: false, hours: 24 };

const NOW = at('2030-08-01T12:00');

const makeVehicle = (overrides: Partial<AvailabilityVehicle> = {}): AvailabilityVehicle => ({
  id: 'veh-1',
  name: 'Toyota Corolla',
  isAvailable: true,
  selfDriveAvailable: true,
  chauffeurAvailable: true,
  ...overrides,
});

const makeBooking = (overrides: Partial<AvailabilityBooking> = {}): AvailabilityBooking => ({
  id: 'booking-1',
  bookingNumber: 'ARS-CONF01',
  status: 'CONFIRMED',
  createdAt: NOW,
  submissionId: null,
  ...EXISTING,
  ...overrides,
});

const makeBlock = (overrides: Partial<AvailabilityBlock> = {}): AvailabilityBlock => ({
  id: 'block-1',
  isBlocked: true,
  reason: 'Scheduled maintenance',
  ...EXISTING,
  ...overrides,
});

/** Assertions shared by every rejection: wording a customer can act on. */
function assertCustomerFriendly(message: string | undefined): asserts message is string {
  assert.ok(message && message.length > 0, 'a customer-facing message is required');
  assert.match(message, /choose|try again/i, 'message must suggest a next step');
  assert.doesNotMatch(message, /prisma|SELECT FROM|stack trace|Error:/i, 'no technical details');
}

describe('rangesOverlap (date conflict checking)', () => {
  test('no overlap: ranges separated by a gap do not overlap', () => {
    const request: DateRange = { startDate: at('2030-09-16T10:00'), endDate: at('2030-09-20T18:00') };
    assert.equal(rangesOverlap(EXISTING, request), false);
    assert.equal(rangesOverlap(request, EXISTING), false);
  });

  test('partial overlap: request starts inside and ends after the booking', () => {
    const request: DateRange = { startDate: at('2030-09-13T10:00'), endDate: at('2030-09-18T18:00') };
    assert.equal(rangesOverlap(EXISTING, request), true);
  });

  test('partial overlap: request starts before and ends inside the booking', () => {
    const request: DateRange = { startDate: at('2030-09-08T10:00'), endDate: at('2030-09-12T18:00') };
    assert.equal(rangesOverlap(EXISTING, request), true);
  });

  test('full overlap: request entirely inside the booking', () => {
    const request: DateRange = { startDate: at('2030-09-11T10:00'), endDate: at('2030-09-14T18:00') };
    assert.equal(rangesOverlap(EXISTING, request), true);
  });

  test('full overlap: booking entirely inside the request', () => {
    const request: DateRange = { startDate: at('2030-09-01T10:00'), endDate: at('2030-09-30T18:00') };
    assert.equal(rangesOverlap(EXISTING, request), true);
  });

  test('full overlap: identical ranges', () => {
    assert.equal(rangesOverlap(EXISTING, { ...EXISTING }), true);
  });

  test('same-day conflict: request starts on the booking end date (before return time)', () => {
    const request: DateRange = { startDate: at('2030-09-15T10:00'), endDate: at('2030-09-18T18:00') };
    assert.equal(rangesOverlap(EXISTING, request), true);
  });

  test('same-day conflict: request starts exactly when the booking ends (turnaround)', () => {
    const request: DateRange = { startDate: at('2030-09-15T18:00'), endDate: at('2030-09-18T18:00') };
    assert.equal(rangesOverlap(EXISTING, request), true);
  });
});

describe('evaluateVehicleAvailability: vehicle status', () => {
  test('missing vehicle is rejected with a friendly error', () => {
    const decision = evaluateVehicleAvailability({
      vehicle: null,
      requested: { startDate: at('2030-09-20T10:00'), endDate: at('2030-09-22T18:00') },
    });
    assert.equal(decision.available, false);
    assert.equal(decision.code, 'VEHICLE_NOT_FOUND');
    assertCustomerFriendly(decision.message);
  });

  test('vehicle flagged unavailable cannot be booked', () => {
    const decision = evaluateVehicleAvailability({
      vehicle: makeVehicle({ isAvailable: false }),
      requested: { startDate: at('2030-09-20T10:00'), endDate: at('2030-09-22T18:00') },
    });
    assert.equal(decision.available, false);
    assert.equal(decision.code, 'VEHICLE_UNAVAILABLE');
    assertCustomerFriendly(decision.message);
  });
});

describe('evaluateVehicleAvailability: self-drive / chauffeur capability', () => {
  const request: DateRange = { startDate: at('2030-09-20T10:00'), endDate: at('2030-09-22T18:00') };

  test('self-drive booking is rejected when the vehicle has no self-drive availability', () => {
    const decision = evaluateVehicleAvailability({
      vehicle: makeVehicle({ selfDriveAvailable: false }),
      requested: request,
      rentalType: 'SELF_DRIVE',
    });
    assert.equal(decision.available, false);
    assert.equal(decision.code, 'SELF_DRIVE_UNAVAILABLE');
    assertCustomerFriendly(decision.message);
  });

  test('the same vehicle is still bookable as CHAUFFEUR', () => {
    const decision = evaluateVehicleAvailability({
      vehicle: makeVehicle({ selfDriveAvailable: false }),
      requested: request,
      rentalType: 'CHAUFFEUR',
    });
    assert.equal(decision.available, true);
  });

  test('chauffeur booking is rejected when the vehicle has no chauffeur availability', () => {
    const decision = evaluateVehicleAvailability({
      vehicle: makeVehicle({ chauffeurAvailable: false }),
      requested: request,
      rentalType: 'CHAUFFEUR',
    });
    assert.equal(decision.available, false);
    assert.equal(decision.code, 'CHAUFFEUR_UNAVAILABLE');
    assertCustomerFriendly(decision.message);
  });

  test('the same vehicle is still bookable as SELF_DRIVE', () => {
    const decision = evaluateVehicleAvailability({
      vehicle: makeVehicle({ chauffeurAvailable: false }),
      requested: request,
      rentalType: 'SELF_DRIVE',
    });
    assert.equal(decision.available, true);
  });
});

describe('evaluateVehicleAvailability: overlapping bookings', () => {
  test('no overlap: free dates are bookable', () => {
    const decision = evaluateVehicleAvailability({
      vehicle: makeVehicle(),
      requested: { startDate: at('2030-09-16T10:00'), endDate: at('2030-09-20T18:00') },
      bookings: [makeBooking()],
      pendingHold: HOLD_ENABLED,
      now: NOW,
    });
    assert.equal(decision.available, true);
  });

  test('partial overlap with a CONFIRMED booking is rejected', () => {
    const decision = evaluateVehicleAvailability({
      vehicle: makeVehicle(),
      requested: { startDate: at('2030-09-13T10:00'), endDate: at('2030-09-18T18:00') },
      bookings: [makeBooking()],
      pendingHold: HOLD_ENABLED,
      now: NOW,
    });
    assert.equal(decision.available, false);
    assert.equal(decision.code, 'BOOKED_DATES');
    assert.equal(decision.conflict?.kind, 'booking');
    assert.equal(decision.conflict?.status, 'CONFIRMED');
    assertCustomerFriendly(decision.message);
    // Another customer's reference must never leak into the response.
    assert.doesNotMatch(decision.message ?? '', /ARS-/);
  });

  test('full overlap (request inside the booking) is rejected', () => {
    const decision = evaluateVehicleAvailability({
      vehicle: makeVehicle(),
      requested: { startDate: at('2030-09-11T10:00'), endDate: at('2030-09-14T18:00') },
      bookings: [makeBooking()],
      pendingHold: HOLD_ENABLED,
      now: NOW,
    });
    assert.equal(decision.available, false);
    assert.equal(decision.code, 'BOOKED_DATES');
  });

  test('same-day conflict is rejected', () => {
    const decision = evaluateVehicleAvailability({
      vehicle: makeVehicle(),
      requested: { startDate: at('2030-09-15T10:00'), endDate: at('2030-09-18T18:00') },
      bookings: [makeBooking()],
      pendingHold: HOLD_ENABLED,
      now: NOW,
    });
    assert.equal(decision.available, false);
    assert.equal(decision.code, 'BOOKED_DATES');
  });

  test('a CANCELLED booking never blocks the vehicle', () => {
    const decision = evaluateVehicleAvailability({
      vehicle: makeVehicle(),
      requested: { startDate: at('2030-09-11T10:00'), endDate: at('2030-09-14T18:00') },
      bookings: [makeBooking({ status: 'CANCELLED' })],
      pendingHold: HOLD_ENABLED,
      now: NOW,
    });
    assert.equal(decision.available, true);
  });

  test('ACTIVE and CONFIRMED both block', () => {
    for (const status of ['ACTIVE', 'CONFIRMED'] as const) {
      const decision = evaluateVehicleAvailability({
        vehicle: makeVehicle(),
        requested: { startDate: at('2030-09-11T10:00'), endDate: at('2030-09-14T18:00') },
        bookings: [makeBooking({ status })],
        pendingHold: HOLD_ENABLED,
        now: NOW,
      });
      assert.equal(decision.available, false, `${status} must block overlapping dates`);
    }
  });

  test('the customer\'s own submission never conflicts with itself', () => {
    const decision = evaluateVehicleAvailability({
      vehicle: makeVehicle(),
      requested: { startDate: at('2030-09-11T10:00'), endDate: at('2030-09-14T18:00') },
      bookings: [makeBooking({ status: 'PENDING', submissionId: 'own-submission-id' })],
      pendingHold: HOLD_ENABLED,
      excludeSubmissionId: 'own-submission-id',
      now: NOW,
    });
    assert.equal(decision.available, true);
  });
});

describe('evaluateVehicleAvailability: maintenance / unavailable blocks', () => {
  test('an overlapping maintenance block rejects the request with the reason', () => {
    const decision = evaluateVehicleAvailability({
      vehicle: makeVehicle(),
      requested: { startDate: at('2030-09-11T10:00'), endDate: at('2030-09-14T18:00') },
      blocks: [makeBlock()],
      pendingHold: HOLD_ENABLED,
      now: NOW,
    });
    assert.equal(decision.available, false);
    assert.equal(decision.code, 'MAINTENANCE_BLOCK');
    assert.match(decision.message ?? '', /Scheduled maintenance/);
    assertCustomerFriendly(decision.message);
  });

  test('a maintenance block without a reason still produces a friendly message', () => {
    const decision = evaluateVehicleAvailability({
      vehicle: makeVehicle(),
      requested: { startDate: at('2030-09-11T10:00'), endDate: at('2030-09-14T18:00') },
      blocks: [makeBlock({ reason: null })],
      pendingHold: HOLD_ENABLED,
      now: NOW,
    });
    assert.equal(decision.available, false);
    assert.equal(decision.code, 'MAINTENANCE_BLOCK');
    assertCustomerFriendly(decision.message);
  });

  test('a non-blocked availability row (isBlocked: false) does not reject', () => {
    const decision = evaluateVehicleAvailability({
      vehicle: makeVehicle(),
      requested: { startDate: at('2030-09-11T10:00'), endDate: at('2030-09-14T18:00') },
      blocks: [makeBlock({ isBlocked: false })],
      pendingHold: HOLD_ENABLED,
      now: NOW,
    });
    assert.equal(decision.available, true);
  });
});

describe('evaluateVehicleAvailability: configurable pending-booking hold', () => {
  const request: DateRange = { startDate: at('2030-09-11T10:00'), endDate: at('2030-09-14T18:00') };

  test('a fresh PENDING booking blocks while the hold is enabled', () => {
    const decision = evaluateVehicleAvailability({
      vehicle: makeVehicle(),
      requested: request,
      bookings: [makeBooking({ status: 'PENDING' })],
      pendingHold: HOLD_ENABLED,
      now: NOW,
    });
    assert.equal(decision.available, false);
    assert.equal(decision.code, 'PENDING_HOLD');
    assertCustomerFriendly(decision.message);
  });

  test('a PENDING booking does not block when the hold is disabled', () => {
    const decision = evaluateVehicleAvailability({
      vehicle: makeVehicle(),
      requested: request,
      bookings: [makeBooking({ status: 'PENDING' })],
      pendingHold: HOLD_DISABLED,
      now: NOW,
    });
    assert.equal(decision.available, true);
  });

  test('a PENDING booking stops blocking once the hold window has expired', () => {
    const decision = evaluateVehicleAvailability({
      vehicle: makeVehicle(),
      requested: request,
      bookings: [makeBooking({ status: 'PENDING', createdAt: at('2030-07-30T12:00') })], // 48h before NOW
      pendingHold: HOLD_ENABLED, // 24h hold
      now: NOW,
    });
    assert.equal(decision.available, true);
  });

  test('a firm booking wins the message over an overlapping pending hold', () => {
    const decision = evaluateVehicleAvailability({
      vehicle: makeVehicle(),
      requested: request,
      bookings: [
        makeBooking({ id: 'p', bookingNumber: 'ARS-PEND01', status: 'PENDING' }),
        makeBooking({ id: 'c', bookingNumber: 'ARS-CONF01', status: 'CONFIRMED' }),
      ],
      pendingHold: HOLD_ENABLED,
      now: NOW,
    });
    assert.equal(decision.available, false);
    assert.equal(decision.code, 'BOOKED_DATES');
    assert.equal(decision.conflict?.status, 'CONFIRMED');
  });
});

describe('isBookingBlocking', () => {
  const requested: DateRange = { startDate: at('2030-09-11T10:00'), endDate: at('2030-09-14T18:00') };
  const options = { pendingHold: HOLD_ENABLED, now: NOW };

  test('blocks overlapping CONFIRMED bookings only', () => {
    assert.equal(isBookingBlocking(makeBooking({ status: 'CONFIRMED' }), requested, options), true);
    assert.equal(isBookingBlocking(makeBooking({ status: 'CANCELLED' }), requested, options), false);
    assert.equal(isBookingBlocking(makeBooking({ status: 'NO_SHOW' }), requested, options), true);
    assert.equal(
      isBookingBlocking(makeBooking({ status: 'CONFIRMED', startDate: at('2030-10-01T10:00'), endDate: at('2030-10-05T18:00') }), requested, options),
      false
    );
  });
});
