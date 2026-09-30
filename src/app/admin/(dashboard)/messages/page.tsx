import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { formatDate, cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Search, MailOpen, Inbox } from 'lucide-react';
import type { ContactMessageStatus } from '@prisma/client';

export const metadata: Metadata = {
  title: 'Messages',
  robots: { index: false, follow: false },
};

interface MessagesPageProps {
  searchParams: { q?: string; status?: string; view?: string; page?: string };
}

const STATUS_VALUES: ContactMessageStatus[] = ['OPEN', 'RESOLVED', 'ARCHIVED'];

/**
 * Inbox of contact-form messages stored in the ContactMessage table.
 * Filters (search, status, unread) are plain GET parameters - no JS needed.
 */
export default async function AdminMessagesPage({ searchParams }: MessagesPageProps) {
  const query = searchParams.q?.trim();
  const status = STATUS_VALUES.includes(searchParams.status as ContactMessageStatus)
    ? (searchParams.status as ContactMessageStatus)
    : undefined;
  const view = searchParams.view === 'unread' ? 'unread' : 'all';
  const currentPage = Math.max(1, parseInt(searchParams.page || '1', 10) || 1);
  const limit = 25;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (view === 'unread') where.isRead = false;
  if (query) {
    where.OR = [
      { name: { contains: query, mode: 'insensitive' } },
      { email: { contains: query, mode: 'insensitive' } },
      { subject: { contains: query, mode: 'insensitive' } },
      { message: { contains: query, mode: 'insensitive' } },
    ];
  }

  const [messages, total, unreadCount, openCount] = await Promise.all([
    prisma.contactMessage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (currentPage - 1) * limit,
      take: limit,
    }),
    prisma.contactMessage.count({ where }),
    prisma.contactMessage.count({ where: { isRead: false, status: { not: 'ARCHIVED' } } }),
    prisma.contactMessage.count({ where: { status: 'OPEN' } }),
  ]);

  const totalPages = Math.ceil(total / limit);
  const hasFilters = Boolean(query || status || view === 'unread');

  const linkWith = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const q = 'q' in overrides ? overrides.q : query;
    const st = 'status' in overrides ? overrides.status : status;
    const vw = 'view' in overrides ? overrides.view : view;
    const pg = 'page' in overrides ? overrides.page : undefined;
    if (q) params.set('q', q);
    if (st) params.set('status', st);
    if (vw && vw !== 'all') params.set('view', vw);
    if (pg) params.set('page', pg);
    const qs = params.toString();
    return qs ? `/admin/messages?${qs}` : '/admin/messages';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-gray-900 dark:text-white">Messages</h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          {unreadCount} unread · {openCount} open. Messages submitted through the website&apos;s
          contact forms.
        </p>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <form action="/admin/messages" method="get" className="flex flex-1 items-center gap-3">
          {status && <input type="hidden" name="status" value={status} />}
          {view === 'unread' && <input type="hidden" name="view" value="unread" />}
          <div className="relative w-full max-w-sm">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              aria-hidden="true"
            />
            <input
              type="search"
              name="q"
              defaultValue={query ?? ''}
              placeholder="Search name, email, subject..."
              aria-label="Search messages"
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

        <nav className="flex flex-wrap gap-2" aria-label="Message filters">
          <Link
            href={linkWith({ view: 'all', status: undefined, page: undefined })}
            aria-current={view === 'all' && !status ? 'page' : undefined}
            className={cn(
              'rounded-xl px-4 py-2 text-sm font-medium transition-colors',
              view === 'all' && !status
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            )}
          >
            All
          </Link>
          <Link
            href={linkWith({ view: 'unread', status: undefined, page: undefined })}
            aria-current={view === 'unread' ? 'page' : undefined}
            className={cn(
              'rounded-xl px-4 py-2 text-sm font-medium transition-colors',
              view === 'unread'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            )}
          >
            Unread ({unreadCount})
          </Link>
          {STATUS_VALUES.map((value) => (
            <Link
              key={value}
              href={linkWith({ status: value, view: 'all', page: undefined })}
              aria-current={status === value ? 'page' : undefined}
              className={cn(
                'rounded-xl px-4 py-2 text-sm font-medium transition-colors',
                status === value
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              )}
            >
              {value.charAt(0) + value.slice(1).toLowerCase()}
            </Link>
          ))}
        </nav>
      </div>

      <Card variant="default" padding="md">
        <CardContent>
          {messages.length === 0 ? (
            <div className="py-14 text-center">
              <Inbox className="mx-auto mb-4 h-12 w-12 text-gray-300 dark:text-gray-600" aria-hidden="true" />
              <p className="mb-1 font-medium text-gray-700 dark:text-gray-300">
                {hasFilters ? 'No messages match your filters.' : 'No messages yet.'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {hasFilters
                  ? 'Try clearing the filters.'
                  : 'Messages sent through the contact form will appear here.'}
              </p>
              {hasFilters && (
                <div className="mt-4">
                  <Link
                    href="/admin/messages"
                    className="inline-flex items-center justify-center rounded-xl border border-gray-300 px-5 py-2.5 font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    Clear filters
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <>
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {messages.map((message) => (
                  <li key={message.id}>
                    <Link
                      href={`/admin/messages/${message.id}`}
                      className={cn(
                        'flex flex-col gap-1 px-2 py-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 sm:flex-row sm:items-center sm:justify-between',
                        !message.isRead && 'bg-primary-50/50 dark:bg-primary-900/10'
                      )}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          {!message.isRead && (
                            <span
                              className="h-2.5 w-2.5 flex-shrink-0 rounded-full bg-primary-600"
                              aria-label="Unread"
                            />
                          )}
                          <span
                            className={cn(
                              'truncate text-sm text-gray-900 dark:text-white',
                              !message.isRead && 'font-semibold'
                            )}
                          >
                            {message.name} · {message.subject}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-sm text-gray-500 dark:text-gray-400">
                          {message.message}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                          {message.email ? `${message.email} · ` : ''}
                          {formatDate(message.createdAt)}
                        </p>
                      </div>
                      <div className="flex flex-shrink-0 items-center gap-2">
                        <Badge
                          variant={
                            message.status === 'RESOLVED'
                              ? 'success'
                              : message.status === 'ARCHIVED'
                                ? 'outline'
                                : 'warning'
                          }
                        >
                          {message.status}
                        </Badge>
                        {!message.isRead && (
                          <MailOpen className="h-4 w-4 text-gray-300 dark:text-gray-600" aria-hidden="true" />
                        )}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>

              {totalPages > 1 && (
                <nav
                  className="mt-6 flex items-center justify-center gap-3"
                  aria-label="Message pagination"
                >
                  <Link
                    href={linkWith({ page: String(currentPage - 1) })}
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
                    href={linkWith({ page: String(currentPage + 1) })}
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
