import { Prisma, Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { bookingSchema } from '@/lib/validations';
import type { BookingInput } from '@/lib/validations';
import { availabilityHttpStatus, type AvailabilityDecision } from '@/lib/availability';
import { checkVehicleAvailability } from '@/lib/vehicle-availability';
import {
  generateBookingNumber,
  calculateBookingTotal,
  calculateDaysBetween,
  formatDate,
} from '@/lib/utils';
import {
  sendEmail,
  generateBookingEmailHtml,
  generateAdminBookingNotificationHtml,
} from '@/lib/email';
import { getBookingWhatsAppMessage, getWhatsAppUrl } from '@/lib/whatsapp';
import { getSetting } from '@/lib/settings';

export interface BookingRequestResult {
  success: boolean;
  bookingNumber?: string;
  /** Pre-built WhatsApp deep link, or null when WhatsApp is not configured. */
  whatsappUrl?: string | null;
  message?: string;
  /** Safe, user-facing error. Never contains credentials or stack traces. */
  error?: string;
  fieldErrors?: Record<string, string[]>;
  /** Suggested HTTP status for REST callers (server actions ignore it). */
  status?: number;
}

/** True when the error is a Prisma unique-constraint violation (P2002). */
function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
  );
}

/** Builds the safe success payload for a booking reference. */
async function buildSuccess(
  bookingNumber: string,
  data: {
    customerName: string;
    customerPhone: string;
    vehicleName: string;
    rentalType: BookingInput['rentalType'];
    pickupLocation: string;
    dropoffLocation: string;
    pickupDate: string;
    returnDate: string;
    passengers: number;
    specialRequests?: string;
  },
  message: string
): Promise<BookingRequestResult> {
  const whatsappMessage = await getBookingWhatsAppMessage({
    bookingNumber,
    customerName: data.customerName,
    customerPhone: data.customerPhone,
    vehicleName: data.vehicleName,
    rentalType: data.rentalType,
    pickupLocation: data.pickupLocation,
    dropoffLocation: data.dropoffLocation,
    pickupDate: formatDate(data.pickupDate),
    returnDate: formatDate(data.returnDate),
    passengers: data.passengers,
    specialRequests: data.specialRequests,
  });

  return {
    success: true,
    bookingNumber,
    whatsappUrl: getWhatsAppUrl(whatsappMessage),
    message,
    status: 200,
  };
}

/**
 * Core booking submission pipeline, shared by the `createBooking` server
 * action and the `POST /api/bookings` route so both enforce identical rules:
 *
 * 1. Full Zod validation on the server - client-side validation is never trusted.
 * 2. Honeypot field must be empty (enforced by `bookingSchema`).
 * 3. Vehicle must exist, be available, and have configured pricing.
 * 4. Duplicate submission protection via the `submissionId` idempotency key.
 * 5. Server-side availability (never client-only): overlapping CONFIRMED/ACTIVE
 *    bookings, maintenance blocks, vehicle status, rental-type capability and
 *    the configurable temporary hold for PENDING bookings - all evaluated
 *    inside the booking transaction, which locks the vehicle row first so
 *    concurrent requests for the same vehicle are serialized.
 * 6. Unique ARS-XXXXXX booking reference (DB unique constraint + retry).
 * 7. Initial status is always PENDING.
 * 8. Best-effort notification emails (never fail the stored booking).
 * 9. Safe responses only - no credentials, stack traces, or raw DB errors.
 */
export async function processBookingRequest(input: unknown): Promise<BookingRequestResult> {
  /* ---------------------- 1. Server-side validation ---------------------- */
  const validated = bookingSchema.safeParse(input);

  if (!validated.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const error of validated.error.errors) {
      const path = error.path.join('.');
      if (!fieldErrors[path]) fieldErrors[path] = [];
      fieldErrors[path].push(error.message);
    }
    return { success: false, error: 'Validation failed', fieldErrors, status: 400 };
  }

  // Honeypot trips the schema refine above, so reaching here means it was empty.
  const { honeypot: _honeypot, submissionId, ...bookingData } = validated.data;

  try {
    /* ------------------------- 2. Vehicle checks ------------------------- */
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: bookingData.vehicleId },
      select: {
        id: true,
        name: true,
        dailyRate: true,
        weeklyRate: true,
        monthlyRate: true,
        isAvailable: true,
      },
    });

    if (!vehicle) {
      return { success: false, error: 'Vehicle not found', status: 400 };
    }

    if (!vehicle.isAvailable) {
      return {
        success: false,
        error: 'This vehicle is currently not available',
        status: 400,
      };
    }

    // Quote-only vehicles (dailyRate <= 0 / not configured): never create a
    // Rs. 0 booking - direct the customer to the quote flow instead.
    if (Number(vehicle.dailyRate) <= 0) {
      return {
        success: false,
        error: 'Pricing for this vehicle is not configured yet. Please request a quote instead.',
        status: 400,
      };
    }

    /* ------------------------- 3. Date checks ---------------------------- */
    const pickupDateTime = new Date(`${bookingData.pickupDate}T${bookingData.pickupTime}`);
    const returnDateTime = new Date(`${bookingData.returnDate}T${bookingData.returnTime}`);

    if (isNaN(pickupDateTime.getTime()) || isNaN(returnDateTime.getTime())) {
      return {
        success: false,
        error: 'Invalid pickup or return date/time',
        fieldErrors: { returnDate: ['Invalid pickup or return date/time'] },
        status: 400,
      };
    }

    // Date-range availability is NOT checked here: it runs authoritatively
    // inside the booking transaction below (step 6), after the vehicle row is
    // locked, so a parallel submission cannot slip through the gap.

    /* ------------- 4. Duplicate submission protection (idempotency) ------- */
    if (submissionId) {
      const existing = await prisma.booking.findUnique({
        where: { submissionId },
        select: { bookingNumber: true },
      });
      if (existing) {
        // Same submission retried (double-click / network retry): return the
        // booking that already exists instead of creating a duplicate.
        return buildSuccess(existing.bookingNumber, { ...bookingData, vehicleName: vehicle.name }, 'Booking request received.');
      }
    }

    /* ------------------------- 5. Pricing -------------------------------- */
    const totalDays = calculateDaysBetween(pickupDateTime, returnDateTime);
    const { subtotal, total } = calculateBookingTotal(
      Number(vehicle.dailyRate),
      totalDays,
      vehicle.weeklyRate ? Number(vehicle.weeklyRate) : undefined,
      vehicle.monthlyRate ? Number(vehicle.monthlyRate) : undefined,
      bookingData.rentalType === 'CHAUFFEUR' ? 5000 : undefined,
      bookingData.rentalType === 'CHAUFFEUR' ? totalDays : undefined
    );

    const tax = Math.round(subtotal * 0.13);
    const totalAmount = subtotal + tax;

    /* ------ 6. Availability check + persist (serialized per vehicle) ------ */
    // Everything that decides "may this vehicle be booked" and writes the row
    // runs in one transaction. The FOR UPDATE lock on the vehicle row
    // serializes concurrent submissions for the same vehicle, so the
    // server-side availability check can never race a parallel insert.
    let bookingNumber: string | null = null;
    let replayReference: string | null = null;
    let unavailable: AvailabilityDecision | null = null;

    for (
      let attempt = 0;
      attempt < 5 && !bookingNumber && !replayReference && !unavailable;
      attempt++
    ) {
      try {
        const outcome = await prisma.$transaction(
          async (tx) => {
            await tx.$queryRaw`SELECT id FROM vehicles WHERE id = ${vehicle.id} FOR UPDATE`;

            // A concurrent retry of the same submission may have won the race.
            if (submissionId) {
              const existing = await tx.booking.findUnique({
                where: { submissionId },
                select: { bookingNumber: true },
              });
              if (existing) {
                return { kind: 'replay' as const, bookingNumber: existing.bookingNumber };
              }
            }

            // Authoritative availability check: date-range conflicts, vehicle
            // status, maintenance blocks, rental-type capability (self-drive /
            // chauffeur) and the configurable pending-booking hold.
            const availability = await checkVehicleAvailability(
              {
                vehicleId: vehicle.id,
                requested: { startDate: pickupDateTime, endDate: returnDateTime },
                rentalType: bookingData.rentalType,
                excludeSubmissionId: submissionId || null,
              },
              tx
            );
            if (!availability.available) {
              return { kind: 'unavailable' as const, availability };
            }

            // Guest user (FK on Booking.userId) - re-use the customer's email
            // so repeat guests resolve to the same account.
            const guestUser = await tx.user.upsert({
              where: { email: bookingData.customerEmail },
              update: {},
              create: {
                email: bookingData.customerEmail,
                name: bookingData.customerName,
                phone: bookingData.customerPhone,
                role: Role.CUSTOMER,
              },
            });

            const created = await tx.booking.create({
              data: {
                bookingNumber: generateBookingNumber(), // ARS-XXXXXX
                submissionId: submissionId || null,
                userId: guestUser.id,
                vehicleId: vehicle.id,
                status: 'PENDING', // every new booking starts as PENDING
                rentalType: bookingData.rentalType,
                startDate: pickupDateTime,
                endDate: returnDateTime,
                pickupLocation: bookingData.pickupLocation,
                dropoffLocation: bookingData.dropoffLocation,
                pickupTime: bookingData.pickupTime,
                dropoffTime: bookingData.returnTime,
                customerName: bookingData.customerName,
                customerEmail: bookingData.customerEmail,
                customerPhone: bookingData.customerPhone,
                customerWhatsApp: bookingData.customerWhatsApp || null,
                flightNumber: bookingData.flightNumber || null,
                passengers: bookingData.passengers,
                luggage: bookingData.luggage ?? 0,
                dailyRate: vehicle.dailyRate,
                totalDays,
                subtotal,
                tax,
                totalAmount,
                paymentStatus: 'UNPAID',
                specialRequests: bookingData.specialRequests,
                driverRequired: bookingData.rentalType === 'CHAUFFEUR',
                driverRate: bookingData.rentalType === 'CHAUFFEUR' ? 5000 : null,
              },
            });

            return { kind: 'created' as const, bookingNumber: created.bookingNumber };
          },
          { timeout: 10_000 } // allows waiting behind a concurrent vehicle lock
        );

        if (outcome.kind === 'unavailable') {
          unavailable = outcome.availability;
        } else if (outcome.kind === 'replay') {
          replayReference = outcome.bookingNumber;
        } else {
          bookingNumber = outcome.bookingNumber;
        }
      } catch (error) {
        if (!isUniqueViolation(error)) throw error;

        // Duplicate submission race: another request with the same id won.
        if (submissionId) {
          const existing = await prisma.booking.findUnique({
            where: { submissionId },
            select: { bookingNumber: true },
          });
          if (existing) {
            replayReference = existing.bookingNumber;
          }
        }

        // Otherwise it was a bookingNumber collision - retry with a new reference.
      }
    }

    /* ----------- 7. Availability rejection (safe customer error) ---------- */
    if (unavailable) {
      return {
        success: false,
        error: unavailable.message || 'The selected vehicle is not available for the selected dates.',
        status: availabilityHttpStatus(unavailable.code),
      };
    }

    if (replayReference) {
      // Duplicate replay: the booking already exists, so skip re-notifications.
      return buildSuccess(replayReference, { ...bookingData, vehicleName: vehicle.name }, 'Booking request received.');
    }

    if (!bookingNumber) {
      throw new Error('Could not allocate a unique booking reference');
    }

    /* ------------------ 8. Best-effort notification emails ---------------- */
    // Both sends run in parallel with short SMTP timeouts; any failure is
    // logged and swallowed so it can never affect the stored booking.
    try {
      const adminEmail = (await getSetting('admin_email')) || process.env.ADMIN_EMAIL;
      const notifications: Promise<boolean>[] = [];

      if (adminEmail) {
        notifications.push(
          sendEmail({
            to: adminEmail,
            subject: `New Booking Received: ${bookingNumber} - ${vehicle.name}`,
            html: generateAdminBookingNotificationHtml({
              bookingNumber,
              customerName: bookingData.customerName,
              customerEmail: bookingData.customerEmail,
              customerPhone: bookingData.customerPhone,
              customerWhatsApp: bookingData.customerWhatsApp || bookingData.customerPhone,
              vehicleName: vehicle.name,
              rentalType: bookingData.rentalType,
              pickupLocation: bookingData.pickupLocation,
              dropoffLocation: bookingData.dropoffLocation,
              pickupDate: formatDate(bookingData.pickupDate),
              returnDate: formatDate(bookingData.returnDate),
              passengers: bookingData.passengers,
              totalAmount: Number(totalAmount),
              specialRequests: bookingData.specialRequests,
            }),
          })
        );
      }

      notifications.push(
        sendEmail({
          to: bookingData.customerEmail,
          subject: 'Your Awan Rental Service Booking Request',
          html: generateBookingEmailHtml({
          bookingNumber,
          customerName: bookingData.customerName,
          vehicleName: vehicle.name,
          rentalType: bookingData.rentalType,
          pickupLocation: bookingData.pickupLocation,
          dropoffLocation: bookingData.dropoffLocation,
          pickupDate: formatDate(bookingData.pickupDate),
          returnDate: formatDate(bookingData.returnDate),
          passengers: bookingData.passengers,
          totalAmount: Number(totalAmount),
          specialRequests: bookingData.specialRequests,
          }),
        })
      );

      await Promise.allSettled(notifications);
    } catch (emailError) {
      // The booking is already stored - email issues must never fail it.
      console.error('Booking notification email failed:', emailError);
    }

    return buildSuccess(bookingNumber, { ...bookingData, vehicleName: vehicle.name }, 'Booking request received.');
  } catch (error) {
    // Log server-side only; the response stays generic (no credentials/stack).
    console.error('Booking creation error:', error);
    return {
      success: false,
      error: 'Failed to create booking. Please try again.',
      status: 500,
    };
  }
}

/* ------------------------------------------------------------------ *
 * Public booking receipt (/booking/success/[reference])
 * ------------------------------------------------------------------ */

/** References look like ARS-XXXXXX (6 chars from A-Z0-9, see generateBookingNumber). */
const BOOKING_REFERENCE_PATTERN = /^ARS-[A-Z0-9]{6}$/;

/**
 * Normalises a reference taken from the URL (trimmed + uppercased).
 * Returns null when the shape is not a valid booking reference so callers can
 * show an "invalid reference" state without touching the database.
 */
export function normalizeBookingReference(raw: string): string | null {
  const reference = (raw ?? '').trim().toUpperCase();
  return BOOKING_REFERENCE_PATTERN.test(reference) ? reference : null;
}

/**
 * The subset of a booking that is safe to publish on the public receipt page.
 * Deliberately excludes internal identifiers (id, userId, vehicleId,
 * submissionId), user/payment records, contact details beyond the customer
 * name, financials, and any admin-only columns (notes, cancellation reasons,
 * transaction ids).
 */
export interface BookingReceipt {
  bookingNumber: string;
  customerName: string | null;
  customerPhone: string | null;
  vehicleName: string;
  rentalType: string;
  pickupLocation: string;
  dropoffLocation: string;
  startDate: Date;
  endDate: Date;
  passengers: number | null;
  specialRequests: string | null;
}

/**
 * Loads a booking receipt by its ARS-XXXXXX reference using an explicit
 * column whitelist — nothing internal is ever selected. Returns null when the
 * reference is malformed or no booking exists. Throws only on database
 * failures, which the route's error boundary turns into a friendly error state.
 */
export async function getBookingReceipt(reference: string): Promise<BookingReceipt | null> {
  const normalized = normalizeBookingReference(reference);
  if (!normalized) return null;

  const booking = await prisma.booking.findUnique({
    where: { bookingNumber: normalized },
    select: {
      bookingNumber: true,
      customerName: true,
      customerPhone: true,
      rentalType: true,
      pickupLocation: true,
      dropoffLocation: true,
      startDate: true,
      endDate: true,
      passengers: true,
      specialRequests: true,
      vehicle: { select: { name: true } },
    },
  });

  if (!booking) return null;

  return {
    bookingNumber: booking.bookingNumber,
    customerName: booking.customerName,
    customerPhone: booking.customerPhone,
    vehicleName: booking.vehicle.name,
    rentalType: booking.rentalType,
    pickupLocation: booking.pickupLocation,
    dropoffLocation: booking.dropoffLocation,
    startDate: booking.startDate,
    endDate: booking.endDate,
    passengers: booking.passengers,
    specialRequests: booking.specialRequests,
  };
}
