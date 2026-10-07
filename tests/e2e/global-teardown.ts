import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { GALLERY_VEHICLE_PREFIX } from './helpers';

/**
 * Runs once after the E2E suite and returns the local development database to
 * the state it was in before the run.
 *
 * Clean-up is deliberately scoped rather than sweeping:
 *  - only bookings / contact messages whose name carries the `E2E ` marker
 *    used by `bookingPayload()` and the contact helper,
 *  - only notifications created at or after the timestamp global-setup
 *    recorded,
 *  - only the throw-away STAFF and CUSTOMER accounts global-setup created,
 *    plus the `e2e-booking-*` CUSTOMER rows the booking flow upserted for
 *    itself (those have no booking left to cascade from),
 *  - only the `E2E Gallery Probe*` vehicle the gallery upload spec created.
 *
 * Deleting a booking or a message cascades to its notifications (the foreign
 * keys added by migration `20261008130000_add_notification_fks`), and deleting
 * a user cascades to their read rows, so no orphan is left behind. The eight
 * production vehicle records are never touched by any of this.
 */
export default async function globalTeardown(): Promise<void> {
  let startedAt = '';
  try {
    const raw = readFileSync(resolve(process.cwd(), 'tests', 'e2e', '.data.json'), 'utf8');
    startedAt = (JSON.parse(raw) as { startedAt?: string }).startedAt ?? '';
  } catch {
    // No marker file (setup failed) - nothing of ours to remove.
    return;
  }

  const prisma = new PrismaClient();
  try {
    const bookings = await prisma.booking.deleteMany({
      where: { customerName: { startsWith: 'E2E ' } },
    });
    const messages = await prisma.contactMessage.deleteMany({
      where: { name: { startsWith: 'E2E ' } },
    });

    // Anything the cascade did not already take (e.g. a notification whose
    // booking insert was rolled back), bounded by the run window so a
    // pre-existing row can never be removed.
    const since = startedAt ? new Date(startedAt) : new Date(0);
    const notifications = await prisma.notification.deleteMany({
      where: { createdAt: { gte: since } },
    });

    // Both throw-away fixtures AND the CUSTOMER rows the booking flow upserts
    // for every `e2e-booking-*` address. Matching the prefix rather than two
    // exact addresses is what stops one orphan user per booking from piling up
    // in the development database across runs.
    const users = await prisma.user.deleteMany({
      where: { email: { startsWith: 'e2e-' } },
    });

    // The vehicle the gallery upload spec created. Taken last because a
    // booking holds a foreign key to its vehicle, and matched on the prefix
    // so none of the eight production records can be reached.
    const galleryVehicles = await prisma.vehicle.deleteMany({
      where: { name: { startsWith: GALLERY_VEHICLE_PREFIX } },
    });

    console.log(
      `[e2e-teardown] removed ${bookings.count} booking(s), ${messages.count} message(s), ` +
        `${notifications.count} notification(s), ${users.count} user(s), ` +
        `${galleryVehicles.count} gallery vehicle(s).`
    );
  } finally {
    await prisma.$disconnect();
  }
}
