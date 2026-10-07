import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import type { Notification, NotificationType } from '@prisma/client';
import { publishNotification } from '@/lib/notification-events';
import type { AdminNotification } from '@/types/notifications';

/**
 * In-app notifications for the Admin/Staff panel.
 *
 * Database first, transport second: a notification is persisted BEFORE it is
 * published, so a tab that was offline when the event happened still finds it
 * on the next sync, and a reconnect can never invent a duplicate - the client
 * only ever reads rows back by id.
 *
 * Nothing in here may ever throw into a caller. A booking, a status change or
 * a contact message must succeed even if the notification layer fails.
 */

export interface CreateNotificationInput {
  type: NotificationType;
  title: string;
  message: string;
  link?: string | null;
  bookingId?: string | null;
  contactMessageId?: string | null;
  meta?: Prisma.InputJsonValue;
}

/**
 * The wire shape shared with the panel. Declared once in
 * `@/types/notifications` (which has no runtime imports) so the client bundle
 * never needs to import this Prisma-touching module.
 */
export type NotificationDto = AdminNotification;

/** Both roles may see operational notifications (bookings + messages). */
export function isNotificationRole(role: string | null | undefined): boolean {
  return role === 'ADMIN' || role === 'STAFF';
}

function toDto(
  row: Pick<
    Notification,
    'id' | 'type' | 'title' | 'message' | 'link' | 'bookingId' | 'contactMessageId' | 'meta' | 'createdAt'
  >,
  read: boolean
): NotificationDto {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    message: row.message,
    link: row.link,
    bookingId: row.bookingId,
    contactMessageId: row.contactMessageId,
    meta: row.meta ?? null,
    createdAt: row.createdAt.toISOString(),
    read,
  };
}

/**
 * Persist one notification per EVENT (not per recipient) and broadcast it.
 *
 * Returns null instead of throwing: callers sit inside booking/contact flows
 * where a notification failure must never surface as a customer error.
 */
export async function createNotification(
  input: CreateNotificationInput
): Promise<NotificationDto | null> {
  try {
    const created = await prisma.notification.create({
      data: {
        type: input.type,
        title: input.title,
        message: input.message,
        link: input.link ?? null,
        bookingId: input.bookingId ?? null,
        contactMessageId: input.contactMessageId ?? null,
        // `meta` is optional; `undefined` and `null` both mean "no extras".
        // `Prisma.DbNull` is how a JSON column is explicitly written as SQL
        // NULL - a plain JS `null` is rejected by Prisma's Json input type.
        meta: input.meta ?? Prisma.DbNull,
      },
    });

    const dto = toDto(created, false);
    publishNotification({
      id: dto.id,
      type: dto.type,
      title: dto.title,
      message: dto.message,
      link: dto.link,
      bookingId: dto.bookingId,
      contactMessageId: dto.contactMessageId,
      meta: dto.meta,
      createdAt: dto.createdAt,
    });
    return dto;
  } catch (error) {
    console.error(
      '[notifications] create failed:',
      error instanceof Error ? error.message : error
    );
    return null;
  }
}

/**
 * Newest first, capped. `unread` notifications are those with no read row for
 * this user - the read state lives in the database, so it survives refreshes,
 * new tabs and reconnects.
 */
export async function listNotifications(
  userId: string,
  options: { limit?: number; unreadOnly?: boolean } = {}
): Promise<{ notifications: NotificationDto[]; unreadCount: number }> {
  const limit = Math.min(100, Math.max(1, Math.floor(options.limit ?? 20)));
  const unreadFilter: Prisma.NotificationWhereInput = { reads: { none: { userId } } };
  const where: Prisma.NotificationWhereInput = options.unreadOnly ? unreadFilter : {};

  const [rows, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        type: true,
        title: true,
        message: true,
        link: true,
        bookingId: true,
        contactMessageId: true,
        meta: true,
        createdAt: true,
        reads: { where: { userId }, select: { readAt: true } },
      },
    }),
    prisma.notification.count({ where: unreadFilter }),
  ]);

  return {
    notifications: rows.map((row) => toDto(row, row.reads.length > 0)),
    unreadCount,
  };
}

/** Single cheap indexed count - used to seed and re-sync the badge. */
export async function unreadNotificationCount(userId: string): Promise<number> {
  return prisma.notification.count({ where: { reads: { none: { userId } } } });
}

/**
 * Mark specific notifications read. `createMany({ skipDuplicates: true })`
 * makes double-clicks, retried POSTs and concurrent tabs idempotent, and the
 * composite primary key (notificationId, userId) makes a duplicate physically
 * impossible.
 */
export async function markNotificationsRead(userId: string, ids: string[]): Promise<number> {
  const unique = Array.from(
    new Set(ids.filter((id) => typeof id === 'string' && id.length > 0))
  ).slice(0, 200);
  if (unique.length === 0) return 0;

  // Only rows that actually exist; also stops a caller reading someone else's
  // ids into their own read set from creating phantom rows.
  const owned = await prisma.notification.findMany({
    where: { id: { in: unique } },
    select: { id: true },
  });
  if (owned.length === 0) return 0;

  const result = await prisma.notificationRead.createMany({
    data: owned.map((row) => ({ notificationId: row.id, userId })),
    skipDuplicates: true,
  });
  return result.count;
}

/** Mark everything currently unread as read for this user. */
export async function markAllNotificationsRead(userId: string): Promise<number> {
  const unread = await prisma.notification.findMany({
    where: { reads: { none: { userId } } },
    select: { id: true },
  });
  if (unread.length === 0) return 0;

  const result = await prisma.notificationRead.createMany({
    data: unread.map((row) => ({ notificationId: row.id, userId })),
    skipDuplicates: true,
  });
  return result.count;
}
