import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import type { Role } from '@prisma/client';

/**
 * Thrown by server actions when the caller is not signed in with an
 * appropriate admin role. Server actions are reachable from any client, so
 * every mutation must perform this check server-side - the middleware only
 * protects page navigations.
 */
export class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

/** Role of the current session, or null when signed out. */
export async function getSessionRole(): Promise<Role | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.role ?? null;
}

/** True when the session belongs to an ADMIN or STAFF account. */
export async function hasStaffAccess(): Promise<boolean> {
  const role = await getSessionRole();
  return role === 'ADMIN' || role === 'STAFF';
}

/** True when the session belongs to a full ADMIN account. */
export async function hasAdminAccess(): Promise<boolean> {
  return (await getSessionRole()) === 'ADMIN';
}

/** Throws unless the caller is ADMIN or STAFF. Use at the top of mutations. */
export async function requireStaffAccess(): Promise<void> {
  if (!(await hasStaffAccess())) {
    throw new UnauthorizedError();
  }
}

/** Throws unless the caller is a full ADMIN (settings, user management). */
export async function requireAdminAccess(): Promise<void> {
  if (!(await hasAdminAccess())) {
    throw new UnauthorizedError();
  }
}
