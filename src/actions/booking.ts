'use server';

import { requireStaffAccess, requireAdminAccess } from '@/lib/admin-auth';

import { prisma } from '@/lib/prisma';
import type { BookingInput } from '@/lib/validations';
import { processBookingRequest } from '@/lib/booking';
import { canTransition } from '@/lib/booking-status';
import { pickSortBy, pickSortOrder } from '@/lib/utils';
import { rateLimit, clientIpFromHeaders } from '@/lib/rate-limit';
import { headers } from 'next/headers';
import { BookingStatus, PaymentStatus } from '@prisma/client';

interface BookingActionResult {
  success: boolean;
  bookingNumber?: string;
  /** Pre-built WhatsApp deep link, or null when WhatsApp is not configured. */
  whatsappUrl?: string | null;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

/**
 * Creates a booking request. All rules (server-side Zod validation,
 * honeypot, vehicle checks, duplicate submission protection, unique
 * ARS-XXXXXX reference, PENDING status, safe responses) live in the shared
 * `processBookingRequest` core so the REST route behaves identically.
 */
export async function createBooking(data: BookingInput): Promise<BookingActionResult> {
  // Spam guard: a handful of booking attempts per IP per hour is far more
  // than a genuine customer submits. Everything else (Zod, honeypot,
  // vehicle checks) lives in the shared core.
  const ip = clientIpFromHeaders(headers());
  if (!rateLimit(`booking:${ip}`, { limit: 10, windowMs: 60 * 60 * 1000 })) {
    return {
      success: false,
      error: 'Too many booking attempts from your network. Please try again later.',
    };
  }
  return processBookingRequest(data);
}

export async function getBookingByReference(bookingNumber: string) {
  await requireStaffAccess();
  return prisma.booking.findUnique({
    where: { bookingNumber },
    include: {
      vehicle: true,
      user: { select: { id: true, name: true, email: true, phone: true } },
      payments: true,
      documents: true,
    },
  });
}

export async function getBookings(filters: {
  status?: BookingStatus;
  startDate?: Date;
  endDate?: Date;
  vehicleId?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
} = {}) {
  await requireStaffAccess();
  const { status, startDate, endDate, vehicleId, search, page = 1, limit = 20, sortBy, sortOrder } = filters;
  // Server actions are directly invocable: whitelist sort input server-side.
  const safeSortBy = pickSortBy(sortBy, ['createdAt', 'updatedAt', 'startDate', 'totalAmount', 'status', 'bookingNumber'] as const, 'createdAt');
  const safeSortOrder = pickSortOrder(sortOrder);
  // Bound pagination server-side: a directly-invoked action must not be
  // able to request an unbounded page.
  const safePage = Math.max(1, Math.floor(Number(page)) || 1);
  const safeLimit = Math.min(100, Math.max(1, Math.floor(Number(limit)) || 20));

  const where: Record<string, unknown> = {};

  if (status) where.status = status;
  if (vehicleId) where.vehicleId = vehicleId;
  if (startDate || endDate) {
    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (startDate) dateFilter.gte = startDate;
    if (endDate) dateFilter.lte = endDate;
    where.startDate = dateFilter;
  }
  if (search) {
    where.OR = [
      { bookingNumber: { contains: search, mode: 'insensitive' } },
      { customerName: { contains: search, mode: 'insensitive' } },
      { customerEmail: { contains: search, mode: 'insensitive' } },
      { customerPhone: { contains: search, mode: 'insensitive' } },
      { vehicle: { name: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        vehicle: { select: { id: true, name: true, brand: true, model: true, images: true } },
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
      orderBy: { [safeSortBy]: safeSortOrder },
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
    }),
    prisma.booking.count({ where }),
  ]);

  return {
    data: bookings,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
    },
  };
}

interface BookingMutationResult {
  success: boolean;
  error?: string;
  status?: BookingStatus;
}

/**
 * Change a booking's status. The transition is validated against
 * BOOKING_STATUS_TRANSITIONS and written atomically (the UPDATE only applies
 * if the row still has the status we validated against), so invalid or
 * conflicting transitions can never reach PostgreSQL.
 */
export async function updateBookingStatus(
  bookingId: string,
  status: BookingStatus
): Promise<BookingMutationResult> {
  await requireStaffAccess();

  const current = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { status: true },
  });
  if (!current) {
    return { success: false, error: 'Booking not found' };
  }
  if (current.status === status) {
    return { success: false, error: `Booking is already ${status}` };
  }
  if (!canTransition(current.status, status)) {
    return {
      success: false,
      error: `Invalid status change: ${current.status} cannot move to ${status}`,
    };
  }

  const updateData: Record<string, unknown> = { status };
  if (status === 'CONFIRMED') updateData.confirmedAt = new Date();
  if (status === 'COMPLETED') updateData.completedAt = new Date();
  if (status === 'CANCELLED') updateData.cancelledAt = new Date();

  // Atomic guard: only overwrite if the status is still the one we checked.
  const updated = await prisma.booking.updateMany({
    where: { id: bookingId, status: current.status },
    data: updateData,
  });
  if (updated.count === 0) {
    return { success: false, error: 'Booking status changed by someone else. Reload and retry.' };
  }

  return { success: true, status };
}

/**
 * Append an admin note to a booking's adminNotes column with a timestamp.
 * Notes accumulate: older notes are always preserved.
 */
export async function addBookingAdminNote(
  bookingId: string,
  note: string
): Promise<BookingMutationResult> {
  await requireStaffAccess();
  const trimmed = note.trim();
  if (!trimmed) {
    return { success: false, error: 'Note cannot be empty' };
  }
  if (trimmed.length > 5000) {
    return { success: false, error: 'Note is too long (max 5000 characters)' };
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { adminNotes: true },
  });
  if (!booking) {
    return { success: false, error: 'Booking not found' };
  }

  const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
  const existing = booking.adminNotes?.trim();
  const combined = existing
    ? `${existing}\n\n--- ${stamp} ---\n${trimmed}`
    : `[${stamp}]\n${trimmed}`;

  await prisma.booking.update({
    where: { id: bookingId },
    data: { adminNotes: combined },
  });

  return { success: true };
}

export async function addBookingPayment(
  bookingId: string,
  amount: number,
  method: 'CASH' | 'BANK_TRANSFER' | 'JAZZCASH' | 'EASYPAISA' | 'STRIPE' | 'PAYPAL',
  transactionId?: string,
  reference?: string,
  notes?: string
) {
  await requireStaffAccess();
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { paidAmount: true, totalAmount: true, paymentStatus: true },
  });

  if (!booking) throw new Error('Booking not found');

  const newPaidAmount = Number(booking.paidAmount) + amount;
  const totalAmount = Number(booking.totalAmount);

  let newPaymentStatus: PaymentStatus = 'PARTIAL';
  if (newPaidAmount >= totalAmount) newPaymentStatus = 'PAID';
  else if (newPaidAmount === 0) newPaymentStatus = 'UNPAID';

  await prisma.$transaction([
    prisma.payment.create({
      data: {
        bookingId,
        amount,
        method,
        status: 'PAID',
        transactionId,
        reference,
        notes,
      },
    }),
    prisma.booking.update({
      where: { id: bookingId },
      data: {
        paidAmount: newPaidAmount,
        paymentStatus: newPaymentStatus,
      },
    }),
  ]);

  return { success: true, newPaymentStatus, newPaidAmount };
}
