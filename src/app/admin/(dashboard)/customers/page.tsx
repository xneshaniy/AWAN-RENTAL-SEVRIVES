import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { formatDate, cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Search, Users, Phone, MessageCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Customers',
  robots: { index: false, follow: false },
};

interface CustomersPageProps {
  searchParams: { q?: string; filter?: string; page?: string };
}

interface CustomerRow {
  email: string;
  name: string | null;
  phone: string | null;
  whatsapp: string | null;
  bookingCount: number;
  lastBookingAt: Date | null;
  source: 'booking' | 'contact' | 'both';
}

/**
 * Customers are DERIVED from existing data - user accounts, bookings and
 * contact messages - never duplicated: everything is merged on the unique
 * customer email. Read-only view; only admin/staff sessions can reach it.
 */
export default async function AdminCustomersPage({ searchParams }: CustomersPageProps) {
  const query = searchParams.q?.trim();
  const filter = searchParams.filter === 'bookings' || searchParams.filter === 'contact' ? searchParams.filter : 'all';
  const currentPage = Math.max(1, parseInt(searchParams.page || '1', 10) || 1);
  const pageSize = 20;

  const searchWhere = query
    ? {
        OR: [
          { name: { contains: query, mode: 'insensitive' as const } },
          { email: { contains: query, mode: 'insensitive' as const } },
          { phone: { contains: query, mode: 'insensitive' as const } },
        ],
      }
    : undefined;

  const [users, messages, bookingStats] = await Promise.all([
    prisma.user.findMany({
      where: { role: 'CUSTOMER', ...(searchWhere ? { AND: [searchWhere] } : {}) },
      select: { name: true, email: true, phone: true },
    }),
    prisma.contactMessage.findMany({
      where: searchWhere ? { AND: [searchWhere] } : {},
      select: { name: true, email: true, phone: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 500,
    }),
    prisma.booking.groupBy({
      by: ['customerEmail'],
      where: { customerEmail: { not: null } },
      _count: { _all: true },
      _max: { createdAt: true },
    }),
  ]);

  const statsByEmail = new Map<string, { count: number; last: Date | null }>();
  for (const stat of bookingStats) {
    if (stat.customerEmail) {
      statsByEmail.set(stat.customerEmail.toLowerCase(), {
        count: stat._count._all,
        last: stat._max.createdAt ?? null,
      });
    }
  }

  // Merge on lowercase email so one person is never listed twice.
  const merged = new Map<string, CustomerRow>();
  for (const user of users) {
    const key = user.email.toLowerCase();
    const stat = statsByEmail.get(key);
    merged.set(key, {
      email: user.email,
      name: user.name,
      phone: user.phone,
      whatsapp: user.phone,
      bookingCount: stat?.count ?? 0,
      lastBookingAt: stat?.last ?? null,
      source: stat ? 'booking' : 'contact',
    });
  }
  for (const message of messages) {
    // Airport-transfer requests carry no email - they cannot form a customer
    // record on their own (records are keyed by email).
    if (!message.email) continue;
    const key = message.email.toLowerCase();
    const existing = merged.get(key);
    if (existing) {
      if (existing.source === 'contact') existing.source = 'both';
      if (!existing.phone) existing.phone = message.phone;
      if (!existing.name) existing.name = message.name;
      continue;
    }
    const stat = statsByEmail.get(key);
    merged.set(key, {
      email: message.email,
      name: message.name,
      phone: message.phone,
      whatsapp: message.phone,
      bookingCount: stat?.count ?? 0,
      lastBookingAt: stat?.last ?? null,
      source: stat ? 'booking' : 'contact',
    });
  }
  // Customers known only from bookings but without a user/message row.
  statsByEmail.forEach((stat, key) => {
    if (!merged.has(key)) {
      merged.set(key, {
        email: key,
        name: null,
        phone: null,
        whatsapp: null,
        bookingCount: stat.count,
        lastBookingAt: stat.last,
        source: 'booking',
      });
    }
  });

  let rows = Array.from(merged.values());
  if (filter === 'bookings') rows = rows.filter((row) => row.bookingCount > 0);
  if (filter === 'contact') rows = rows.filter((row) => row.bookingCount === 0);

  rows.sort((a, b) => {
    if (b.bookingCount !== a.bookingCount) return b.bookingCount - a.bookingCount;
    return (a.name || a.email).localeCompare(b.name || b.email);
  });

  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageRows = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const paramsFor = (page: number) => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (filter !== 'all') params.set('filter', filter);
    if (page > 1) params.set('page', String(page));
    const qs = params.toString();
    return qs ? `/admin/customers?${qs}` : '/admin/customers';
  };

  const filterLink = (value: string) => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (value !== 'all') params.set('filter', value);
    const qs = params.toString();
    return qs ? `/admin/customers?${qs}` : '/admin/customers';
  };

  const hasFilters = Boolean(query) || filter !== 'all';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-gray-900 dark:text-white">Customers</h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Customer records are built from bookings and contact messages, merged by email - one
          person, one row. Visible to admin/staff accounts only.
        </p>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <form action="/admin/customers" method="get" className="flex flex-1 items-center gap-3">
          {filter !== 'all' && <input type="hidden" name="filter" value={filter} />}
          <div className="relative w-full max-w-sm">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              aria-hidden="true"
            />
            <input
              type="search"
              name="q"
              defaultValue={query ?? ''}
              placeholder="Search name, email or phone..."
              aria-label="Search customers"
              className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-9 pr-4 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <button
            type="submit"
            className="rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white"
          >
            Search
          </button>
        </form>

        <nav className="flex gap-2" aria-label="Customer filters">
          {(
            [
              { value: 'all', label: 'All' },
              { value: 'bookings', label: 'With Bookings' },
              { value: 'contact', label: 'Contact Only' },
            ] as const
          ).map((entry) => (
            <Link
              key={entry.value}
              href={filterLink(entry.value)}
              aria-current={filter === entry.value ? 'page' : undefined}
              className={cn(
                'rounded-xl px-4 py-2 text-sm font-medium transition-colors',
                filter === entry.value
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              )}
            >
              {entry.label}
            </Link>
          ))}
        </nav>
      </div>

      <Card variant="default" padding="md">
        <CardContent>
          {pageRows.length === 0 ? (
            <div className="py-14 text-center">
              <Users className="mx-auto mb-4 h-12 w-12 text-gray-300 dark:text-gray-600" aria-hidden="true" />
              <p className="mb-1 font-medium text-gray-700 dark:text-gray-300">
                {hasFilters ? 'No customers match your search.' : 'No customers yet.'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {hasFilters
                  ? 'Try a different search term or clear the filters.'
                  : 'Customers appear here as soon as bookings or contact messages exist.'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                      <th className="pb-3 font-medium">Customer</th>
                      <th className="pb-3 font-medium">Email</th>
                      <th className="pb-3 font-medium">Phone</th>
                      <th className="pb-3 font-medium">WhatsApp</th>
                      <th className="pb-3 font-medium">Bookings</th>
                      <th className="pb-3 font-medium">Last Booking</th>
                      <th className="pb-3 font-medium">Source</th>
                      <th className="w-24 pb-3 text-right font-medium">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {pageRows.map((row) => (
                      <tr key={row.email} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="py-4">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {row.name || '—'}
                          </div>
                        </td>
                        <td className="py-4 text-sm text-gray-700 dark:text-gray-300">
                          {row.email}
                        </td>
                        <td className="py-4 text-sm text-gray-700 dark:text-gray-300">
                          {row.phone ? (
                            <span className="inline-flex items-center gap-1">
                              <Phone className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />
                              {row.phone}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="py-4 text-sm text-gray-700 dark:text-gray-300">
                          {row.whatsapp ? (
                            <span className="inline-flex items-center gap-1">
                              <MessageCircle className="h-3.5 w-3.5 text-green-600" aria-hidden="true" />
                              {row.whatsapp}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="py-4">
                          <Badge variant={row.bookingCount > 0 ? 'info' : 'outline'}>
                            {row.bookingCount}
                          </Badge>
                        </td>
                        <td className="py-4 text-sm text-gray-500 dark:text-gray-400">
                          {row.lastBookingAt ? formatDate(row.lastBookingAt) : '—'}
                        </td>
                        <td className="py-4">
                          <Badge variant={row.source === 'both' ? 'success' : 'outline'}>
                            {row.source === 'booking' ? 'Booking' : row.source === 'contact' ? 'Contact' : 'Booking + Contact'}
                          </Badge>
                        </td>
                        <td className="py-4 text-right">
                          <Link
                            href={`/admin/customers/${encodeURIComponent(row.email)}`}
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

              {totalPages > 1 && (
                <nav
                  className="mt-6 flex items-center justify-center gap-3"
                  aria-label="Customer pagination"
                >
                  <Link
                    href={paramsFor(currentPage - 1)}
                    className={cn(
                      'rounded-xl border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800',
                      currentPage === 1 && 'pointer-events-none opacity-40'
                    )}
                  >
                    Previous
                  </Link>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Page {currentPage} of {totalPages} ({total} total)
                  </span>
                  <Link
                    href={paramsFor(currentPage + 1)}
                    className={cn(
                      'rounded-xl border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800',
                      currentPage === totalPages && 'pointer-events-none opacity-40'
                    )}
                  >
                    Next
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
