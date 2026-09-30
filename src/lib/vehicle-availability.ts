import type { Prisma, RentalType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import {
  evaluateVehicleAvailability,
  type AvailabilityDecision,
  type DateRange,
  type PendingHoldSettings,
} from '@/lib/availability';

/**
 * Database-backed availability check. Fetches the vehicle, the overlapping
 * bookings and the maintenance/admin blocks for the requested range, then
 * hands them to the pure rules in `@/lib/availability`.
 *
 * Accepts an optional Prisma client so the check can run inside the booking
 * transaction (`processBookingRequest` locks the vehicle row first, which
 * serializes concurrent requests for the same vehicle and makes the
 * check-then-insert race-free).
 */

/** Delegates shared by PrismaClient and Prisma.TransactionClient. */
type AvailabilityClient = Pick<
  Prisma.TransactionClient,
  'vehicle' | 'booking' | 'availability' | 'setting'
>;

export interface VehicleAvailabilityInput {
  vehicleId: string;
  requested: DateRange;
  /** Omit to skip rental-type capability checks (e.g. generic availability). */
  rentalType?: RentalType;
  excludeSubmissionId?: string | null;
  /** Override the persisted hold settings (tests / callers that already read them). */
  pendingHold?: PendingHoldSettings;
}

export const PENDING_HOLD_ENABLED_KEY = 'pending_booking_hold_enabled';
export const PENDING_HOLD_HOURS_KEY = 'booking_hold_hours';

/**
 * Reads the configurable temporary hold for pending bookings:
 * - `pending_booking_hold_enabled` (BOOLEAN setting, default: enabled)
 * - `booking_hold_hours` (NUMBER setting, default: 24)
 */
export async function readPendingHoldSettings(
  client: AvailabilityClient = prisma
): Promise<PendingHoldSettings> {
  const [enabledSetting, hoursSetting] = await Promise.all([
    client.setting.findUnique({ where: { key: PENDING_HOLD_ENABLED_KEY } }),
    client.setting.findUnique({ where: { key: PENDING_HOLD_HOURS_KEY } }),
  ]);

  const hours = Number.parseInt(hoursSetting?.value ?? '', 10);
  return {
    enabled: (enabledSetting?.value ?? 'true').trim().toLowerCase() !== 'false',
    hours: Number.isFinite(hours) && hours > 0 ? hours : 24,
  };
}

/**
 * Returns `{ available: true }` when the vehicle can be booked for
 * `requested`, otherwise a customer-friendly blocking decision.
 */
export async function checkVehicleAvailability(
  input: VehicleAvailabilityInput,
  client: AvailabilityClient = prisma
): Promise<AvailabilityDecision> {
  const { vehicleId, requested } = input;

  // Inclusive overlap on both sides - matches `rangesOverlap` in the rules
  // module, so same-day turnaround conflicts are caught at the query level.
  const overlap = {
    startDate: { lte: requested.endDate },
    endDate: { gte: requested.startDate },
  };

  const [vehicle, bookings, blocks, pendingHold] = await Promise.all([
    client.vehicle.findUnique({
      where: { id: vehicleId },
      select: {
        id: true,
        name: true,
        isAvailable: true,
        selfDriveAvailable: true,
        chauffeurAvailable: true,
      },
    }),
    // Any status is fetched; the pure rules decide which ones block.
    client.booking.findMany({
      where: { vehicleId, ...overlap },
      select: {
        id: true,
        bookingNumber: true,
        status: true,
        startDate: true,
        endDate: true,
        createdAt: true,
        submissionId: true,
      },
      orderBy: { startDate: 'asc' },
    }),
    client.availability.findMany({
      where: { vehicleId, isBlocked: true, ...overlap },
      select: {
        id: true,
        startDate: true,
        endDate: true,
        reason: true,
        isBlocked: true,
      },
      orderBy: { startDate: 'asc' },
    }),
    input.pendingHold ? Promise.resolve(input.pendingHold) : readPendingHoldSettings(client),
  ]);

  return evaluateVehicleAvailability({
    vehicle,
    requested,
    rentalType: input.rentalType,
    bookings,
    blocks,
    pendingHold,
    excludeSubmissionId: input.excludeSubmissionId,
  });
}
