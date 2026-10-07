import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { updateBookingStatus } from '@/actions/booking';
import type { BookingStatus } from '@prisma/client';

const VALID_STATUSES: BookingStatus[] = [
  'PENDING',
  'CONFIRMED',
  'ACTIVE',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
];

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN' && session.user.role !== 'STAFF') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Explicit column selection: the password hash and other credential
    // fields must never reach the browser.
    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true },
        },
        vehicle: true,
      },
    });

    if (!booking) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({ booking });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN' && session.user.role !== 'STAFF') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { status } = await req.json();

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid booking status' }, { status: 400 });
    }

    // Delegate to the exact same implementation the admin panel calls.
    // Status changes must have ONE code path: otherwise a change made through
    // this route would skip the in-app notification and the customer
    // confirmation email that the admin UI sends, and the two would drift.
    const result = await updateBookingStatus(params.id, status);

    if (!result.success) {
      const message = result.error || 'Internal Server Error';
      const code =
        message === 'Booking not found'
          ? 404
          : message.startsWith('Booking is already') || message.startsWith('Invalid status change') || message.includes('changed by someone else')
            ? 409
            : 500;
      return NextResponse.json({ error: message }, { status: code });
    }

    return NextResponse.json({ booking: { id: params.id, status: result.status } });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN' && session.user.role !== 'STAFF') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await prisma.booking.delete({ where: { id: params.id } });
    return NextResponse.json({ message: 'Deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
