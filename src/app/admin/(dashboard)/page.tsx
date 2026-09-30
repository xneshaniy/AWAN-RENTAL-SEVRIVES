import { prisma } from '@/lib/prisma';
import { formatCurrency, cn } from '@/lib/utils';
import { rentalTypeLabel } from '@/lib/whatsapp';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Calendar, Car, Clock, Users, Mail, TrendingUp, DollarSign, CheckCircle, AlertCircle, XCircle, Settings } from 'lucide-react';
import Link from 'next/link';

export default async function AdminDashboard() {
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
  ] = await Promise.all([
    prisma.vehicle.count(),
    prisma.vehicle.count({ where: { isAvailable: true } }),
    prisma.booking.count({ where: { status: 'PENDING' } }),
    prisma.booking.count({ where: { status: 'CONFIRMED' } }),
    prisma.booking.count({ where: { status: 'COMPLETED' } }),
    prisma.booking.count({ where: { status: 'CANCELLED' } }),
    prisma.contactMessage.count({ where: { isRead: false, status: { not: 'ARCHIVED' } } }),
    prisma.booking.findMany({
      take: 10,
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
  ]);

  const stats = [
    { label: 'Total Vehicles', value: totalVehicles, icon: Car, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400', href: '/admin/vehicles' },
    { label: 'Available Vehicles', value: availableVehicles, icon: CheckCircle, color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400', href: '/admin/vehicles?available=true' },
    { label: 'Pending Bookings', value: pendingBookings, icon: Clock, color: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400', href: '/admin/bookings?status=PENDING' },
    { label: 'Confirmed', value: confirmedBookings, icon: CheckCircle, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400', href: '/admin/bookings?status=CONFIRMED' },
    { label: 'Completed', value: completedBookings, icon: CheckCircle, color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400', href: '/admin/bookings?status=COMPLETED' },
    { label: 'Cancelled', value: cancelledBookings, icon: XCircle, color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400', href: '/admin/bookings?status=CANCELLED' },
    { label: 'New Messages', value: newMessages, icon: Mail, color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400', href: '/admin/messages' },
    { label: 'Monthly Revenue', value: formatCurrency(Number(monthlyRevenue._sum.totalAmount || 0)), icon: DollarSign, color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400', href: '/admin/bookings' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-3xl text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Overview of your rental business</p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/bookings?status=PENDING" className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors">
            View Pending
          </Link>
          <Link href="/admin/vehicles/create" className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-primary-600 text-white hover:bg-primary-700 font-medium transition-colors">
            Add Vehicle
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4">
        {stats.map((stat, index) => (
          <Link key={index} href={stat.href} className="col-span-1 sm:col-span-2 lg:col-span-2 xl:col-span-1">
            <Card variant="default" padding="md" hover>
              <CardContent className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{stat.label}</p>
                  <p className="font-heading font-bold text-2xl sm:text-3xl text-gray-900 dark:text-white">{stat.value}</p>
                </div>
                <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', stat.color)}>
                  <stat.icon className="w-6 h-6" aria-hidden="true" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card variant="default" padding="md">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Recent Bookings
              <Link href="/admin/bookings" className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium transition-colors">
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
                    <th className="pb-3 font-medium">Actions</th>
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
                        <Link
                          href={`/admin/bookings/${booking.id}`}
                          className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
                        >
                          View
                        </Link>
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

        <Card variant="default" padding="md">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Quick Actions
              <TrendingUp className="w-5 h-5 text-gray-400" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/admin/vehicles/create" className="inline-flex items-center justify-start w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors">
              <Car className="w-5 h-5 mr-2" />
              Add New Vehicle
            </Link>
            <Link href="/admin/bookings?status=PENDING" className="inline-flex items-center justify-start w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors">
              <Clock className="w-5 h-5 mr-2" />
              Review Pending Bookings
            </Link>
            <Link href="/admin/messages" className="inline-flex items-center justify-start w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors">
              <Mail className="w-5 h-5 mr-2" />
              Respond to Messages ({newMessages})
            </Link>
            <Link href="/admin/vehicles?available=false" className="inline-flex items-center justify-start w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors">
              <AlertCircle className="w-5 h-5 mr-2" />
              Check Unavailable Vehicles
            </Link>
            <Link href="/admin/settings" className="inline-flex items-center justify-start w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors">
              <Settings className="w-5 h-5 mr-2" />
              Manage Settings
            </Link>
            <Link href="/admin/users" className="inline-flex items-center justify-start w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors">
              <Users className="w-5 h-5 mr-2" />
              Manage Admin Users
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}