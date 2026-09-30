import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { rentalTypeLabel } from '@/lib/whatsapp';
import { BOOKING_STATUS_LABELS } from '@/lib/booking-status';
import { Card, CardContent } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { Search, Phone, MessageCircle, ChevronLeft, ChevronRight, Eye, CalendarX2 } from 'lucide-react';
import type { BookingStatus } from '@prisma/client';

export const metadata: Metadata = {
  title: 'Bookings',
  robots: { index: false, follow: false },
};

interface BookingsPageProps {
  searchParams: {
    status?: string;
    search?: string;
    page?: string;
    vehicleId?: string;
    dateFrom?: string;
    dateTo?: string;
  };
}

const STATUSES = Object.keys(BOOKING_STATUS_LABELS) as BookingStatus[];

function isValidDate(value?: string) {
  return Boolean(value) && !Number.isNaN(new Date(value!).getTime());
}

/**
 * Booking list backed by PostgreSQL with filters for status, free-text
 * search, vehicle and pickup date range. All filters use a plain GET form,
 * so they work without JavaScript.
 */
export default async function AdminBookingsPage({ searchParams }: BookingsPageProps) {
  const status = STATUSES.includes(searchParams.status as BookingStatus)
    ? (searchParams.status as BookingStatus)
    : undefined;
  const search = searchParams.search?.trim() || undefined;
  const vehicleId = searchParams.vehicleId || undefined;
  const dateFrom = searchParams.dateFrom;
  const dateTo = searchParams.dateTo;
  const currentPage = Math.max(1, parseInt(searchParams.page || '1', 10) || 1);
  const limit = 20;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (vehicleId) where.vehicleId = vehicleId;
  if (search) {
    where.OR = [
      { bookingNumber: { contains: search, mode: 'insensitive' } },
      { customerName: { contains: search, mode: 'insensitive' } },
      { customerEmail: { contains: search, mode: 'insensitive' } },
      { customerPhone: { contains: search, mode: 'insensitive' } },
      { pickupLocation: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (isValidDate(dateFrom) || isValidDate(dateTo)) {
    const range: { gte?: Date; lte?: Date } = {};
    if (isValidDate(dateFrom)) range.gte = new Date(`${dateFrom}T00:00:00`);
    if (isValidDate(dateTo)) range.lte = new Date(`${dateTo}T23:59:59`);
    where.startDate = range;
  }

  const [bookings, total, statusStats, vehicles] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        vehicle: { select: { name: true, brand: true, slug: true } },
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (currentPage - 1) * limit,
      take: limit,
    }),
    prisma.booking.count({ where }),
    prisma.booking.groupBy({ by: ['status'], _count: { status: true } }),
    prisma.vehicle.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  const totalPages = Math.ceil(total / limit);
  const statusCounts = statusStats.reduce<Record<string, number>>((acc, entry) => {
    acc[entry.status] = entry._count.status;
    return acc;
  }, {});

  const hasFilters = Boolean(search || status || vehicleId || dateFrom || dateTo);

  // Rebuild the current filter set as URLSearchParams for pagination links.
  const paramsForPage = (page: number) => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (status) params.set('status', status);
    if (vehicleId) params.set('vehicleId', vehicleId);
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    if (page > 1) params.set('page', String(page));
    const qs = params.toString();
    return qs ? `/admin/bookings?${qs}` : '/admin/bookings';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-gray-900 dark:text-white">
          Booking Management
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Search and manage every booking request. Status changes are saved to PostgreSQL
          immediately.
        </p>
      </div>

      {/* Filters */}
      <Card variant="default" padding="md">
        <CardContent>
          <form action="/admin/bookings" method="get" className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            <div className="xl:col-span-2">
              <label htmlFor="booking-search" className="sr-only">
                Search bookings
              </label>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                  aria-hidden="true"
                />
                <input
                  id="booking-search"
                  type="search"
                  name="search"
                  defaultValue={search ?? ''}
                  placeholder="Reference, customer, email, phone..."
                  className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-9 pr-4 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>
            <select
              name="status"
              defaultValue={status ?? ''}
              aria-label="Filter by status"
              className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              <option value="">All Statuses</option>
              {STATUSES.map((value) => (
                <option key={value} value={value}>
                  {BOOKING_STATUS_LABELS[value]} ({statusCounts[value] || 0})
                </option>
              ))}
            </select>
            <select
              name="vehicleId"
              defaultValue={vehicleId ?? ''}
              aria-label="Filter by vehicle"
              className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              <option value="">All Vehicles</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.name}
                </option>
              ))}
            </select>
            <div>
              <label htmlFor="date-from" className="sr-only">
                Pickup from
              </label>
              <input
                id="date-from"
                type="date"
                name="dateFrom"
                defaultValue={dateFrom ?? ''}
                aria-label="Pickup date from"
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div className="flex gap-2">
              <input
                type="date"
                name="dateTo"
                defaultValue={dateTo ?? ''}
                aria-label="Pickup date to"
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
              <button
                type="submit"
                className="whitespace-nowrap rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white"
              >
                Filter
              </button>
            </div>
          </form>
          {hasFilters && (
            <div className="mt-3">
              <Link
                href="/admin/bookings"
                className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
              >
                Clear all filters
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      <Card variant="default" padding="md">
        <CardContent>
          {bookings.length === 0 ? (
            <div className="py-14 text-center">
              <CalendarX2
                className="mx-auto mb-4 h-12 w-12 text-gray-300 dark:text-gray-600"
                aria-hidden="true"
              />
              <p className="mb-1 font-medium text-gray-700 dark:text-gray-300">
                {hasFilters ? 'No bookings match your filters.' : 'No bookings yet.'}
              </p>
              <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
                {hasFilters
                  ? 'Try widening the date range or clearing the filters.'
                  : 'Booking requests submitted through the website will appear here.'}
              </p>
              {hasFilters && (
                <Link
                  href="/admin/bookings"
                  className="inline-flex items-center justify-center rounded-xl border border-gray-300 px-5 py-2.5 font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Clear filters
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                      <th className="pb-3 font-medium">Reference</th>
                      <th className="pb-3 font-medium">Customer</th>
                      <th className="pb-3 font-medium">Vehicle</th>
                      <th className="pb-3 font-medium">Rental Type</th>
                      <th className="pb-3 font-medium">Pickup</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium">Amount</th>
                      <th className="pb-3 font-medium">Created</th>
                      <th className="w-32 pb-3 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {bookings.map((booking) => {
                      const phoneDigits = (booking.customerPhone || '').replace(/\D/g, '');
                      return (
                        <tr key={booking.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="py-4 font-mono text-sm text-gray-900 dark:text-white">
                            {booking.bookingNumber}
                          </td>
                          <td className="py-4 text-sm text-gray-700 dark:text-gray-300">
                            <div className="font-medium">
                              {booking.user?.name || booking.customerName || 'Guest'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {booking.user?.email || booking.customerEmail}
                            </div>
                            <div className="text-xs text-gray-400">{booking.customerPhone}</div>
                          </td>
                          <td className="py-4 text-sm text-gray-700 dark:text-gray-300">
                            {booking.vehicle?.name || 'N/A'}
                          </td>
                          <td className="py-4">
                            <span className="rounded-full border border-gray-200 px-2.5 py-1 text-xs text-gray-600 dark:border-gray-600 dark:text-gray-400">
                              {rentalTypeLabel(booking.rentalType)}
                            </span>
                          </td>
                          <td className="py-4 text-sm text-gray-700 dark:text-gray-300">
                            <div>{formatDate(booking.startDate)}</div>
                            <div className="text-xs text-gray-500">{booking.pickupTime}</div>
                          </td>
                          <td className="py-4">
                            <StatusBadge status={booking.status} />
                          </td>
                          <td className="py-4 font-medium text-gray-900 dark:text-white">
                            {formatCurrency(Number(booking.totalAmount))}
                          </td>
                          <td className="py-4 text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(booking.createdAt)}
                          </td>
                          <td className="py-4">
                            <div className="flex items-center justify-end gap-1">
                              <Link
                                href={`/admin/bookings/${booking.id}`}
                                title="View booking details"
                                aria-label={`View booking ${booking.bookingNumber}`}
                                className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-primary-600 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-primary-400"
                              >
                                <Eye className="h-4 w-4" aria-hidden="true" />
                              </Link>
                              {phoneDigits && (
                                <>
                                  <a
                                    href={`tel:${booking.customerPhone}`}
                                    title="Call customer"
                                    aria-label={`Call ${booking.customerName || booking.user?.name || 'customer'}`}
                                    className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-primary-600 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-primary-400"
                                  >
                                    <Phone className="h-4 w-4" aria-hidden="true" />
                                  </a>
                                  <a
                                    href={`https://wa.me/${phoneDigits}?text=${encodeURIComponent(
                                      `Hello, this is Awan Rental Service regarding your booking ${booking.bookingNumber}.`
                                    )}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="Message customer on WhatsApp"
                                    aria-label={`WhatsApp ${booking.customerName || booking.user?.name || 'customer'}`}
                                    className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-green-600 dark:text-gray-400 dark:hover:bg-gray-800"
                                  >
                                    <MessageCircle className="h-4 w-4" aria-hidden="true" />
                                  </a>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <nav
                  className="mt-6 flex items-center justify-center gap-3"
                  aria-label="Bookings pagination"
                >
                  <Link
                    href={paramsForPage(currentPage - 1)}
                    aria-disabled={currentPage === 1 ? true : undefined}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-xl border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800',
                      currentPage === 1 && 'pointer-events-none opacity-40'
                    )}
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                    Previous
                  </Link>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Page {currentPage} of {totalPages} ({total} total)
                  </span>
                  <Link
                    href={paramsForPage(currentPage + 1)}
                    aria-disabled={currentPage === totalPages ? true : undefined}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-xl border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800',
                      currentPage === totalPages && 'pointer-events-none opacity-40'
                    )}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </nav>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
