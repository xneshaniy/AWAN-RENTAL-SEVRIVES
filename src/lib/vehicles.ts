import type {
  Vehicle,
  VehicleDTO,
  VehicleDetailDTO,
  AvailabilityPeriod,
} from '@/types';

/**
 * Pure helpers for the public vehicle pages.
 * All data here originates from PostgreSQL (via Prisma) - nothing is hardcoded
 * into components.
 */

/** Convert a Prisma vehicle (Decimal rates) into a client-safe DTO. */
export function toVehicleDTO(vehicle: Vehicle): VehicleDTO {
  return {
    ...vehicle,
    dailyRate: Number(vehicle.dailyRate),
    weeklyRate: vehicle.weeklyRate === null || vehicle.weeklyRate === undefined ? null : Number(vehicle.weeklyRate),
    monthlyRate: vehicle.monthlyRate === null || vehicle.monthlyRate === undefined ? null : Number(vehicle.monthlyRate),
  };
}

interface RawVehicleDetail extends Vehicle {
  availability: Array<{
    id: string;
    startDate: Date | string;
    endDate: Date | string;
    reason?: string | null;
    isBlocked: boolean;
  }>;
  bookings: Array<{
    startDate: Date | string;
    endDate: Date | string;
  }>;
}

/** Convert a vehicle with relations into the serialisable detail payload. */
export function toVehicleDetailDTO(vehicle: RawVehicleDetail): VehicleDetailDTO {
  const iso = (value: Date | string) =>
    value instanceof Date ? value.toISOString() : new Date(value).toISOString();

  return {
    ...toVehicleDTO(vehicle),
    availability: vehicle.availability.map((block) => ({
      id: block.id,
      startDate: iso(block.startDate),
      endDate: iso(block.endDate),
      reason: block.reason ?? null,
      isBlocked: block.isBlocked,
    })),
    bookings: vehicle.bookings.map((booking) => ({
      startDate: iso(booking.startDate),
      endDate: iso(booking.endDate),
    })),
  };
}

/**
 * Pricing is only shown when a real rate is configured in the database.
 * dailyRate <= 0 means "not configured" and must render "Request a Quote"
 * instead of Rs. 0.
 */
export function hasConfiguredPrice(vehicle: Pick<VehicleDTO, 'dailyRate'>): boolean {
  return Number(vehicle.dailyRate) > 0;
}

/**
 * Kilometre policy label, or null when nothing is configured.
 * Returns "Unlimited kilometres" only when the vehicle has it enabled.
 */
export function getKilometerLabel(vehicle: {
  unlimitedKilometers: boolean;
  kilometerLimit: number | null;
}): string | null {
  if (vehicle.unlimitedKilometers) return 'Unlimited kilometres';
  if (vehicle.kilometerLimit && vehicle.kilometerLimit > 0) {
    return `${vehicle.kilometerLimit} km/day included`;
  }
  return null;
}

/** Upcoming blocked/booking windows merged into one availability timeline. */
export function getUpcomingAvailabilityPeriods(
  vehicle: Pick<VehicleDetailDTO, 'availability' | 'bookings'>,
  now: Date = new Date()
): AvailabilityPeriod[] {
  const periods: AvailabilityPeriod[] = [];

  for (const block of vehicle.availability) {
    if (!block.isBlocked) continue;
    if (new Date(block.endDate) < now) continue;
    periods.push({ start: block.startDate, end: block.endDate, label: block.reason || 'Blocked' });
  }

  for (const booking of vehicle.bookings) {
    if (new Date(booking.endDate) < now) continue;
    periods.push({ start: booking.startDate, end: booking.endDate, label: 'Reserved' });
  }

  return periods.sort((a, b) => a.start.localeCompare(b.start)).slice(0, 5);
}

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

/** Format an ISO date (or ISO range) for display. */
export function formatVehicleDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date);
}

export function formatVehicleDateRange(start: string, end: string): string {
  return `${formatVehicleDate(start)} - ${formatVehicleDate(end)}`;
}

/** Humanise Prisma enum values (AUTOMATIC -> Automatic, DIESEL -> Diesel). */
export function humanizeEnum(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}
