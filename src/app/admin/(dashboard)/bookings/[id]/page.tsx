import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { formatCurrency, formatDate, getVehicleCategoryLabel } from '@/lib/utils';
import { rentalTypeLabel } from '@/lib/whatsapp';
import { BOOKING_STATUS_LABELS, BOOKING_STATUS_TRANSITIONS } from '@/lib/booking-status';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  ArrowLeft,
  Phone,
  Mail,
  MessageCircle,
  Car,
  CalendarRange,
  User as UserIcon,
  CreditCard,
  ExternalLink,
} from 'lucide-react';
import { BookingStatusActions } from '@/components/admin/BookingStatusActions';
import { BookingNotesForm } from '@/components/admin/BookingNotesForm';

export const metadata: Metadata = {
  title: 'Booking Details',
  robots: { index: false, follow: false },
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-2 sm:flex-row sm:items-baseline sm:gap-3">
      <dt className="shrink-0 text-sm font-medium text-gray-500 dark:text-gray-400 sm:w-40">
        {label}
      </dt>
      <dd className="text-sm text-gray-900 dark:text-gray-100">{value}</dd>
    </div>
  );
}

/**
 * Complete booking detail for admin/staff. Read server-side (protected by
 * the admin layout + middleware) and all mutations go through guarded
 * server actions that re-validate status transitions before writing.
 */
export default async function AdminBookingDetailPage({ params }: { params: { id: string } }) {
  const booking = await prisma.booking.findUnique({
    where: { id: params.id },
    include: {
      vehicle: true,
      user: { select: { id: true, name: true, email: true, phone: true, createdAt: true } },
      payments: { orderBy: { createdAt: 'desc' } },
    },
  });

  if (!booking) notFound();

  const allowedTransitions = BOOKING_STATUS_TRANSITIONS[booking.status];
  const displayName = booking.customerName || booking.user.name || 'Guest';
  const displayEmail = booking.customerEmail || booking.user.email;
  const whatsAppNumber = booking.customerWhatsApp || booking.customerPhone || '';
  const phoneDigits = whatsAppNumber.replace(/\D/g, '');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Link
          href="/admin/bookings"
          className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Bookings
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-heading text-3xl font-bold text-gray-900 dark:text-white">
              {booking.bookingNumber}
            </h1>
            <StatusBadge status={booking.status} />
            <Badge variant="outline">{BOOKING_STATUS_LABELS[booking.status]}</Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            {displayEmail && (
              <Button variant="outline" size="sm" asChild>
                <a href={`mailto:${displayEmail}?subject=${encodeURIComponent(`Booking ${booking.bookingNumber}`)}`}>
                  <Mail className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  Email
                </a>
              </Button>
            )}
            {booking.customerPhone && (
              <Button variant="outline" size="sm" asChild>
                <a href={`tel:${booking.customerPhone}`}>
                  <Phone className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  Call
                </a>
              </Button>
            )}
            {phoneDigits && (
              <Button variant="whatsapp" size="sm" asChild>
                <a
                  href={`https://wa.me/${phoneDigits}?text=${encodeURIComponent(
                    `Hello ${displayName}, this is Awan Rental Service regarding your booking ${booking.bookingNumber}.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  WhatsApp
                </a>
              </Button>
            )}
          </div>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Submitted {formatDate(booking.createdAt)}
          {booking.confirmedAt && <> · Confirmed {formatDate(booking.confirmedAt)}</>}
          {booking.completedAt && <> · Completed {formatDate(booking.completedAt)}</>}
          {booking.cancelledAt && <> · Cancelled {formatDate(booking.cancelledAt)}</>}
        </p>
      </div>

      {/* Status actions */}
      <Card variant="default" padding="md">
        <CardContent className="space-y-3">
          <h2 className="font-heading text-lg font-semibold text-gray-900 dark:text-white">
            Status
          </h2>
          <BookingStatusActions
            bookingId={booking.id}
            currentStatus={booking.status}
            allowed={allowedTransitions}
          />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Customer */}
        <Card variant="default" padding="md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              Customer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="divide-y divide-gray-100 dark:divide-gray-800">
              <Row label="Name" value={displayName} />
              <Row label="Email" value={displayEmail || '—'} />
              <Row label="Phone" value={booking.customerPhone || booking.user.phone || '—'} />
              <Row label="WhatsApp" value={booking.customerWhatsApp || booking.customerPhone || '—'} />
              <Row label="Flight Number" value={booking.flightNumber || '—'} />
              <Row label="Passengers" value={booking.passengers ?? '—'} />
              <Row label="Luggage" value={booking.luggage ?? '—'} />
              <Row label="Account" value={booking.user.email} />
            </dl>
          </CardContent>
        </Card>

        {/* Vehicle */}
        <Card variant="default" padding="md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5 text-gray-400" aria-hidden="true" />
              Vehicle
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <dl className="divide-y divide-gray-100 dark:divide-gray-800">
              <Row label="Vehicle" value={booking.vehicle.name} />
              <Row
                label="Details"
                value={`${booking.vehicle.brand} ${booking.vehicle.model} · ${booking.vehicle.year} · ${getVehicleCategoryLabel(booking.vehicle.category)}`}
              />
              <Row label="Plate" value={booking.vehicle.licensePlate} />
              <Row
                label="Booked Rate"
                value={`${formatCurrency(Number(booking.dailyRate))} / day`}
              />
            </dl>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/vehicles/${booking.vehicle.slug}`}>
                  <ExternalLink className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  Public Page
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/admin/vehicles/${booking.vehicle.id}/edit`}>Edit Vehicle</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Trip */}
        <Card variant="default" padding="md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarRange className="h-5 w-5 text-gray-400" aria-hidden="true" />
              Trip
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="divide-y divide-gray-100 dark:divide-gray-800">
              <Row label="Rental Type" value={rentalTypeLabel(booking.rentalType)} />
              <Row
                label="Pickup"
                value={
                  <>
                    {formatDate(booking.startDate)} at {booking.pickupTime} — {booking.pickupLocation}
                  </>
                }
              />
              <Row
                label="Return"
                value={
                  <>
                    {formatDate(booking.endDate)} at {booking.dropoffTime} — {booking.dropoffLocation}
                  </>
                }
              />
              <Row label="Chauffeur" value={booking.driverRequired ? 'Required' : 'Not required'} />
              <Row
                label="Special Requests"
                value={booking.specialRequests || '—'}
              />
            </dl>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card variant="default" padding="md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-gray-400" aria-hidden="true" />
              Pricing &amp; Payment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <dl className="divide-y divide-gray-100 dark:divide-gray-800">
              <Row label="Duration" value={`${booking.totalDays} day(s)`} />
              <Row label="Subtotal" value={formatCurrency(Number(booking.subtotal))} />
              <Row label="Discount" value={formatCurrency(Number(booking.discount))} />
              <Row label="Tax" value={formatCurrency(Number(booking.tax))} />
              <Row
                label="Total"
                value={
                  <span className="font-semibold">{formatCurrency(Number(booking.totalAmount))}</span>
                }
              />
              <Row label="Paid" value={formatCurrency(Number(booking.paidAmount))} />
              <Row
                label="Payment Status"
                value={<Badge variant={booking.paymentStatus === 'PAID' ? 'success' : 'warning'}>{booking.paymentStatus}</Badge>}
              />
            </dl>

            {booking.payments.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Payment History
                </h3>
                <ul className="space-y-2">
                  {booking.payments.map((payment) => (
                    <li
                      key={payment.id}
                      className="rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:bg-gray-800/60 dark:text-gray-300"
                    >
                      {formatCurrency(Number(payment.amount))} · {payment.method} ·{' '}
                      {formatDate(payment.paidAt)}
                      {payment.reference && <> · {payment.reference}</>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Admin notes */}
      <Card variant="default" padding="md">
        <CardHeader>
          <CardTitle>Admin Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <BookingNotesForm bookingId={booking.id} existingNotes={booking.adminNotes} />
        </CardContent>
      </Card>

      {booking.cancellationReason && (
        <Card variant="default" padding="md">
          <CardHeader>
            <CardTitle>Cancellation Reason</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 dark:text-gray-300">{booking.cancellationReason}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
