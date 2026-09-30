import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import { randomUUID } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import {
  checkVehicleAvailability,
  readPendingHoldSettings,
} from '@/lib/vehicle-availability';
import { processBookingRequest } from '@/lib/booking';

// Tests must never hit a real mail server: `sendEmail` is best-effort and
// skips delivery entirely when SMTP is not configured.
delete process.env.SMTP_HOST;

/**
 * Server-side availability tests against the real database.
 *
 * Fixtures (created in `before`, removed in `after`). Offsets are relative to
 * today + 60 days so every requested range is in the future:
 * - Vehicle A: CONFIRMED (day 0 -> 5, 10:00-18:00 - the spec's Sep 10 -> Sep 15
 *   example), CANCELLED (day 10 -> 15), PENDING hold (day 20 -> 22, fresh) and
 *   PENDING (day 25 -> 27, created 48h ago so its hold has expired).
 * - Vehicle B: maintenance block (day 0 -> 5).
 * - Vehicle C: free.
 *
 * Everything runs server-side (`checkVehicleAvailability` / the same
 * `processBookingRequest` core used by the server action and the REST route),
 * so nothing here can be bypassed by the frontend.
 */

const HOUR_MS = 60 * 60 * 1000;

/** Test dates are 60+ days out so the schema's "future pickup" rule holds. */
function day(offset: number, time = '10:00'): Date {
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  base.setDate(base.getDate() + 60 + offset);
  const [hours, minutes] = time.split(':').map(Number);
  base.setHours(hours, minutes, 0, 0);
  return base;
}

const pad = (n: number) => String(n).padStart(2, '0');
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const hm = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

function bookingRequest(vehicleId: string, startDate: Date, endDate: Date) {
  return {
    customerName: 'Availability Tester',
    customerEmail: `av-test-guest-${randomUUID().slice(0, 8)}@example.com`,
    customerPhone: '+923001112233',
    vehicleId,
    rentalType: 'SELF_DRIVE',
    pickupLocation: 'Islamabad Airport',
    dropoffLocation: 'Blue Area, Islamabad',
    pickupDate: ymd(startDate),
    pickupTime: hm(startDate),
    returnDate: ymd(endDate),
    returnTime: hm(endDate),
    passengers: 2,
    luggage: 1,
    submissionId: randomUUID(),
  };
}

async function createTestVehicle(slug: string, licensePlate: string) {
  return prisma.vehicle.create({
    data: {
      name: `Availability Test Vehicle ${slug.slice(-1).toUpperCase()}`,
      slug,
      brand: 'Toyota',
      model: 'Corolla',
      year: 2023,
      category: 'SEDAN',
      transmission: 'AUTOMATIC',
      fuelType: 'PETROL',
      seats: 4,
      doors: 4,
      luggageCapacity: 2,
      dailyRate: 10000,
      description: 'Temporary vehicle used by the availability test suite.',
      features: [],
      images: [],
      licensePlate,
      isDemo: true,
      isAvailable: true,
      selfDriveAvailable: true,
      chauffeurAvailable: true,
    },
  });
}

const vehicleIds: string[] = [];
let countAfterFixtures = 0;

before(async () => {
  const fixtureUser = await prisma.user.upsert({
    where: { email: 'av-test-fixture@example.com' },
    update: {},
    create: { email: 'av-test-fixture@example.com', name: 'Availability Fixture', phone: '+923000000000' },
  });

  const vehicleA = await createTestVehicle('avail-test-car-a', 'AVAIL-TEST-A');
  const vehicleB = await createTestVehicle('avail-test-car-b', 'AVAIL-TEST-B');
  const vehicleC = await createTestVehicle('avail-test-car-c', 'AVAIL-TEST-C');
  vehicleIds.push(vehicleA.id, vehicleB.id, vehicleC.id);

  const baseBooking = {
    userId: fixtureUser.id,
    pickupLocation: 'Islamabad',
    dropoffLocation: 'Lahore',
    pickupTime: '10:00',
    dropoffTime: '18:00',
    dailyRate: 10000,
    totalDays: 5,
    subtotal: 50000,
    totalAmount: 56500,
    rentalType: 'SELF_DRIVE' as const,
    customerName: 'Fixture Customer',
    customerEmail: 'av-test-fixture@example.com',
    customerPhone: '+923000000000',
  };

  // Vehicle A - the spec example (Sep 10 -> Sep 15): day 0, 10:00 to day 5, 18:00.
  await prisma.booking.create({
    data: {
      ...baseBooking,
      bookingNumber: 'ARS-AVLB01',
      vehicleId: vehicleA.id,
      status: 'CONFIRMED',
      startDate: day(0),
      endDate: day(5, '18:00'),
    },
  });
  // Cancelled booking: must never block a new request.
  await prisma.booking.create({
    data: {
      ...baseBooking,
      bookingNumber: 'ARS-AVLB02',
      vehicleId: vehicleA.id,
      status: 'CANCELLED',
      startDate: day(10),
      endDate: day(15),
    },
  });
  // Fresh pending booking: holds its dates while the configurable hold is on.
  await prisma.booking.create({
    data: {
      ...baseBooking,
      bookingNumber: 'ARS-AVLB03',
      vehicleId: vehicleA.id,
      status: 'PENDING',
      startDate: day(20),
      endDate: day(22),
      submissionId: randomUUID(),
    },
  });
  // Expired pending booking (48h old, hold window is 24h): must not block.
  await prisma.booking.create({
    data: {
      ...baseBooking,
      bookingNumber: 'ARS-AVLB04',
      vehicleId: vehicleA.id,
      status: 'PENDING',
      startDate: day(25),
      endDate: day(27),
      submissionId: randomUUID(),
      createdAt: new Date(Date.now() - 48 * HOUR_MS),
    },
  });

  // Vehicle B - maintenance window (day 0 -> 5).
  await prisma.availability.create({
    data: {
      vehicleId: vehicleB.id,
      startDate: day(0),
      endDate: day(5),
      reason: 'Scheduled maintenance',
      isBlocked: true,
    },
  });

  countAfterFixtures = await prisma.booking.count({ where: { vehicleId: { in: vehicleIds } } });
});

after(async () => {
  await prisma.booking.deleteMany({ where: { vehicleId: { in: vehicleIds } } });
  await prisma.availability.deleteMany({ where: { vehicleId: { in: vehicleIds } } });
  await prisma.vehicle.deleteMany({ where: { id: { in: vehicleIds } } });
  await prisma.user.deleteMany({ where: { email: { startsWith: 'av-test-' } } });
  await prisma.$disconnect();
});

describe('checkVehicleAvailability (database)', () => {
  test('no overlap: dates after the confirmed booking are available', async () => {
    const [vehicleA] = vehicleIds;
    const decision = await checkVehicleAvailability({
      vehicleId: vehicleA,
      requested: { startDate: day(6), endDate: day(9) },
      rentalType: 'SELF_DRIVE',
    });
    assert.equal(decision.available, true);
  });

  test('partial overlap with a CONFIRMED booking is rejected', async () => {
    const [vehicleA] = vehicleIds;
    const decision = await checkVehicleAvailability({
      vehicleId: vehicleA,
      requested: { startDate: day(3), endDate: day(7) },
      rentalType: 'SELF_DRIVE',
    });
    assert.equal(decision.available, false);
    assert.equal(decision.code, 'BOOKED_DATES');
    assert.equal(decision.conflict?.status, 'CONFIRMED');
    assert.match(decision.message ?? '', /already booked/i);
    assert.doesNotMatch(decision.message ?? '', /SELECT|prisma/i);
  });

  test('full overlap (request inside the confirmed booking) is rejected', async () => {
    const [vehicleA] = vehicleIds;
    const decision = await checkVehicleAvailability({
      vehicleId: vehicleA,
      requested: { startDate: day(1), endDate: day(4) },
      rentalType: 'SELF_DRIVE',
    });
    assert.equal(decision.available, false);
    assert.equal(decision.code, 'BOOKED_DATES');
  });

  test('same-day conflict on the return day is rejected', async () => {
    const [vehicleA] = vehicleIds;
    // Existing booking ends at 18:00 on day 5; a pickup the same morning
    // (and even exactly at 18:00) still conflicts - turnaround is not free.
    for (const start of [day(5, '10:00'), day(5, '18:00')]) {
      const decision = await checkVehicleAvailability({
        vehicleId: vehicleA,
        requested: { startDate: start, endDate: day(7) },
        rentalType: 'SELF_DRIVE',
      });
      assert.equal(decision.available, false, `start ${start.toISOString()} must conflict`);
      assert.equal(decision.code, 'BOOKED_DATES');
    }
  });

  test('different vehicle: the same dates are available on another car', async () => {
    const [, , vehicleC] = vehicleIds;
    const decision = await checkVehicleAvailability({
      vehicleId: vehicleC,
      requested: { startDate: day(1), endDate: day(4) },
      rentalType: 'SELF_DRIVE',
    });
    assert.equal(decision.available, true);
  });

  test('cancelled booking does not block', async () => {
    const [vehicleA] = vehicleIds;
    // Fully inside the CANCELLED day 10-15 window (and no other conflict).
    const decision = await checkVehicleAvailability({
      vehicleId: vehicleA,
      requested: { startDate: day(11), endDate: day(14) },
      rentalType: 'SELF_DRIVE',
    });
    assert.equal(decision.available, true);
  });

  test('maintenance vehicle is rejected with a customer-friendly reason', async () => {
    const [, vehicleB, vehicleC] = vehicleIds;
    const decision = await checkVehicleAvailability({
      vehicleId: vehicleB,
      requested: { startDate: day(1), endDate: day(4) },
      rentalType: 'SELF_DRIVE',
    });
    assert.equal(decision.available, false);
    assert.equal(decision.code, 'MAINTENANCE_BLOCK');
    assert.match(decision.message ?? '', /Scheduled maintenance/);
    assert.match(decision.message ?? '', /choose/i);

    // Another vehicle stays bookable for those dates.
    const other = await checkVehicleAvailability({
      vehicleId: vehicleC,
      requested: { startDate: day(1), endDate: day(4) },
      rentalType: 'SELF_DRIVE',
    });
    assert.equal(other.available, true);
  });

  test('pending hold settings are read from the database (enabled, 24h)', async () => {
    const hold = await readPendingHoldSettings();
    assert.equal(hold.enabled, true);
    assert.equal(hold.hours, 24);
  });

  test('a fresh PENDING booking holds its dates while the hold is enabled', async () => {
    const [vehicleA] = vehicleIds;
    const decision = await checkVehicleAvailability({
      vehicleId: vehicleA,
      requested: { startDate: day(20), endDate: day(22) },
      rentalType: 'SELF_DRIVE',
    });
    assert.equal(decision.available, false);
    assert.equal(decision.code, 'PENDING_HOLD');
    assert.match(decision.message ?? '', /temporary hold/i);
  });

  test('the same PENDING booking does not block when the hold is disabled', async () => {
    const [vehicleA] = vehicleIds;
    const decision = await checkVehicleAvailability({
      vehicleId: vehicleA,
      requested: { startDate: day(20), endDate: day(22) },
      rentalType: 'SELF_DRIVE',
      pendingHold: { enabled: false, hours: 24 },
    });
    assert.equal(decision.available, true);
  });

  test('an expired PENDING booking (older than the hold window) does not block', async () => {
    const [vehicleA] = vehicleIds;
    const decision = await checkVehicleAvailability({
      vehicleId: vehicleA,
      requested: { startDate: day(25), endDate: day(27) },
      rentalType: 'SELF_DRIVE',
    });
    assert.equal(decision.available, true);
  });

  test('the customer\'s own submission never conflicts with itself', async () => {
    const [vehicleA] = vehicleIds;
    const ownPending = await prisma.booking.findFirst({
      where: { bookingNumber: 'ARS-AVLB03' },
      select: { submissionId: true },
    });
    const decision = await checkVehicleAvailability({
      vehicleId: vehicleA,
      requested: { startDate: day(20), endDate: day(22) },
      rentalType: 'SELF_DRIVE',
      excludeSubmissionId: ownPending?.submissionId ?? null,
    });
    assert.equal(decision.available, true);
  });

  test('vehicle status and rental-type capability are enforced server-side', async () => {
    const [, , vehicleC] = vehicleIds;
    const requested = { startDate: day(40), endDate: day(43) };

    await prisma.vehicle.update({ where: { id: vehicleC }, data: { selfDriveAvailable: false } });
    try {
      const selfDrive = await checkVehicleAvailability({ vehicleId: vehicleC, requested, rentalType: 'SELF_DRIVE' });
      assert.equal(selfDrive.available, false);
      assert.equal(selfDrive.code, 'SELF_DRIVE_UNAVAILABLE');

      const chauffeur = await checkVehicleAvailability({ vehicleId: vehicleC, requested, rentalType: 'CHAUFFEUR' });
      assert.equal(chauffeur.available, true);
    } finally {
      await prisma.vehicle.update({ where: { id: vehicleC }, data: { selfDriveAvailable: true } });
    }

    await prisma.vehicle.update({ where: { id: vehicleC }, data: { isAvailable: false } });
    try {
      const unavailable = await checkVehicleAvailability({ vehicleId: vehicleC, requested, rentalType: 'SELF_DRIVE' });
      assert.equal(unavailable.available, false);
      assert.equal(unavailable.code, 'VEHICLE_UNAVAILABLE');
    } finally {
      await prisma.vehicle.update({ where: { id: vehicleC }, data: { isAvailable: true } });
    }
  });
});

describe('processBookingRequest enforces availability server-side', () => {
  test('overlapping dates are rejected with HTTP 409 and a friendly error', async () => {
    const [vehicleA] = vehicleIds;
    const result = await processBookingRequest(bookingRequest(vehicleA, day(1), day(4)));

    assert.equal(result.success, false);
    assert.equal(result.status, 409);
    assert.match(result.error ?? '', /already booked/i);
    assert.match(result.error ?? '', /choose/i);
    assert.doesNotMatch(result.error ?? '', /prisma|SELECT FROM|ARS-/i);
  });

  test('same-day conflict is rejected', async () => {
    const [vehicleA] = vehicleIds;
    const result = await processBookingRequest(bookingRequest(vehicleA, day(5), day(7)));

    assert.equal(result.success, false);
    assert.equal(result.status, 409);
    assert.match(result.error ?? '', /already booked/i);
  });

  test('maintenance vehicle is rejected', async () => {
    const [, vehicleB] = vehicleIds;
    const result = await processBookingRequest(bookingRequest(vehicleB, day(1), day(4)));

    assert.equal(result.success, false);
    assert.equal(result.status, 409);
    assert.match(result.error ?? '', /unavailable/i);
  });

  test('pending hold rejects a second customer for the held dates', async () => {
    const [vehicleA] = vehicleIds;
    const result = await processBookingRequest(bookingRequest(vehicleA, day(20), day(22)));

    assert.equal(result.success, false);
    assert.equal(result.status, 409);
    assert.match(result.error ?? '', /temporary hold/i);
  });

  test('dates with no overlap are accepted and stored as PENDING', async () => {
    const [vehicleA] = vehicleIds;
    const start = day(6);
    const end = day(9);
    const request = bookingRequest(vehicleA, start, end);
    const result = await processBookingRequest(request);

    assert.equal(result.success, true, result.error);
    assert.match(result.bookingNumber ?? '', /^ARS-[A-Z0-9]{6}$/);

    const stored = await prisma.booking.findUnique({
      where: { submissionId: request.submissionId },
      select: { status: true, vehicleId: true, rentalType: true, startDate: true, endDate: true },
    });
    assert.ok(stored, 'booking must be persisted');
    assert.equal(stored.status, 'PENDING');
    assert.equal(stored.vehicleId, vehicleA);
    assert.equal(stored.rentalType, 'SELF_DRIVE');
    assert.equal(stored.startDate.getTime(), start.getTime());
    assert.equal(stored.endDate.getTime(), end.getTime());
  });

  test('cancelled booking does not prevent a new booking (no overlap after it)', async () => {
    const [vehicleA] = vehicleIds;
    const request = bookingRequest(vehicleA, day(11), day(14)); // inside the CANCELLED window
    const result = await processBookingRequest(request);

    assert.equal(result.success, true, result.error);
    assert.match(result.bookingNumber ?? '', /^ARS-[A-Z0-9]{6}$/);
  });

  test('a different vehicle can be booked for dates blocked on the first one', async () => {
    const [, , vehicleC] = vehicleIds;
    const request = bookingRequest(vehicleC, day(1), day(4)); // blocked on vehicle A
    const result = await processBookingRequest(request);

    assert.equal(result.success, true, result.error);
    assert.match(result.bookingNumber ?? '', /^ARS-[A-Z0-9]{6}$/);
  });

  test('rejections never persist a booking and successes never leak details', async () => {
    const count = await prisma.booking.count({ where: { vehicleId: { in: vehicleIds } } });
    // Fixtures (4) + exactly the three accepted requests above.
    assert.equal(count, countAfterFixtures + 3);

    const guests = await prisma.user.count({ where: { email: { startsWith: 'av-test-guest-' } } });
    assert.equal(guests, 3, 'rejected submissions must not create customer records');
  });
});
