import type { BookingStatus } from '@prisma/client';

/**
 * Allowed booking status transitions. Invalid transitions are rejected both
 * in the admin UI (buttons are not rendered) and on the server (the action
 * and the API handler refuse to write them).
 */
export const BOOKING_STATUS_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['ACTIVE', 'CANCELLED', 'NO_SHOW'],
  ACTIVE: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
};

/** Human labels for booking statuses. */
export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  ACTIVE: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  NO_SHOW: 'No Show',
};

/** Action label for a transition button, e.g. CONFIRMED -> "Confirm Booking". */
export const BOOKING_TRANSITION_ACTION_LABELS: Record<BookingStatus, string> = {
  PENDING: 'Cancel Booking',
  CONFIRMED: 'Confirm Booking',
  ACTIVE: 'Mark In Progress',
  COMPLETED: 'Mark Completed',
  CANCELLED: 'Cancel Booking',
  NO_SHOW: 'Mark No Show',
};

/** True when moving from `from` to `to` is a legal transition. */
export function canTransition(from: BookingStatus, to: BookingStatus): boolean {
  return BOOKING_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}
