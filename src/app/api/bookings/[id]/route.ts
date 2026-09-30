import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { canTransition } from '@/lib/booking-status';
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

    const current = await prisma.booking.findUnique({
      where: { id: params.id },
      select: { status: true },
    });
    if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (!canTransition(current.status, status)) {
      return NextResponse.json(
        { error: `Cannot change status from ${current.status} to ${status}` },
        { status: 409 }
      );
    }

    const data: Record<string, unknown> = { status };
    if (status === 'CONFIRMED') data.confirmedAt = new Date();
    if (status === 'COMPLETED') data.completedAt = new Date();
    if (status === 'CANCELLED') data.cancelledAt = new Date();

    const booking = await prisma.booking.update({
      where: { id: params.id },
      data,
      select: { id: true, status: true },
    });
    return NextResponse.json({ booking });
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
