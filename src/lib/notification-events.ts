import { EventEmitter } from 'node:events';
import type { NotificationType } from '@prisma/client';

/**
 * The payload pushed to every connected Admin/Staff tab.
 *
 * It carries only the notification row - never a booking or message object -
 * so a socket can leak nothing that the receiving user could not already read
 * from the notifications API (which is itself role-gated).
 */
export interface NotificationEvent {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  bookingId: string | null;
  contactMessageId: string | null;
  meta: unknown;
  /** ISO-8601 so the JSON survives the wire unchanged. */
  createdAt: string;
}

const EVENT_NAME = 'notification';

/**
 * A single shared emitter, parked on `globalThis` exactly like the Prisma
 * client is.
 *
 * This matters: Next.js compiles route handlers and server actions into
 * separate chunks, so a plain module-level `new EventEmitter()` could end up
 * being constructed twice inside the same Node process. Publishing on one
 * instance while the SSE route listens on another would silently deliver
 * nothing - the classic "real-time" bug. Anchoring to `globalThis` guarantees
 * every publisher and subscriber in the process shares one bus.
 */
const globalStore = globalThis as unknown as { __notificationBus?: EventEmitter };

function getBus(): EventEmitter {
  if (!globalStore.__notificationBus) {
    const bus = new EventEmitter();
    // Every open admin tab holds a subscriber for as long as the page lives.
    // The default cap of 10 would emit a MaxListenersExceededWarning.
    bus.setMaxListeners(0);
    globalStore.__notificationBus = bus;
  }
  return globalStore.__notificationBus;
}

/** Subscribe to the bus. Returns an unsubscribe function (idempotent). */
export function subscribeToNotifications(
  listener: (event: NotificationEvent) => void
): () => void {
  const bus = getBus();
  bus.on(EVENT_NAME, listener);
  return () => {
    bus.off(EVENT_NAME, listener);
  };
}

/** Broadcast an already-persisted notification to every local subscriber. */
export function publishNotification(event: NotificationEvent): void {
  getBus().emit(EVENT_NAME, event);
}

/** Diagnostic helper: how many live SSE connections this process is serving. */
export function notificationSubscriberCount(): number {
  return getBus().listenerCount(EVENT_NAME);
}
