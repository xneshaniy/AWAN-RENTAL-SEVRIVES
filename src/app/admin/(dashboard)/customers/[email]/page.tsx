import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { formatCurrency, formatDate } from '@/lib/utils';
import { rentalTypeLabel } from '@/lib/whatsapp';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Phone, MessageCircle, Mail, CalendarDays, Inbox } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Customer Details',
  robots: { index: false, follow: false },
};

/**
 * Customer profile: contact info, booking history and contact-message
 * history for one email address. Keyed by email so records can never
 * duplicate. Admin/staff only (protected layout + middleware).
 */
export default async function AdminCustomerDetailPage({ params }: { params: { email: string } }) {
  let email = params.email;
  try {
    email = decodeURIComponent(email);
  } catch {
    notFound();
  }

  const [user, bookings, messages] = await Promise.all([
    prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      select: {
        name: true,
        email: true,
        phone: true,
        city: true,
        createdAt: true,
        role: true,
      },
    }),
    prisma.booking.findMany({
      where: { customerEmail: { equals: email, mode: 'insensitive' } },
      include: { vehicle: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.contactMessage.findMany({
      where: { email: { equals: email, mode: 'insensitive' } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
  ]);

  if (!user && bookings.length === 0 && messages.length === 0) notFound();

  const latestBooking = bookings[0];
  const name =
    user?.name || latestBooking?.customerName || messages[0]?.name || 'Customer';
  const phone =
    user?.phone || latestBooking?.customerPhone || messages[0]?.phone || null;
  const whatsapp =
    latestBooking?.customerWhatsApp || phone;
  const phoneDigits = (whatsapp || '').replace(/\D/g, '');

  const totalBookings = bookings.length;
  const activeBookings = bookings.filter((booking) =>
    ['PENDING', 'CONFIRMED', 'ACTIVE'].includes(booking.status)
  ).length;
  const totalSpent = bookings
    .filter((booking) => booking.status !== 'CANCELLED')
    .reduce((sum, booking) => sum + Number(booking.totalAmount), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <Link
          href="/admin/customers"
          className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Customers
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold text-gray-900 dark:text-white">
              {name}
            </h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">{email}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {phone && (
              <Button variant="outline" size="sm" asChild>
                <a href={`tel:${phone}`}>
                  <Phone className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  Call
                </a>
              </Button>
            )}
            {phoneDigits && (
              <Button variant="whatsapp" size="sm" asChild>
                <a
                  href={`https://wa.me/${phoneDigits}?text=${encodeURIComponent(
                    `Hello ${name}, this is Awan Rental Service.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  WhatsApp
                </a>
              </Button>
            )}
            <Button variant="outline" size="sm" asChild>
              <a href={`mailto:${email}`}>
                <Mail className="mr-1.5 h-4 w-4" aria-hidden="true" />
                Email
              </a>
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card variant="default" padding="md">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Bookings</p>
          <p className="mt-1 font-heading text-2xl font-bold text-gray-900 dark:text-white">
            {totalBookings}
          </p>
        </Card>
        <Card variant="default" padding="md">
          <p className="text-sm text-gray-500 dark:text-gray-400">Active / Pending</p>
          <p className="mt-1 font-heading text-2xl font-bold text-gray-900 dark:text-white">
            {activeBookings}
          </p>
        </Card>
        <Card variant="default" padding="md">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Value (excl. cancelled)</p>
          <p className="mt-1 font-heading text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(totalSpent)}
          </p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile */}
        <Card variant="default" padding="md">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-gray-500 dark:text-gray-400">Name</p>
              <p className="font-medium text-gray-900 dark:text-white">{name}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">Email</p>
              <p className="font-medium text-gray-900 dark:text-white">{email}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">Phone</p>
              <p className="font-medium text-gray-900 dark:text-white">{phone || '—'}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">WhatsApp</p>
              <p className="font-medium text-gray-900 dark:text-white">{whatsapp || '—'}</p>
            </div>
            {user?.city && (
              <div>
                <p className="text-gray-500 dark:text-gray-400">City</p>
                <p className="font-medium text-gray-900 dark:text-white">{user.city}</p>
              </div>
            )}
            <div>
              <p className="text-gray-500 dark:text-gray-400">Record Since</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {formatDate(user?.createdAt || messages[messages.length - 1]?.createdAt || new Date())}
              </p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">Sources</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {user && <Badge variant="info">Account</Badge>}
                {totalBookings > 0 && <Badge variant="success">Bookings</Badge>}
                {messages.length > 0 && <Badge variant="outline">Messages</Badge>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Booking history */}
        <Card variant="default" padding="md" className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-gray-400" aria-hidden="true" />
              Booking History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {bookings.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                No bookings yet for this customer.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                      <th className="pb-2 font-medium">Reference</th>
                      <th className="pb-2 font-medium">Vehicle</th>
                      <th className="pb-2 font-medium">Type</th>
                      <th className="pb-2 font-medium">Dates</th>
                      <th className="pb-2 font-medium">Status</th>
                      <th className="pb-2 text-right font-medium">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {bookings.map((booking) => (
                      <tr key={booking.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="py-3">
                          <Link
                            href={`/admin/bookings/${booking.id}`}
                            className="font-mono text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
                          >
                            {booking.bookingNumber}
                          </Link>
                        </td>
                        <td className="py-3 text-sm text-gray-700 dark:text-gray-300">
                          {booking.vehicle?.name || '—'}
                        </td>
                        <td className="py-3 text-sm text-gray-700 dark:text-gray-300">
                          {rentalTypeLabel(booking.rentalType)}
                        </td>
                        <td className="py-3 text-sm text-gray-600 dark:text-gray-400">
                          {formatDate(booking.startDate)} → {formatDate(booking.endDate)}
                        </td>
                        <td className="py-3">
                          <StatusBadge status={booking.status} />
                        </td>
                        <td className="py-3 text-right text-sm font-medium text-gray-900 dark:text-white">
                          {formatCurrency(Number(booking.totalAmount))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Contact messages */}
      <Card variant="default" padding="md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Inbox className="h-5 w-5 text-gray-400" aria-hidden="true" />
            Contact Messages
          </CardTitle>
        </CardHeader>
        <CardContent>
          {messages.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
              No contact messages from this customer.
            </p>
          ) : (
            <ul className="space-y-3">
              {messages.map((message) => (
                <li
                  key={message.id}
                  className="rounded-xl border border-gray-100 p-4 dark:border-gray-800"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-gray-900 dark:text-white">{message.subject}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant={message.status === 'RESOLVED' ? 'success' : message.status === 'ARCHIVED' ? 'outline' : 'warning'}>
                        {message.status}
                      </Badge>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(message.createdAt)}
                      </span>
                    </div>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-gray-600 dark:text-gray-400">
                    {message.message.length > 400 ? `${message.message.slice(0, 400)}…` : message.message}
                  </p>
                </li>
              ))}
            </ul>
          )}
          {messages.length > 0 && (
            <div className="mt-4">
              <Link
                href="/admin/messages"
                className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
              >
                Open in Messages →
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
