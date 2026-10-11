import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { formatCurrency, cn } from '@/lib/utils';
import { rentalTypeLabel } from '@/lib/whatsapp';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Calendar, Car, Clock, Users, Mail, TrendingUp, DollarSign, CheckCircle, AlertCircle, XCircle, Settings, Bell, Plus, Eye, MessageSquare, Activity } from 'lucide-react';
import Link from 'next/link';
import { LiveStatValue } from '@/components/admin/LiveStatValue';
import { StatCard } from '@/components/admin/StatCard';
import { ActivityFeed, getRecentActivity } from '@/components/admin/ActivityFeed';
import { PageHeader } from '@/components/admin/Breadcrumb';

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);

  const [
    totalVehicles,
    availableVehicles,
    pendingBookings,
    confirmedBookings,
    completedBookings,
    cancelledBookings,
    newMessages,
    recentBookings,
    monthlyRevenue,
    unreadNotifications,
  ] = await Promise.all([
    prisma.vehicle.count(),
    prisma.vehicle.count({ where: { isAvailable: true } }),
    prisma.booking.count({ where: { status: 'PENDING' } }),
    prisma.booking.count({ where: { status: 'CONFIRMED' } }),
    prisma.booking.count({ where: { status: 'COMPLETED' } }),
    prisma.booking.count({ where: { status: 'CANCELLED' } }),
    prisma.contactMessage.count({ where: { isRead: false, status: { not: 'ARCHIVED' } } }),
    prisma.booking.findMany({
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: {
        vehicle: { select: { name: true, brand: true } },
        user: { select: { name: true, email: true } },
      },
    }),
    prisma.booking.aggregate({
      where: {
        status: { in: ['CONFIRMED', 'COMPLETED'] },
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
      _sum: { totalAmount: true },
    }),
    session?.user
      ? prisma.notification.count({ where: { reads: { none: { userId: session.user.id } } } })
      : 0,
    // Fetch recent activity
    getRecentActivity(prisma, 8),
  ]);

  const stats = [
    {
      label: 'Total Vehicles',
      value: totalVehicles,
      icon: <Car className="w-6 h-6" />,
      color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
      href: '/admin/vehicles',
    },
    {
      label: 'Available Vehicles',
      value: availableVehicles,
      icon: <CheckCircle className="w-6 h-6" />,
      color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
      href: '/admin/vehicles?available=true',
    },
    {
      label: 'Pending Bookings',
      value: <LiveStatValue stat="pendingBookings" initial={pendingBookings} />,
      icon: <Clock className="w-6 h-6" />,
      color: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
      href: '/admin/bookings?status=PENDING',
    },
    {
      label: 'Confirmed',
      value: confirmedBookings,
      icon: <CheckCircle className="w-6 h-6" />,
      color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
      href: '/admin/bookings?status=CONFIRMED',
    },
    {
      label: 'Completed',
      value: completedBookings,
      icon: <CheckCircle className="w-6 h-6" />,
      color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
      href: '/admin/bookings?status=COMPLETED',
    },
    {
      label: 'Cancelled',
      value: cancelledBookings,
      icon: <AlertCircle className="w-6 h-6" />,
      color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
      href: '/admin/bookings?status=CANCELLED',
    },
    {
      label: 'New Messages',
      value: <LiveStatValue stat="newMessages" initial={newMessages} />,
      icon: <Mail className="w-6 h-6" />,
      color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
      href: '/admin/messages',
    },
    {
      label: 'Monthly Revenue',
      value: formatCurrency(Number(monthlyRevenue._sum.totalAmount || 0)),
      icon: <Activity className="w-6 h-6" />,
      color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
      href: '/admin/bookings',
    },
    {
      label: 'Unread Notifications',
      value: <LiveStatValue stat="unreadNotifications" initial={unreadNotifications} />,
      icon: <Bell className="w-6 h-6" />,
      color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
      href: '/admin',
    },
  ];

  // Build recent activity from recent bookings
  const recentActivity = recentBookings.map((booking: any) => ({
    id: `booking-${booking.id}`,
    type: 'booking_created' as const,
    title: `New booking: ${booking.bookingNumber}`,
    description: `${booking.user?.name || booking.customerName} • ${booking.vehicle?.name}`,
    timestamp: booking.createdAt,
    href: `/admin/bookings/${booking.id}`,
  }));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Overview of your rental business"
        action={
          <div className="flex gap-3">
            <Link
              href="/admin/bookings?status=PENDING"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
            >
              <Eye className="w-4 h-4" />
              View Pending
            </Link>
            <Link
              href="/admin/vehicles/create"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 text-white hover:bg-primary-700 font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Vehicle
            </Link>
          </div>
        }
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4">
        {stats.map((stat, index) => (
          <StatCard
            key={index}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            href={stat.href}
          />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6 [&>*]:min-w-0">
        {/* Recent Bookings - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          <Card variant="default" padding="md">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  Recent Bookings
                </div>
                <Link
                  href="/admin/bookings"
                  className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium transition-colors"
                >
                  View All
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                      <th className="pb-3 font-medium">Reference</th>
                      <th className="pb-3 font-medium">Customer</th>
                      <th className="pb-3 font-medium">Vehicle</th>
                      <th className="pb-3 font-medium">Rental Type</th>
                      <th className="pb-3 font-medium">Pickup Date</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium">Created</th>
                      <th className="pb-3 font-medium w-24 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {recentBookings.map((booking) => (
                      <tr key={booking.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="py-3 font-mono text-sm text-gray-900 dark:text-white">{booking.bookingNumber}</td>
                        <td className="py-3 text-sm text-gray-700 dark:text-gray-300">
                          <div className="font-medium">{booking.user?.name || booking.customerName || 'Guest'}</div>
                          <div className="text-xs text-gray-500">{booking.user?.email || booking.customerEmail}</div>
                        </td>
                        <td className="py-3 text-sm text-gray-700 dark:text-gray-300">{booking.vehicle?.name}</td>
                        <td className="py-3 text-sm text-gray-700 dark:text-gray-300">{rentalTypeLabel(booking.rentalType)}</td>
                        <td className="py-3 text-sm text-gray-700 dark:text-gray-300">
                          {new Date(booking.startDate).toLocaleDateString()}
                        </td>
                        <td className="py-3">
                          <Badge variant={
                            booking.status === 'PENDING' ? 'warning' :
                            booking.status === 'CONFIRMED' ? 'info' :
                            booking.status === 'ACTIVE' ? 'success' :
                            booking.status === 'COMPLETED' ? 'default' :
                            booking.status === 'CANCELLED' ? 'danger' : 'default'
                          }>
                            {booking.status}
                          </Badge>
                        </td>
                        <td className="py-3 text-sm text-gray-500 dark:text-gray-400">
                          {new Date(booking.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 text-sm">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              href={`/admin/bookings/${booking.id}`}
                              className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-primary-600 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-primary-400"
                              title="View details"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            <a
                              href={`https://wa.me/${booking.customerPhone?.replace(/\D/g, '')}?text=${encodeURIComponent(
                                `Hello, this is Awan Rental Service regarding your booking ${booking.bookingNumber}.`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-green-600 dark:text-gray-400 dark:hover:bg-gray-800"
                              title="Message on WhatsApp"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {recentBookings.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No bookings yet
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats Summary */}
          <Card variant="default" padding="md">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-gray-400" />
                  Quick Summary
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20">
                <p className="text-sm text-gray-500 dark:text-gray-400">Conversion Rate</p>
                <p className="font-heading font-bold text-2xl text-blue-600 dark:text-blue-400">
                  {totalVehicles > 0 ? Math.round((confirmedBookings + completedBookings) / totalVehicles * 100) : 0}%
                </p>
              </div>
              <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20">
                <p className="text-sm text-gray-500 dark:text-gray-400">Avg. Booking Value</p>
                <p className="font-heading font-bold text-2xl text-green-600 dark:text-green-400">
                  {monthlyRevenue._sum.totalAmount && confirmedBookings > 0
                    ? formatCurrency(Number(monthlyRevenue._sum.totalAmount) / (confirmedBookings + completedBookings || 1))
                    : formatCurrency(0)}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20">
                <p className="text-sm text-gray-500 dark:text-gray-400">Response Rate</p>
                <p className="font-heading font-bold text-2xl text-purple-600 dark:text-purple-400">
                  {newMessages > 0 ? 'Needs Attention' : 'All Caught Up'}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-orange-50 dark:bg-orange-900/20">
                <p className="text-sm text-gray-500 dark:text-gray-400">Fleet Utilization</p>
                <p className="font-heading font-bold text-2xl text-orange-600 dark:text-orange-400">
                  {totalVehicles > 0 ? Math.round((availableVehicles / totalVehicles) * 100) : 0}% Available
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: Activity Feed + Quick Actions */}
        <div className="space-y-6">
          <ActivityFeed
            activities={recentActivity}
            title="Recent Activity"
            emptyMessage="No recent activity"
          />

          <Card variant="default" padding="md">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Plus className="w-5 h-5 text-gray-400" />
                  Quick Actions
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link
                href="/admin/vehicles/create"
                className="inline-flex items-center justify-start w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
              >
                <Car className="w-5 h-5 mr-2" />
                Add New Vehicle
              </Link>
              <Link
                href="/admin/bookings?status=PENDING"
                className="inline-flex items-center justify-start w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
              >
                <Clock className="w-5 h-5 mr-2" />
                Review Pending Bookings
              </Link>
              <Link
                href="/admin/messages"
                className="inline-flex items-center justify-start w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
              >
                <Mail className="w-5 h-5 mr-2" />
                Respond to Messages ({newMessages})
              </Link>
              <Link
                href="/admin/vehicles?available=false"
                className="inline-flex items-center justify-start w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
              >
                <AlertCircle className="w-5 h-5 mr-2" />
                Check Unavailable Vehicles
              </Link>
              <Link
                href="/admin/settings"
                className="inline-flex items-center justify-start w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
              >
                <Settings className="w-5 h-5 mr-2" />
                Manage Settings
              </Link>
              <Link
                href="/admin/users"
                className="inline-flex items-center justify-start w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
              >
                <Users className="w-5 h-5 mr-2" />
                Manage Admin Users
              </Link>
            </CardContent>
          </Card>

          {/* Tips / Help */}
          <Card variant="outlined" padding="md" className="bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800">
            <CardContent className="flex items-start gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/30 flex-shrink-0">
                <Activity className="w-4 h-4 text-primary-600 dark:text-primary-400" />
              </span>
              <div>
                <p className="font-medium text-primary-700 dark:text-primary-300">Need Help?</p>
                <p className="text-sm text-primary-600 dark:text-primary-400 mt-1">
                  Check our <Link href="/admin/settings" className="underline hover:text-primary-700 dark:hover:text-primary-300">Settings</Link> for configuration options, or visit the <a href="/faq" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary-700 dark:hover:text-primary-300">FAQ</a>.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}