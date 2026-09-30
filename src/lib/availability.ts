import type { BookingStatus, RentalType } from '@prisma/client';
import { formatDate } from '@/lib/utils';

/**
 * Vehicle availability rules - the single source of truth for deciding
 * whether a vehicle may be booked for a requested date range.
 *
 * This module is deliberately pure (no database, no settings fetch, no
 * request/response objects) so the rules can be unit-tested exhaustively and
 * can never be bypassed by the frontend: every booking path calls into these
 * rules from the server (`@/lib/vehicle-availability` performs the queries,
 * `@/lib/booking` enforces the result before anything is persisted).
 *
 * Rules enforced here:
 * 1. Vehicle must exist and be flagged available (`isAvailable`).
 * 2. Rental-type capability: SELF_DRIVE needs `selfDriveAvailable`,
 *    CHAUFFEUR needs `chauffeurAvailable`.
 * 3. Maintenance / admin blocks (`Availability` rows with `isBlocked`) that
 *    overlap the request always win.
 * 4. Conflicting bookings: CONFIRMED, ACTIVE, COMPLETED and NO_SHOW bookings
 *    that overlap the request block it. CANCELLED never blocks. PENDING only
 *    blocks while a configurable temporary hold is active.
 * 5. The customer's own submission (idempotency key) never blocks itself.
 *
 * Overlap semantics: ranges are treated as INCLUSIVE on both ends, so a
 * booking that ends exactly when the new request starts still counts as a
 * conflict (same-day turnaround keeps the vehicle busy for that day).
 */

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export type AvailabilityConflictCode =
  | 'VEHICLE_NOT_FOUND'
  | 'VEHICLE_UNAVAILABLE'
  | 'SELF_DRIVE_UNAVAILABLE'
  | 'CHAUFFEUR_UNAVAILABLE'
  | 'MAINTENANCE_BLOCK'
  | 'BOOKED_DATES'
  | 'PENDING_HOLD';

export interface AvailabilityVehicle {
  id: string;
  name: string;
  isAvailable: boolean;
  selfDriveAvailable: boolean;
  chauffeurAvailable: boolean;
}

export interface AvailabilityBooking extends DateRange {
  id: string;
  bookingNumber: string;
  status: BookingStatus;
  createdAt: Date;
  submissionId?: string | null;
}

export interface AvailabilityBlock extends DateRange {
  id: string;
  isBlocked: boolean;
  reason?: string | null;
}

/** Configurable temporary hold applied to PENDING bookings. */
export interface PendingHoldSettings {
  /** When false, pending bookings never hold their dates. */
  enabled: boolean;
  /** How many hours after submission a pending booking holds its dates. */
  hours: number;
}

export interface AvailabilityConflict {
  kind: 'booking' | 'block';
  code: AvailabilityConflictCode;
  startDate: Date;
  endDate: Date;
  /** Only set for booking conflicts - never exposes another customer's data. */
  bookingNumber?: string;
  status?: BookingStatus;
  reason?: string | null;
}

export interface AvailabilityDecision {
  available: boolean;
  code?: AvailabilityConflictCode;
  /** Customer-friendly explanation. Never contains stack traces or PII. */
  message?: string;
  conflict?: AvailabilityConflict;
}

export interface EvaluateAvailabilityInput {
  vehicle: AvailabilityVehicle | null;
  requested: DateRange;
  rentalType?: RentalType;
  /** Overlapping candidate bookings (any status - rules are applied here). */
  bookings?: readonly AvailabilityBooking[];
  /** Maintenance / admin blocked periods. */
  blocks?: readonly AvailabilityBlock[];
  pendingHold?: PendingHoldSettings;
  /** Own submission id, so a retried submission never conflicts with itself. */
  excludeSubmissionId?: string | null;
  now?: Date;
}

/** Statuses that always hold the vehicle for their date range. */
export const BLOCKING_BOOKING_STATUSES: readonly BookingStatus[] = [
  'CONFIRMED',
  'ACTIVE',
  'COMPLETED',
  'NO_SHOW',
];

const HOUR_MS = 60 * 60 * 1000;

/** True when two inclusive date ranges share at least one moment. */
export function rangesOverlap(a: DateRange, b: DateRange): boolean {
  return a.startDate.getTime() <= b.endDate.getTime() && a.endDate.getTime() >= b.startDate.getTime();
}

interface BookingBlockingOptions {
  pendingHold?: PendingHoldSettings;
  now: Date;
  excludeSubmissionId?: string | null;
}

/**
 * Decides whether a single existing booking blocks the requested range:
 * cancelled bookings free the vehicle, pending bookings only hold it while
 * the configurable hold window is active.
 */
export function isBookingBlocking(
  booking: AvailabilityBooking,
  requested: DateRange,
  options: BookingBlockingOptions
): boolean {
  // A retried submission must never conflict with the booking it created.
  if (options.excludeSubmissionId && booking.submissionId === options.excludeSubmissionId) {
    return false;
  }

  if (!rangesOverlap(booking, requested)) return false;

  if (booking.status === 'PENDING') {
    const hold = options.pendingHold;
    if (!hold?.enabled) return false;
    const ageMs = options.now.getTime() - booking.createdAt.getTime();
    return ageMs <= hold.hours * HOUR_MS;
  }

  return BLOCKING_BOOKING_STATUSES.includes(booking.status);
}

function formatRange(range: DateRange): string {
  return `${formatDate(range.startDate)} to ${formatDate(range.endDate)}`;
}

function byStartDate(a: DateRange, b: DateRange): number {
  return a.startDate.getTime() - b.startDate.getTime();
}

/**
 * Applies every availability rule to the requested range and returns either
 * `{ available: true }` or a customer-friendly blocking decision.
 */
export function evaluateVehicleAvailability(
  input: EvaluateAvailabilityInput
): AvailabilityDecision {
  const { vehicle, requested, rentalType } = input;

  /* ------------------------- 1. Vehicle status -------------------------- */
  if (!vehicle) {
    return {
      available: false,
      code: 'VEHICLE_NOT_FOUND',
      message:
        'The selected vehicle could not be found. Please choose another vehicle from our fleet.',
    };
  }

  if (!vehicle.isAvailable) {
    return {
      available: false,
      code: 'VEHICLE_UNAVAILABLE',
      message: `${vehicle.name} is currently unavailable for new bookings. Please choose another vehicle or contact us for help.`,
    };
  }

  /* ------------------- 2. Rental-type capability ------------------------ */
  if (rentalType === 'SELF_DRIVE' && !vehicle.selfDriveAvailable) {
    return {
      available: false,
      code: 'SELF_DRIVE_UNAVAILABLE',
      message: `${vehicle.name} is not available for self-drive rental. Please book it with a chauffeur or choose another vehicle.`,
    };
  }

  if (rentalType === 'CHAUFFEUR' && !vehicle.chauffeurAvailable) {
    return {
      available: false,
      code: 'CHAUFFEUR_UNAVAILABLE',
      message: `${vehicle.name} is not available with a chauffeur. Please choose a self-drive booking or another vehicle.`,
    };
  }

  /* ---------------- 3. Maintenance / admin blocked periods --------------- */
  const blockingBlock = (input.blocks ?? [])
    .filter((block) => block.isBlocked && rangesOverlap(block, requested))
    .sort(byStartDate)[0];

  if (blockingBlock) {
    const reason = blockingBlock.reason?.trim();
    return {
      available: false,
      code: 'MAINTENANCE_BLOCK',
      conflict: {
        kind: 'block',
        code: 'MAINTENANCE_BLOCK',
        startDate: blockingBlock.startDate,
        endDate: blockingBlock.endDate,
        reason: reason || null,
      },
      message: `${vehicle.name} is unavailable from ${formatRange(blockingBlock)}${
        reason ? ` (${reason})` : ''
      } and cannot be booked for the selected dates. Please choose different dates or another vehicle.`,
    };
  }

  /* ---------------------- 4. Conflicting bookings ----------------------- */
  const blockingBookings = (input.bookings ?? []).filter((booking) =>
    isBookingBlocking(booking, requested, {
      pendingHold: input.pendingHold,
      now: input.now ?? new Date(),
      excludeSubmissionId: input.excludeSubmissionId,
    })
  );

  if (blockingBookings.length > 0) {
    // Report firm (non-pending) conflicts first; a temporary hold is only
    // mentioned when nothing else occupies the vehicle.
    const firm = blockingBookings.filter((booking) => booking.status !== 'PENDING');
    const conflict = (firm.length > 0 ? firm : blockingBookings).sort(byStartDate)[0];
    const isHold = conflict.status === 'PENDING';

    return {
      available: false,
      code: isHold ? 'PENDING_HOLD' : 'BOOKED_DATES',
      conflict: {
        kind: 'booking',
        code: isHold ? 'PENDING_HOLD' : 'BOOKED_DATES',
        startDate: conflict.startDate,
        endDate: conflict.endDate,
        bookingNumber: conflict.bookingNumber,
        status: conflict.status,
      },
      message: isHold
        ? `${vehicle.name} is on a temporary hold for ${formatRange(conflict)}. Please choose different dates or another vehicle, or try again later.`
        : `${vehicle.name} is already booked from ${formatRange(conflict)}. Please choose different dates or another vehicle.`,
    };
  }

  return { available: true };
}

/** HTTP status used by the REST route for a blocking decision. */
export function availabilityHttpStatus(code?: AvailabilityConflictCode): number {
  switch (code) {
    case 'BOOKED_DATES':
    case 'MAINTENANCE_BLOCK':
    case 'PENDING_HOLD':
      return 409;
    default:
      return 400;
  }
}
