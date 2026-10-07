'use client';

import { useNotifications } from '@/components/admin/NotificationProvider';

/** The three counters /api/admin/dashboard-stats knows about. */
export type LiveStatKey = 'pendingBookings' | 'newMessages' | 'unreadNotifications';

/**
 * Renders a dashboard number that updates itself when the notification stream
 * reports a relevant event - without reloading the page or polling.
 *
 * Falls back to the server-rendered `initial` value whenever the live fetch
 * has not succeeded (first paint, offline, endpoint error), so the card is
 * never blank and never shows a made-up number.
 */
export function LiveStatValue({ stat, initial }: { stat: LiveStatKey; initial: number }) {
  const { stats } = useNotifications();
  const value = stats && typeof stats[stat] === 'number' ? stats[stat] : initial;
  return <>{value}</>;
}
