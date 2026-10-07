import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  isNotificationRole,
  listNotifications,
  markAllNotificationsRead,
  markNotificationsRead,
} from '@/lib/notifications';

// Reads live rows every time - never statically optimised or cached.
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Server-side authorization, not a hidden UI element: without an ADMIN/STAFF
 * session this returns 401 before any row (title, message, booking link) is
 * read. A visitor gets no notification data at all.
 */
async function requireStaffSession() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role ?? null;
  if (!session?.user || !isNotificationRole(role)) return null;
  return session.user;
}

export async function GET(request: NextRequest) {
  const user = await requireStaffSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const limit = Number(request.nextUrl.searchParams.get('limit') ?? '20');
  const unreadOnly = request.nextUrl.searchParams.get('unreadOnly') === '1';

  try {
    const result = await listNotifications(user.id, { limit, unreadOnly });
    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /api/notifications error:', error);
    return NextResponse.json({ error: 'Failed to load notifications' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await requireStaffSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const action = (body as { action?: unknown })?.action;

  try {
    if (action === 'read-all') {
      await markAllNotificationsRead(user.id);
      const { unreadCount } = await listNotifications(user.id, { limit: 1 });
      return NextResponse.json({ success: true, unreadCount });
    }

    if (action === 'read') {
      const ids = (body as { ids?: unknown })?.ids;
      if (!Array.isArray(ids)) {
        return NextResponse.json({ error: 'ids must be an array' }, { status: 400 });
      }
      await markNotificationsRead(user.id, ids as string[]);
      const { unreadCount } = await listNotifications(user.id, { limit: 1 });
      return NextResponse.json({ success: true, unreadCount });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('POST /api/notifications error:', error);
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
  }
}
