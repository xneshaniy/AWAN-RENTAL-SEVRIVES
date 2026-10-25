import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { GALLERY_VEHICLE_PREFIX } from './helpers';

/**
 * Runs once before the E2E suite.
 *
 * It does three things and deliberately touches NOTHING that exists for the
 * site itself:
 *
 *  1. Asserts the local ADMIN account from `prisma/seed.ts` is present, so a
 *     misconfigured database fails loudly here instead of as a confusing
 *     "wrong password" assertion later.
 *  2. Creates (or refreshes) a throw-away STAFF account. The suite needs a
 *     second, differently-privileged identity to prove that read state does
 *     not leak between users; it is removed again in global-teardown.
 *  3. Picks one active vehicle to book and writes the values every spec needs
 *     to `tests/e2e/.data.json` (git-ignored). Reading them here means no
 *     spec has to scrape the UI for an id.
 *
 * Every query goes straight to the database rather than through HTTP, so this
 * file does not depend on whether the web server has finished booting.
 */

export const STAFF_EMAIL = 'e2e-staff@example.com';
export const STAFF_PASSWORD = 'E2eStaff!2026';
export const CUSTOMER_EMAIL = 'e2e-customer@example.com';
export const CUSTOMER_PASSWORD = 'E2eCustomer!2026';

export default async function globalSetup(): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    throw new Error('ADMIN_EMAIL is not set - create .env.e2e before running the E2E suite.');
  }
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    throw new Error('ADMIN_PASSWORD is not set - create .env.e2e before running the E2E suite.');
  }

  const prisma = new PrismaClient();
  try {
    // A run that was killed before its teardown leaves E2E bookings behind,
    // and a PENDING booking holds its dates - the next run would then fail to
    // seed with a 409. Clear only the rows this suite creates; the eight
    // production vehicle records and any real booking are never touched.
    const staleBookings = await prisma.booking.deleteMany({
      where: { customerName: { startsWith: 'E2E ' } },
    });
    const staleMessages = await prisma.contactMessage.deleteMany({
      where: { name: { startsWith: 'E2E ' } },
    });
    const staleNotifications = await prisma.notification.deleteMany({});

    // Rate-limit buckets are keyed by client IP plus a window index. Rows
    // left by an earlier run inside the same hour would otherwise carry over
    // and reject legitimate test logins/bookings, because the limiter is a
    // production feature with tight budgets (5 logins / 10 min, 10 bookings /
    // hour). Clearing them here only affects this local development database;
    // the counters are transient by design and expire on their own anyway.
    const staleRateLimits = await prisma.rateLimit.deleteMany({});

    // Creating a booking upserts a CUSTOMER user for its email address. Those
    // rows have no booking to cascade from once the booking is gone, so a
    // killed run leaves one orphan per booking. Prefix match only - the local
    // admin (and every real customer) is outside `e2e-` and untouched. Runs
    // before the STAFF/CUSTOMER fixtures are created below, so re-creating
    // them afterwards is intentional, not a double delete.
    const staleUsers = await prisma.user.deleteMany({
      where: { email: { startsWith: 'e2e-' } },
    });

    // The gallery upload spec creates its OWN vehicle rather than editing any
    // of the eight production records, so a run killed before teardown leaves
    // exactly one row behind. Prefix match only: every real vehicle name is
    // outside it. Runs after the booking delete because a booking references
    // its vehicle.
    const staleGalleryVehicles = await prisma.vehicle.deleteMany({
      where: { name: { startsWith: GALLERY_VEHICLE_PREFIX } },
    });

    if (
      staleBookings.count ||
      staleMessages.count ||
      staleNotifications.count ||
      staleRateLimits.count ||
      staleUsers.count ||
      staleGalleryVehicles.count
    ) {
      console.log(
        `[e2e-setup] cleared leftovers from a previous run: ${staleBookings.count} booking(s), ` +
          `${staleMessages.count} message(s), ${staleNotifications.count} notification(s), ` +
          `${staleRateLimits.count} rate-limit bucket(s), ${staleUsers.count} user(s), ` +
          `${staleGalleryVehicles.count} gallery vehicle(s).`
      );
    }

    const admin = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (!admin) {
      throw new Error(
        `No local admin account exists for ${adminEmail}. Seed the development database first.`
      );
    }
    if (admin.role !== 'ADMIN') {
      throw new Error(`The account for ${adminEmail} has role ${admin.role}, expected ADMIN.`);
    }
    if (!admin.password) {
      throw new Error(`The account for ${adminEmail} has no password and cannot sign in.`);
    }

    // Passwords are hashed with the same cost the seed uses (bcrypt, 10+).
    const staffHash = await bcrypt.hash(STAFF_PASSWORD, 10);
    await prisma.user.upsert({
      where: { email: STAFF_EMAIL },
      update: { role: 'STAFF', password: staffHash },
      create: {
        email: STAFF_EMAIL,
        name: 'E2E Staff',
        password: staffHash,
        role: 'STAFF',
      },
    });

    // A customer exists only to prove that a non-admin role is rejected.
    const customerHash = await bcrypt.hash(CUSTOMER_PASSWORD, 10);
    await prisma.user.upsert({
      where: { email: CUSTOMER_EMAIL },
      update: { role: 'CUSTOMER', password: customerHash },
      create: {
        email: CUSTOMER_EMAIL,
        name: 'E2E Customer',
        password: customerHash,
        role: 'CUSTOMER',
      },
    });

    const vehicle = await prisma.vehicle.findFirst({
      // Same visibility rule the public booking form uses.
      where: { archivedAt: null },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    });
    if (!vehicle) {
      throw new Error('No active vehicle exists locally, so no booking can be created.');
    }

    writeFileSync(
      resolve(process.cwd(), 'tests', 'e2e', '.data.json'),
      JSON.stringify(
        {
          adminEmail,
          adminPassword,
          staffEmail: STAFF_EMAIL,
          staffPassword: STAFF_PASSWORD,
          customerEmail: CUSTOMER_EMAIL,
          customerPassword: CUSTOMER_PASSWORD,
          vehicleId: vehicle.id,
          vehicleName: vehicle.name,
          startedAt: new Date().toISOString(),
        },
        null,
        2
      ),
      'utf8'
    );
  } finally {
    await prisma.$disconnect();
  }
}
