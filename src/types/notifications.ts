/**
 * Client-safe shape of an admin notification.
 *
 * Deliberately declared here rather than in `src/lib/notifications.ts`: that
 * module imports Prisma, and importing it into a `'use client'` component
 * would drag the database driver into the browser bundle. This file has no
 * runtime imports at all, so both the server and the panel can share one
 * definition of the payload without duplicating it.
 */

/** Kept in sync with the `NotificationType` enum in prisma/schema.prisma. */
export type AdminNotificationType =
  | 'NEW_BOOKING'
  | 'BOOKING_STATUS_CHANGED'
  | 'NEW_CONTACT_MESSAGE';

export interface AdminNotification {
  id: string;
  type: AdminNotificationType;
  title: string;
  message: string;
  /** Deep link into the admin panel, e.g. `/admin/bookings/<id>`. */
  link: string | null;
  bookingId: string | null;
  contactMessageId: string | null;
  /** Small display-only extras; never a copy of the booking itself. */
  meta: unknown;
  /** ISO-8601 timestamp. */
  createdAt: string;
  read: boolean;
}

/** Live dashboard counters returned by /api/admin/dashboard-stats. */
export interface AdminDashboardStats {
  pendingBookings: number;
  newMessages: number;
  unreadNotifications: number;
}

/** Wire format of the SSE `notification` event (an `AdminNotification`). */
export type AdminNotificationEvent = AdminNotification;
