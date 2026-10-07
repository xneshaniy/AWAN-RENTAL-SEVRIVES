import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import { randomUUID } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import {
  isNotificationRole,
  createNotification,
  listNotifications,
  markNotificationsRead,
  markAllNotificationsRead,
} from '@/lib/notifications';
import {
  subscribeToNotifications,
  publishNotification,
  notificationSubscriberCount,
} from '@/lib/notification-events';
import type { NotificationEvent } from '@/lib/notification-events';

/**
 * Server-side tests for the in-app Admin/Staff notification system.
 *
 * Scope: the data model (one row per event, per-user read state), the
 * duplicate-prevention guarantees, role gating helpers and the in-process fan
 * -out bus. Everything runs against the real database and the real bus that
 * the SSE route subscribes to - nothing here is a mock.
 *
 * Only rows this file creates are removed (`[notif-test]` marker + the two
 * fixture users). Existing production-shaped data is never touched.
 */

/** Marks every row this suite creates so cleanup can never over-reach. */
const MARKER = '[notif-test]';
const suffix = randomUUID().slice(0, 8);
const EMAIL_A = `notif-a-${suffix}@example.com`;
const EMAIL_B = `notif-b-${suffix}@example.com`;

let userA = '';
let userB = '';

before(async () => {
  const [a, b] = await Promise.all([
    prisma.user.create({
      data: { email: EMAIL_A, name: 'Notify Tester A', role: 'ADMIN' },
    }),
    prisma.user.create({
      data: { email: EMAIL_B, name: 'Notify Tester B', role: 'STAFF' },
    }),
  ]);
  userA = a.id;
  userB = b.id;
});

after(async () => {
  // Children first (FK order): reads, then notifications, then the records
  // they pointed at, then this file's fixture users. Nothing else is touched.
  await prisma.notificationRead.deleteMany({ where: { userId: { in: [userA, userB] } } });
  await prisma.notification.deleteMany({ where: { title: { startsWith: MARKER } } });
  await prisma.contactMessage.deleteMany({ where: { subject: { startsWith: MARKER } } });
  await prisma.booking.deleteMany({ where: { customerName: 'Cascade Tester' } });
  await prisma.user.deleteMany({ where: { email: { startsWith: 'cascade-bk-' } } });
  await prisma.user.deleteMany({ where: { id: { in: [userA, userB] } } });
});

async function unreadFor(userId: string) {
  return prisma.notification.count({ where: { reads: { none: { userId } } } });
}

describe('notification role gating', () => {
  test('ADMIN and STAFF are allowed; everyone else is not', () => {
    assert.equal(isNotificationRole('ADMIN'), true);
    assert.equal(isNotificationRole('STAFF'), true);
  });

  test('CUSTOMER, anonymous and unknown roles are rejected', () => {
    assert.equal(isNotificationRole('CUSTOMER'), false);
    assert.equal(isNotificationRole(null), false);
    assert.equal(isNotificationRole(undefined), false);
    assert.equal(isNotificationRole(''), false);
    assert.equal(isNotificationRole('guest'), false);
  });
});

describe('in-process event bus', () => {
  test('publish reaches every current subscriber', () => {
    const received: NotificationEvent[] = [];
    const offA = subscribeToNotifications((e) => received.push(e));
    const offB = subscribeToNotifications((e) => received.push(e));
    try {
      publishNotification({
        id: 'bus-1',
        type: 'NEW_BOOKING',
        title: 't',
        message: 'm',
        link: null,
        bookingId: null,
        contactMessageId: null,
        meta: null,
        createdAt: new Date().toISOString(),
      });
      assert.equal(received.length, 2, 'both subscribers must receive the event');
    } finally {
      offA();
      offB();
    }
  });

  test('unsubscribe stops delivery (no leaked listeners)', () => {
    const off = subscribeToNotifications(() => undefined);
    const before = notificationSubscriberCount();
    off();
    off(); // idempotent - calling twice must not throw
    assert.equal(notificationSubscriberCount(), before - 1);
  });
});

describe('notification persistence', () => {
  test('createNotification stores one row and broadcasts that exact id', async () => {
    const events: NotificationEvent[] = [];
    const off = subscribeToNotifications((e) => events.push(e));
    try {
      const created = await createNotification({
        type: 'NEW_BOOKING',
        title: `${MARKER} New Booking ARS-TEST01`,
        message: 'Ada Lovelace booked Toyota Corolla',
        link: '/admin/bookings/x',
        bookingId: null,
        meta: { bookingNumber: 'ARS-TEST01' },
      });

      assert.ok(created, 'must return the created notification');
      assert.equal(created.read, false, 'a new notification starts unread');
      assert.equal(events.length, 1, 'exactly one broadcast per event');
      assert.equal(events[0].id, created.id, 'broadcast id must match the stored row');

      const rows = await prisma.notification.count({
        where: { title: `${MARKER} New Booking ARS-TEST01` },
      });
      assert.equal(rows, 1, 'a single event must produce a single row');
    } finally {
      off();
    }
  });

  test('createNotification never throws into the caller', async () => {
    // Invalid enum value forces a real database error; the booking/contact
    // flows depend on this returning null instead of rejecting.
    const result = await createNotification({
      type: 'NOT_A_REAL_TYPE' as never,
      title: `${MARKER} doomed`,
      message: 'should not persist',
    });
    assert.equal(result, null);
    const rows = await prisma.notification.count({ where: { title: `${MARKER} doomed` } });
    assert.equal(rows, 0);
  });

  test('listNotifications returns newest first with a working limit', async () => {
    const titles = ['one', 'two', 'three'];
    for (const t of titles) {
      await createNotification({
        type: 'NEW_CONTACT_MESSAGE',
        title: `${MARKER} ${t}`,
        message: 'msg',
      });
      // Distinct millisecond timestamps, otherwise rows created in the same
      // tick have no deterministic relative order to assert against.
      await new Promise((resolve) => setTimeout(resolve, 5));
    }

    const { notifications } = await listNotifications(userA, { limit: 100 });
    const mine = notifications.filter((n) => n.title.startsWith(MARKER));
    assert.equal(mine.length >= 3, true);

    const order = mine.map((n) => n.title);
    assert.ok(
      order.indexOf(`${MARKER} three`) < order.indexOf(`${MARKER} one`),
      'newest item must come before the oldest'
    );

    // Whole list must be monotonically newest-first.
    for (let i = 1; i < notifications.length; i++) {
      const prev = Date.parse(notifications[i - 1].createdAt);
      const cur = Date.parse(notifications[i].createdAt);
      assert.ok(cur <= prev, `expected newest-first ordering at index ${i}`);
    }

    const limited = await listNotifications(userA, { limit: 1 });
    assert.equal(limited.notifications.length, 1);
  });
});

describe('per-user read state and duplicate prevention', () => {
  test('reading is per user: one user reads, the other stays unread', async () => {
    const created = await createNotification({
      type: 'NEW_BOOKING',
      title: `${MARKER} shared event`,
      message: 'shared',
    });
    assert.ok(created);

    const beforeA = await unreadFor(userA);
    const beforeB = await unreadFor(userB);

    const marked = await markNotificationsRead(userA, [created.id]);
    assert.equal(marked, 1);

    assert.equal(await unreadFor(userA), beforeA - 1, 'reader lost one unread');
    assert.equal(await unreadFor(userB), beforeB, 'other user is unaffected');
  });

  test('marking the same notification twice creates no duplicate read row', async () => {
    const created = await createNotification({
      type: 'BOOKING_STATUS_CHANGED',
      title: `${MARKER} repeat read`,
      message: 'x',
    });
    assert.ok(created);

    await markNotificationsRead(userA, [created.id]);
    const second = await markNotificationsRead(userA, [created.id]);
    assert.equal(second, 0, 'second attempt must be a no-op');

    const rows = await prisma.notificationRead.count({
      where: { notificationId: created.id, userId: userA },
    });
    assert.equal(rows, 1, 'composite primary key prevents a second row');
  });

  test('reconnect/refresh style re-reads never create a second notification', async () => {
    const created = await createNotification({
      type: 'NEW_BOOKING',
      title: `${MARKER} no dup on resync`,
      message: 'x',
    });
    assert.ok(created);

    // Simulates the client re-syncing after a reconnect: pure reads.
    const first = await listNotifications(userA, { limit: 50 });
    const second = await listNotifications(userA, { limit: 50 });
    assert.equal(first.unreadCount, second.unreadCount);

    const rows = await prisma.notification.count({
      where: { title: `${MARKER} no dup on resync` },
    });
    assert.equal(rows, 1, 're-reading must not multiply the event');
  });

  test('markAllRead clears everything and is idempotent', async () => {
    for (const n of ['a', 'b', 'c']) {
      await createNotification({
        type: 'NEW_CONTACT_MESSAGE',
        title: `${MARKER} bulk ${n}`,
        message: 'x',
      });
    }

    assert.ok((await unreadFor(userA)) > 0, 'fixture should start with unread items');
    await markAllNotificationsRead(userA);
    assert.equal(await unreadFor(userA), 0);

    const again = await markAllNotificationsRead(userA);
    assert.equal(again, 0, 'second run has nothing left to mark');
    assert.equal(await unreadFor(userA), 0);
  });

  test('unreadOnly returns only unread rows for that user', async () => {
    await createNotification({
      type: 'NEW_BOOKING',
      title: `${MARKER} unread only`,
      message: 'x',
    });
    const before = await listNotifications(userA, { unreadOnly: true, limit: 100 });
    assert.ok(before.notifications.length > 0);
    assert.ok(before.notifications.every((n) => n.read === false));

    await markAllNotificationsRead(userA);
    const afterRead = await listNotifications(userA, { unreadOnly: true, limit: 100 });
    assert.equal(afterRead.notifications.length, 0, 'no unread rows remain');
    assert.equal(afterRead.unreadCount, 0);
  });

  test('unknown ids are ignored rather than creating phantom reads', async () => {
    const marked = await markNotificationsRead(userA, ['does-not-exist', '', null as never]);
    assert.equal(marked, 0);
    const phantom = await prisma.notificationRead.count({
      where: { notificationId: 'does-not-exist' },
    });
    assert.equal(phantom, 0);
  });
});

describe('notification lifecycle follows its subject record', () => {
  test('deleting a contact message removes its notification (no dead link)', async () => {
    const message = await prisma.contactMessage.create({
      data: {
        name: 'Cascade Tester',
        email: 'cascade@example.com',
        phone: '+923000000000',
        subject: `${MARKER} cascade`,
        message: 'body',
      },
    });
    const created = await createNotification({
      type: 'NEW_CONTACT_MESSAGE',
      title: `${MARKER} cascade link`,
      message: 'x',
      link: `/admin/messages/${message.id}`,
      contactMessageId: message.id,
    });
    assert.ok(created);
    assert.equal(
      await prisma.notification.count({ where: { id: created.id } }),
      1,
      'notification exists while its message does'
    );

    await prisma.contactMessage.delete({ where: { id: message.id } });

    assert.equal(
      await prisma.notification.count({ where: { id: created.id } }),
      0,
      'ON DELETE CASCADE must remove the now-orphaned notification'
    );
  });

  test('deleting a booking removes its notification (no dead link)', async () => {
    const user = await prisma.user.create({
      data: { email: `cascade-bk-${suffix}@example.com`, name: 'Cascade Booking Guest' },
    });
    // Any one of the eight seeded vehicles is fine as the FK target; the row
    // is removed again in the same test and never touches vehicle data.
    const vehicle = await prisma.vehicle.findFirstOrThrow({ select: { id: true } });
    const past = new Date('2020-01-05T10:00:00.000Z');
    const pastEnd = new Date('2020-01-08T10:00:00.000Z');

    const booking = await prisma.booking.create({
      data: {
        bookingNumber: `ARS-CAS${suffix.slice(0, 4).toUpperCase()}`,
        userId: user.id,
        vehicleId: vehicle.id,
        status: 'PENDING',
        startDate: past,
        endDate: pastEnd,
        pickupLocation: 'Cascade Test Pickup',
        dropoffLocation: 'Cascade Test Dropoff',
        pickupTime: '10:00',
        dropoffTime: '10:00',
        dailyRate: 10000,
        totalDays: 3,
        subtotal: 30000,
        tax: 0,
        totalAmount: 30000,
        rentalType: 'SELF_DRIVE',
        customerName: 'Cascade Tester',
        customerEmail: 'cascade@example.com',
      },
    });

    const created = await createNotification({
      type: 'NEW_BOOKING',
      title: `${MARKER} booking cascade`,
      message: 'x',
      link: `/admin/bookings/${booking.id}`,
      bookingId: booking.id,
    });
    assert.ok(created);
    assert.equal(await prisma.notification.count({ where: { id: created.id } }), 1);

    await prisma.booking.delete({ where: { id: booking.id } });

    assert.equal(
      await prisma.notification.count({ where: { id: created.id } }),
      0,
      'booking deletion must cascade to its notification'
    );
    await prisma.user.delete({ where: { id: user.id } });
  });
});
