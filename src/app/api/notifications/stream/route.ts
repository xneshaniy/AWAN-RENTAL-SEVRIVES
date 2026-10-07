import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isNotificationRole } from '@/lib/notifications';
import { subscribeToNotifications } from '@/lib/notification-events';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** Heartbeat interval. Keeps idle intermediaries from reaping the socket. */
const HEARTBEAT_MS = 25_000;

/**
 * Server-Sent Events stream for the Admin/Staff panel.
 *
 * Chosen over WebSockets because the app is a single stateless Next.js
 * deployment: an SSE stream is just an ordinary long-lived GET handled by the
 * same route-handler model already in use, needs no separate socket server,
 * no extra process, no paid provider, and `EventSource` reconnects natively.
 *
 * Authorization happens before the stream is opened, so an anonymous visitor
 * receives 401 and no event payload ever reaches them.
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role ?? null;
  if (!session?.user || !isNotificationRole(role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const encoder = new TextEncoder();
  let closed = false;
  let unsubscribe: (() => void) | null = null;
  let heartbeat: ReturnType<typeof setInterval> | null = null;

  const close = () => {
    if (closed) return;
    closed = true;
    if (heartbeat) clearInterval(heartbeat);
    heartbeat = null;
    if (unsubscribe) unsubscribe();
    unsubscribe = null;
  };

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const write = (chunk: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          // The client went away mid-write; normal on tab close.
          close();
        }
      };

      // Handed to EventSource as its initial retry hint (milliseconds).
      write('retry: 3000\n');
      write(`event: connected\ndata: ${JSON.stringify({ at: new Date().toISOString() })}\n\n`);

      // Fan-out: one subscriber per open tab on the shared process-wide bus.
      unsubscribe = subscribeToNotifications((event) => {
        write(`event: notification\ndata: ${JSON.stringify(event)}\n\n`);
      });

      // A comment-only heartbeat. It carries no data and is not polling - it
      // exists purely so proxies do not consider the connection idle.
      heartbeat = setInterval(() => write(': ping\n\n'), HEARTBEAT_MS);
    },
    cancel() {
      close();
    },
  });

  // Both the stream cancellation and the request abort must tear the
  // subscriber down, otherwise a disconnected tab keeps a listener forever.
  request.signal.addEventListener('abort', close);

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, no-transform, must-revalidate',
      Connection: 'keep-alive',
      // Tell nginx-style proxies not to buffer the response - without this the
      // stream is held until it fills a buffer and "real-time" becomes latency.
      'X-Accel-Buffering': 'no',
      'Content-Encoding': 'identity',
    },
  });
}
