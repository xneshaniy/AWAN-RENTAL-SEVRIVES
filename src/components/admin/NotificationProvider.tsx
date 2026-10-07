'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { usePathname } from 'next/navigation';
import toast from 'react-hot-toast';
import type { AdminDashboardStats, AdminNotification } from '@/types/notifications';

/**
 * Owns the single Server-Sent Events connection for the whole admin panel.
 *
 * Design notes worth knowing before changing anything here:
 *
 * - The DATABASE is the source of truth. The stream is a low-latency wake-up
 *   call that also carries the new row. On mount and on every reconnect we
 *   re-read the server, so a tab that was offline during an event still ends
 *   up with it, and a reconnect can never invent a duplicate.
 * - Deduplication is by notification `id` in a Set. The same event arriving
 *   twice (stream replay, a refresh, two tabs) collapses to one row and one
 *   toast.
 * - Read state is never trusted from the client: every mutation returns the
 *   server-computed unread count and we adopt that value verbatim.
 */

export type NotificationStatus = 'loading' | 'ready' | 'error';

interface NotificationContextValue {
  notifications: AdminNotification[];
  unread: number;
  status: NotificationStatus;
  /** True while the SSE stream is currently open. */
  connected: boolean;
  /** Live dashboard counters, or null before the first successful load. */
  stats: AdminDashboardStats | null;
  markRead: (ids: string[]) => Promise<void>;
  markAllRead: () => Promise<void>;
  refresh: () => Promise<void>;
  refreshStats: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

/** Hard cap on rows kept in memory (newest first). */
const MAX_CACHED = 50;
/** Consecutive stream failures before we stop trusting EventSource's own retry. */
const TAKEOVER_AFTER = 3;
const MAX_BACKOFF_MS = 30_000;
/** Coalesce dashboard stat refreshes so a burst of events costs one request. */
const STATS_COALESCE_MS = 400;

const STATS_EVENT_TYPES = new Set<string>([
  'NEW_BOOKING',
  'BOOKING_STATUS_CHANGED',
  'NEW_CONTACT_MESSAGE',
]);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [status, setStatus] = useState<NotificationStatus>('loading');
  const [connected, setConnected] = useState(false);
  /**
   * The browser's own network state, tracked from the window's events.
   *
   * Merged into `connected` on the way out of this provider, so a stale SSE
   * `connected` frame that lands just after the machine went offline can no
   * longer flip the indicator back to "Live" - which is exactly the race that
   * made an offline tab keep claiming it was live.
   */
  const [online, setOnline] = useState(true);
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);

  /** Every id we have ever seen - the duplicate guard. */
  const seenRef = useRef<Set<string>>(new Set());
  /** Ids already announced, so a reconnect never re-toasts the same event. */
  const toastedRef = useRef<Set<string>>(new Set());
  const sourceRef = useRef<EventSource | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attemptsRef = useRef(0);
  const stoppedRef = useRef(false);
  /** Set by the `offline` event so `online` only reconnects when it must. */
  const wasOfflineRef = useRef(false);

  /** Latest pathname, readable from callbacks without re-subscribing. */
  const onDashboardRef = useRef(pathname === '/admin');
  onDashboardRef.current = pathname === '/admin';

  const stop = useCallback(() => {
    stoppedRef.current = true;
    if (sourceRef.current) {
      sourceRef.current.close();
      sourceRef.current = null;
    }
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    setConnected(false);
  }, []);

  /** Re-read unread count + recent rows from the database. */
  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications?limit=20', { cache: 'no-store' });
      if (res.status === 401 || res.status === 403) {
        // Session is gone: stop the stream instead of hammering a login page.
        stop();
        setStatus('error');
        return;
      }
      if (!res.ok) {
        setStatus('error');
        return;
      }
      const data = (await res.json()) as {
        notifications: AdminNotification[];
        unreadCount: number;
      };
      data.notifications.forEach((n) => seenRef.current.add(n.id));
      setNotifications(data.notifications.slice(0, MAX_CACHED));
      setUnread(data.unreadCount);
      setStatus('ready');
    } catch {
      // Network blip: keep what we have. Only report an error if nothing has
      // ever loaded successfully.
      setStatus((prev) => (prev === 'loading' ? 'error' : prev));
    }
  }, [stop]);

  /** Pull the three dashboard counters (indexed COUNT queries only). */
  const refreshStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/dashboard-stats', { cache: 'no-store' });
      if (!res.ok) return;
      setStats((await res.json()) as AdminDashboardStats);
    } catch {
      // Non-fatal: the cards keep their last known value.
    }
  }, []);

  const scheduleStatsRefresh = useCallback(() => {
    if (!onDashboardRef.current) return;
    if (statsTimerRef.current) clearTimeout(statsTimerRef.current);
    statsTimerRef.current = setTimeout(() => {
      statsTimerRef.current = null;
      void refreshStats();
    }, STATS_COALESCE_MS);
  }, [refreshStats]);

  const handleIncoming = useCallback(
    (event: AdminNotification) => {
      if (seenRef.current.has(event.id)) return;
      seenRef.current.add(event.id);

      setNotifications((prev) => [event, ...prev].slice(0, MAX_CACHED));
      // A freshly published notification is by definition unread for everyone.
      setUnread((count) => count + 1);

      if (!toastedRef.current.has(event.id)) {
        toastedRef.current.add(event.id);
        // react-hot-toast's `id` replaces rather than stacks duplicates, and
        // `whitespace-pre-line` lets the title and detail render as two lines.
        toast(`\u{1F514} ${event.title}\n${event.message}`, {
          id: `notification:${event.id}`,
          duration: 6000,
          className: 'whitespace-pre-line',
        });
      }

      if (STATS_EVENT_TYPES.has(event.type)) scheduleStatsRefresh();
    },
    [scheduleStatsRefresh]
  );

  const connect = useCallback(() => {
    if (stoppedRef.current) return;
    if (sourceRef.current) sourceRef.current.close();

    const source = new EventSource('/api/notifications/stream');
    sourceRef.current = source;

    source.onopen = () => {
      attemptsRef.current = 0;
      setConnected(true);
      // First connect or reconnect: pull anything published while we were down.
      void refresh();
      if (onDashboardRef.current) void refreshStats();
    };

    source.addEventListener('connected', () => setConnected(true));

    source.addEventListener('notification', (raw) => {
      try {
        handleIncoming(JSON.parse((raw as MessageEvent<string>).data) as AdminNotification);
      } catch {
        // Malformed frame: drop it rather than tear the whole stream down.
      }
    });

    source.onerror = () => {
      setConnected(false);
      attemptsRef.current += 1;
      if (attemptsRef.current < TAKEOVER_AFTER) return;

      // EventSource would now retry on its own schedule forever. Take over so
      // an expired session or dead network degrades into measured backoff
      // instead of an endless hot retry loop.
      source.close();
      if (sourceRef.current === source) sourceRef.current = null;

      void (async () => {
        if (stoppedRef.current) return;
        try {
          const probe = await fetch('/api/notifications?limit=1', { cache: 'no-store' });
          if (probe.status === 401 || probe.status === 403) {
            stop(); // Logged out: close and stop retrying entirely.
            return;
          }
        } catch {
          // Network still down - fall through to the backoff below.
        }
        const exponent = Math.min(attemptsRef.current - TAKEOVER_AFTER, 5);
        const delay = Math.min(MAX_BACKOFF_MS, 2_000 * 2 ** exponent);
        retryTimerRef.current = setTimeout(connect, delay);
      })();
    };
  }, [handleIncoming, refresh, refreshStats, stop]);

  // The browser learns about a lost network long before a half-open socket
  // does. An idle SSE connection stays structurally "established" once the
  // machine goes offline - there is nothing left to write, so nothing ever
  // fails - and the indicator would keep claiming "Live" while every new
  // event silently went nowhere. `offline`/`online` are the only signals that
  // arrive in time to tell the truth, and `online` doubles as an immediate
  // reconnect instead of waiting out EventSource's retry timer.
  useEffect(() => {
    const sync = () => {
      const isOnline = window.navigator.onLine;
      setOnline(isOnline);
      if (isOnline) {
        if (!wasOfflineRef.current) return;
        wasOfflineRef.current = false;
        if (stoppedRef.current) return;
        connect();
        return;
      }
      wasOfflineRef.current = true;
      setConnected(false);
    };
    sync();
    window.addEventListener('offline', sync);
    window.addEventListener('online', sync);
    return () => {
      window.removeEventListener('offline', sync);
      window.removeEventListener('online', sync);
    };
  }, [connect]);

  // Initial load + open the stream; torn down on unmount (including sign-out,
  // which navigates away and therefore closes the connection).
  useEffect(() => {
    stoppedRef.current = false;
    void refresh();
    connect();
    const retryTimer = retryTimerRef;
    const statsTimer = statsTimerRef;
    return () => {
      stop();
      if (statsTimer.current) clearTimeout(statsTimer.current);
      if (retryTimer.current) clearTimeout(retryTimer.current);
    };
  }, [connect, refresh, stop]);

  // Load counters when the dashboard mounts or is navigated to client-side.
  useEffect(() => {
    if (pathname === '/admin') void refreshStats();
  }, [pathname, refreshStats]);

  const markRead = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return;
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'read', ids }),
      });
      if (!res.ok) return;
      const data = (await res.json()) as { unreadCount: number };
      setUnread(data.unreadCount);
      setNotifications((prev) => prev.map((n) => (ids.includes(n.id) ? { ...n, read: true } : n)));
    } catch {
      // Leave state untouched: better to keep the badge honest than to lie.
    }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'read-all' }),
      });
      if (!res.ok) return;
      const data = (await res.json()) as { unreadCount: number };
      setUnread(data.unreadCount);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      // Same contract as markRead: no optimistic lie.
    }
  }, []);

  // The socket's opinion AND the network's. A long-lived SSE socket survives
  // an offline machine - nothing is being written, so nothing ever fails - so
  // the socket alone would keep reporting "Live" after the network was lost.
  const live = connected && online;

  const value = useMemo<NotificationContextValue>(
    () => ({
      notifications,
      unread,
      status,
      connected: live,
      stats,
      markRead,
      markAllRead,
      refresh,
      refreshStats,
    }),
    [notifications, unread, status, live, stats, markRead, markAllRead, refresh, refreshStats]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotifications must be used inside <NotificationProvider>');
  }
  return ctx;
}
