'use client';

import Link from 'next/link';
import { formatDate, formatDateTime } from '@/lib/utils';
import { Clock, User, Car, MessageCircle, CheckCircle, XCircle, Calendar } from 'lucide-react';

interface Activity {
  id: string;
  type: 'booking_created' | 'booking_confirmed' | 'booking_cancelled' | 'message_received' | 'vehicle_added';
  title: string;
  description: string;
  timestamp: Date | string;
  href?: string;
}

interface ActivityFeedProps {
  activities: Activity[];
  title?: string;
  emptyMessage?: string;
}

const ICONS: Record<Activity['type'], React.ReactNode> = {
  booking_created: <Clock className="h-4 w-4 text-blue-500" />,
  booking_confirmed: <CheckCircle className="h-4 w-4 text-green-500" />,
  booking_cancelled: <XCircle className="h-4 w-4 text-red-500" />,
  message_received: <MessageCircle className="h-4 w-4 text-purple-500" />,
  vehicle_added: <Car className="h-4 w-4 text-green-500" />,
};

export function ActivityFeed({ activities, title = 'Recent Activity', emptyMessage = 'No recent activity' }: ActivityFeedProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-heading font-semibold text-lg text-gray-900 dark:text-white">
        {title}
      </h3>
      {activities.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          {emptyMessage}
        </div>
      ) : (
        <ul className="space-y-3" role="list">
          {activities.map((activity) => (
            <li
              key={activity.id}
              className="group flex gap-3 p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 transition-colors hover:border-primary-200 dark:hover:border-primary-800"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                {ICONS[activity.type]}
              </div>
              <div className="flex-1 min-w-0">
                <Link
                  href={activity.href || '#'}
                  className="font-medium text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  {activity.title}
                </Link>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                  {activity.description}
                </p>
              </div>
              <time
                className="text-xs text-gray-400 flex-shrink-0"
                dateTime={new Date(activity.timestamp).toISOString()}
              >
                {formatDateTime(new Date(activity.timestamp))}
              </time>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Server-side helper to fetch recent activity
export async function getRecentActivity(prisma: any, limit = 10) {
  const [bookings, messages, vehicles] = await Promise.all([
    prisma.booking.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        vehicle: { select: { name: true } },
        user: { select: { name: true } },
      },
    }),
    prisma.contactMessage.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.vehicle.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const activities = [
    ...bookings.map((b: any) => ({
      id: `booking-${b.id}`,
      type: 'booking_created' as const,
      title: `New booking: ${b.bookingNumber}`,
      description: `${b.user?.name || b.customerName} • ${b.vehicle?.name}`,
      timestamp: b.createdAt,
      href: `/admin/bookings/${b.id}`,
    })),
    ...messages.map((m: any) => ({
      id: `message-${m.id}`,
      type: 'message_received' as const,
      title: 'New message received',
      description: `${m.name} • ${m.email}`,
      timestamp: m.createdAt,
      href: `/admin/messages/${m.id}`,
    })),
    ...vehicles.map((v: any) => ({
      id: `vehicle-${v.id}`,
      type: 'vehicle_added' as const,
      title: 'Vehicle added',
      description: `${v.name} (${v.brand} ${v.model})`,
      timestamp: v.createdAt,
      href: `/admin/vehicles/${v.id}/edit`,
    })),
  ];

  return activities
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
}