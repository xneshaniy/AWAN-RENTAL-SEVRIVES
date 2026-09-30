import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { vehicleSchema } from '@/lib/validations';
import { slugify, pickSortBy, pickSortOrder } from '@/lib/utils';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/** Sort fields the public vehicles API may order by. */
const VEHICLE_SORT_FIELDS = ['createdAt', 'updatedAt', 'name', 'dailyRate', 'year'] as const;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    // Clamp: requesters can never ask the database for an unbounded page.
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '12', 10) || 12));
    const category = searchParams.get('category');
    const isAvailable = searchParams.get('isAvailable');
    const isFeatured = searchParams.get('isFeatured');
    const location = searchParams.get('location');
    const search = searchParams.get('search');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const seats = searchParams.get('seats');
    const transmission = searchParams.get('transmission');
    const sortBy = pickSortBy(searchParams.get('sortBy'), VEHICLE_SORT_FIELDS, 'createdAt');
    const sortOrder = pickSortOrder(searchParams.get('sortOrder'));

    const where: Record<string, unknown> = {};
    // Archived vehicles never appear in the public listing API.
    where.archivedAt = null;

    if (category) where.category = category;
    if (isAvailable !== null) where.isAvailable = isAvailable === 'true';
    if (isFeatured !== null) where.isFeatured = isFeatured === 'true';
    if (location) where.location = location;
    if (transmission) where.transmission = transmission;
    if (seats) where.seats = { gte: parseInt(seats) };
    if (minPrice || maxPrice) {
      const dailyRateObj: Record<string, unknown> = {};
      if (minPrice) dailyRateObj.gte = parseFloat(minPrice);
      if (maxPrice) dailyRateObj.lte = parseFloat(maxPrice);
      where.dailyRate = dailyRateObj;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [vehicles, total] = await Promise.all([
      prisma.vehicle.findMany({
        where,
        include: {
          _count: { select: { bookings: true, reviews: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.vehicle.count({ where }),
    ]);

    return NextResponse.json({
      data: vehicles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('GET /api/vehicles error:', error);
    return NextResponse.json({ error: 'Failed to fetch vehicles' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = vehicleSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Validation failed', fieldErrors: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const baseSlug = slugify(`${validated.data.brand}-${validated.data.model}-${validated.data.year}`);
    let slug = baseSlug;
    let counter = 1;

    while (await prisma.vehicle.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        ...validated.data,
        slug,
        dailyRate: validated.data.dailyRate,
        weeklyRate: validated.data.weeklyRate,
        monthlyRate: validated.data.monthlyRate,
      },
    });

    return NextResponse.json({ data: vehicle }, { status: 201 });
  } catch (error) {
    console.error('POST /api/vehicles error:', error);
    return NextResponse.json({ error: 'Failed to create vehicle' }, { status: 500 });
  }
}