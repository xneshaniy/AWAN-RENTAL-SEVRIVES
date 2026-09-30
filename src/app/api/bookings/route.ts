import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { processBookingRequest } from '@/lib/booking';
import { pickSortBy, pickSortOrder } from '@/lib/utils';
import { rateLimit, clientIpFromHeaders } from '@/lib/rate-limit';
import { BookingStatus } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Bookings contain customer PII: never list them without a session.
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'STAFF';

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    // Clamp: requesters can never ask the database for an unbounded page.
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10) || 20));
    const statusParam = searchParams.get('status');
    // Only real BookingStatus enum values reach the query.
    const status =
      statusParam && (Object.values(BookingStatus) as string[]).includes(statusParam)
        ? (statusParam as BookingStatus)
        : null;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const vehicleId = searchParams.get('vehicleId');
    const search = searchParams.get('search');
    const sortBy = pickSortBy(
      searchParams.get('sortBy'),
      ['createdAt', 'updatedAt', 'startDate', 'totalAmount', 'status', 'bookingNumber'] as const,
      'createdAt'
    );
    const sortOrder = pickSortOrder(searchParams.get('sortOrder'));

    const where: Record<string, unknown> = {};

    // Admins/managers see everything; everyone else only their own bookings.
    if (!isAdmin) {
      where.userId = session.user.id;
    }

    if (status) where.status = status;
    if (vehicleId) where.vehicleId = vehicleId;
    if (startDate || endDate) {
      const startDateObj: Record<string, unknown> = {};
      if (startDate) startDateObj.gte = new Date(startDate);
      if (endDate) startDateObj.lte = new Date(endDate);
      where.startDate = startDateObj;
    }
    if (search) {
      where.OR = [
        { bookingNumber: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerEmail: { contains: search, mode: 'insensitive' } },
        { customerPhone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          vehicle: { select: { id: true, name: true, brand: true, model: true, images: true } },
          user: { select: { id: true, name: true, email: true, phone: true } },
          payments: true,
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.booking.count({ where }),
    ]);

    return NextResponse.json({
      data: bookings,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('GET /api/bookings error:', error);
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // Same per-IP spam guard as the server action (10 attempts per hour).
  const ip = clientIpFromHeaders(request.headers);
  if (!rateLimit(`booking:${ip}`, { limit: 10, windowMs: 60 * 60 * 1000 })) {
    return NextResponse.json(
      { error: 'Too many booking attempts from your network. Please try again later.' },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    // Shared core: server-side Zod validation, honeypot, vehicle checks,
    // duplicate submission protection, unique ARS-XXXXXX reference, PENDING
    // status and safe error responses - identical to the server action.
    const result = await processBookingRequest(body);

    const payload = {
      success: result.success,
      bookingNumber: result.bookingNumber,
      whatsappUrl: result.whatsappUrl,
      message: result.message,
      error: result.error,
      fieldErrors: result.fieldErrors,
    };

    return NextResponse.json(payload, { status: result.success ? 200 : result.status ?? 400 });
  } catch (error) {
    console.error('POST /api/bookings error:', error);
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }
}
