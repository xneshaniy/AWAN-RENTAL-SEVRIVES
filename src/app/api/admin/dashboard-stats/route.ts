import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isNotificationRole } from '@/lib/notifications';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Tiny live-count endpoint for the dashboard.
 *
 * Deliberately returns only three indexed counts rather than the booking list:
 * the notification stream tells the client WHEN something changed, and this
 * tells it the new value of just the numbers that moved. No full list is ever
 * refetched, so a single booking costs three `COUNT` queries and nothing more.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role ?? null;
  if (!session?.user || !isNotificationRole(role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [pendingBookings, newMessages, unreadNotifications] = await Promise.all([
      prisma.booking.count({ where: { status: 'PENDING' } }),
      prisma.contactMessage.count({ where: { isRead: false, status: { not: 'ARCHIVED' } } }),
      prisma.notification.count({
        where: { reads: { none: { userId: session.user.id } } },
      }),
    ]);

    return NextResponse.json({ pendingBookings, newMessages, unreadNotifications });
  } catch (error) {
    console.error('GET /api/admin/dashboard-stats error:', error);
    return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 });
  }
}
