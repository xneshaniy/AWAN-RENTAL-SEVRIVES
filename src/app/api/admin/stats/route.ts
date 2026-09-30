import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [counts, recentBookings] = await Promise.all([
      Promise.all([
        prisma.booking.count(),
        prisma.booking.count({ where: { status: 'PENDING' } }),
        prisma.vehicle.count({ where: { isAvailable: true } }),
        prisma.booking.aggregate({
          _sum: { totalAmount: true },
          where: { status: { in: ['CONFIRMED', 'COMPLETED', 'ACTIVE'] } }
        })
      ]),
      prisma.booking.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { user: true, vehicle: true }
      })
    ]);
    const [totalBookings, pendingBookings, activeVehicles, totalRevenueObj] = counts;

    return NextResponse.json({
      stats: {
        totalBookings,
        pendingBookings,
        activeVehicles,
        revenue: totalRevenueObj._sum.totalAmount || 0,
      },
      recentBookings
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
