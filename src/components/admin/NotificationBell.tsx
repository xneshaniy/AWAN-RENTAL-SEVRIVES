'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  BellOff,
  CalendarPlus,
  RefreshCw,
  Mail,
  CheckCheck,
  AlertCircle,
  Inbox,
  Loader2,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/components/admin/NotificationProvider';
import type { AdminNotification, AdminNotificationType } from '@/types/notifications';

const TYPE_META: Record<AdminNotificationType, { label: string; icon: LucideIcon }> = {
  NEW_BOOKING: { label: 'New Booking', icon: CalendarPlus },
  BOOKING_STATUS_CHANGED: { label: 'Booking Status Changed', icon: RefreshCw },
  NEW_CONTACT_MESSAGE: { label: 'New Contact Message', icon: Mail },
};

/**
 * Client-local relative timestamp ("2 minutes ago").
 *
 * Deliberately NOT a poll: it is only re-evaluated when the list changes or
 * while the panel is open, so the bell performs no background work at all -
 * nothing here fetches data on a timer.
 */
function formatRelativeTime(iso: string, now: number): string {
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return '';
  const seconds = Math.max(0, Math.floor((now - then) / 1000));

  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds} seconds ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;

  return new Date(then).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * The admin/staff notification bell: unread badge, dropdown panel, mark-read
 * controls and the live connection indicator.
 *
 * Authorization is NOT done here - the panel only ever renders data that
 * `/api/notifications` already returned from a role-gated query. Hiding the
 * bell would be cosmetic; the server is what actually enforces access.
 */
export function NotificationBell() {
  const router = useRouter();
  const { notifications, unread, status, connected, markRead, markAllRead, refresh } =
    useNotifications();

  const [open, setOpen] = useState(false);
  const [, setTick] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Re-evaluate "x minutes ago" only while someone is actually looking at it.
  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => setTick((n) => n + 1), 15_000);
    return () => clearInterval(id);
  }, [open]);

  const close = useCallback((returnFocus = true) => {
    setOpen(false);
    if (returnFocus) buttonRef.current?.focus();
  }, []);

  // Escape closes the panel and hands focus back to the bell.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, close]);

  // Click/tap outside closes it.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  // Move focus into the panel when it opens (keyboard/screen-reader users).
  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open]);

  const handleOpenItem = async (item: AdminNotification) => {
    close(false);
    if (!item.read) await markRead([item.id]);
    if (item.link) router.push(item.link);
  };

  const badgeLabel =
    unread > 0 ? `Notifications, ${unread} unread` : 'Notifications, none unread';

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={badgeLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={cn(
          'relative rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100',
          'dark:text-gray-300 dark:hover:bg-gray-800',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2'
        )}
      >
        <Bell className="h-5 w-5" aria-hidden={true} />
        {unread > 0 && (
          // `aria-hidden` because the count is already in the button label -
          // announcing it twice would be noise for screen readers.
          <span
            aria-hidden={true}
            className={cn(
              'absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center',
              'rounded-full bg-primary-600 px-1 text-[10px] font-bold leading-none text-white',
              'ring-2 ring-white dark:ring-gray-900'
            )}
          >
            {unread > 99 ? '99+' : unread}
          </span>
        )}
        {!connected && status === 'ready' && (
          <span
            aria-hidden={true}
            className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-amber-500"
          />
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Notifications"
          tabIndex={-1}
          className={cn(
            'absolute right-0 top-full z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden',
            'rounded-xl border border-gray-200 bg-white shadow-xl',
            'dark:border-gray-700 dark:bg-gray-900',
            'focus:outline-none sm:w-96'
          )}
        >
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-sm font-semibold text-gray-900 dark:text-white">
                Notifications
              </h2>
              <span
                className={cn(
                  'flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium',
                  connected
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                )}
              >
                <span
                  className={cn(
                    'h-1.5 w-1.5 rounded-full',
                    connected ? 'bg-emerald-500' : 'bg-amber-500'
                  )}
                  aria-hidden={true}
                />
                {connected ? 'Live' : 'Reconnecting'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => void markAllRead()}
              disabled={unread === 0}
              className={cn(
                'flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium',
                'text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50',
                'dark:text-gray-300 dark:hover:bg-gray-800',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500'
              )}
            >
              <CheckCheck className="h-3.5 w-3.5" aria-hidden={true} />
              Mark all read
            </button>
          </div>

          <div className="max-h-[60vh] overflow-y-auto overscroll-contain">
            {status === 'loading' && notifications.length === 0 && (
              <div className="flex flex-col items-center gap-2 px-4 py-10 text-gray-500 dark:text-gray-400">
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden={true} />
                <p className="text-sm">Loading notifications…</p>
              </div>
            )}

            {status === 'error' && notifications.length === 0 && (
              <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
                <AlertCircle className="h-6 w-6 text-red-500" aria-hidden={true} />
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Couldn&apos;t load notifications.
                </p>
                <button
                  type="button"
                  onClick={() => void refresh()}
                  className={cn(
                    'rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white',
                    'hover:bg-primary-700 focus:outline-none focus-visible:ring-2',
                    'focus-visible:ring-primary-500 focus-visible:ring-offset-2'
                  )}
                >
                  Try again
                </button>
              </div>
            )}

            {notifications.length === 0 && status !== 'loading' && status !== 'error' && (
              <div className="flex flex-col items-center gap-2 px-4 py-10 text-center text-gray-500 dark:text-gray-400">
                <Inbox className="h-6 w-6" aria-hidden={true} />
                <p className="text-sm font-medium">You&apos;re all caught up</p>
                <p className="text-xs">New bookings and messages will appear here.</p>
              </div>
            )}

            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {notifications.map((item) => {
                const meta = TYPE_META[item.type] ?? TYPE_META.NEW_BOOKING;
                const Icon = meta.icon;
                return (
                  <li key={item.id}>
                    <div
                      className={cn(
                        'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors',
                        'hover:bg-gray-50 dark:hover:bg-gray-800/60',
                        !item.read && 'bg-primary-50/50 dark:bg-primary-900/10'
                      )}
                    >
                      <span
                        className={cn(
                          'mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg',
                          'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300'
                        )}
                        aria-hidden={true}
                      >
                        <Icon className="h-4 w-4" />
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                            {meta.label}
                          </span>
                          {!item.read && (
                            <span className="flex items-center gap-1 text-[10px] font-semibold text-primary-600 dark:text-primary-400">
                              <span
                                className="h-1.5 w-1.5 rounded-full bg-primary-600"
                                aria-hidden={true}
                              />
                              <span className="sr-only">Unread</span>
                              Unread
                            </span>
                          )}
                        </div>

                        <p
                          className={cn(
                            'mt-1 break-words text-sm text-gray-900 dark:text-white',
                            !item.read && 'font-semibold'
                          )}
                        >
                          {item.title}
                        </p>
                        <p className="mt-0.5 break-words text-xs text-gray-600 dark:text-gray-400">
                          {item.message}
                        </p>

                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          <time
                            dateTime={item.createdAt}
                            className="text-[11px] text-gray-500 dark:text-gray-400"
                          >
                            {formatRelativeTime(item.createdAt, Date.now())}
                          </time>
                          {item.link && (
                            <button
                              type="button"
                              onClick={() => void handleOpenItem(item)}
                              className={cn(
                                'rounded text-[11px] font-semibold text-primary-600',
                                'hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300',
                                'focus:outline-none focus-visible:underline'
                              )}
                            >
                              View →
                            </button>
                          )}
                        </div>
                      </div>

                      {!item.read && (
                        <button
                          type="button"
                          onClick={() => void markRead([item.id])}
                          aria-label={`Mark notification "${item.title}" as read`}
                          title="Mark as read"
                          className={cn(
                            'mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg',
                            'text-gray-400 hover:bg-gray-200 hover:text-gray-600',
                            'dark:hover:bg-gray-700 dark:hover:text-gray-300',
                            'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500'
                          )}
                        >
                          <CheckCheck className="h-4 w-4" aria-hidden={true} />
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {notifications.length > 0 && unread === 0 && (
            <div className="flex items-center justify-center gap-1.5 border-t border-gray-200 bg-gray-50 px-4 py-2 text-[11px] text-gray-500 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-400">
              <BellOff className="h-3 w-3" aria-hidden={true} />
              No unread notifications
            </div>
          )}
        </div>
      )}
    </div>
  );
}
