import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import { rateLimit, clientIpFromHeaders } from '@/lib/rate-limit';

// Pages under /admin that must stay reachable without an admin session.
const PUBLIC_ADMIN_PATHS = ['/admin/login', '/admin/unauthorized'];

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Brute-force protection for the credentials sign-in endpoint. The
    // limiter is per-IP and in-memory (single-node deployment); a lockout
    // window is far friendlier than letting scripts try passwords forever.
    if (path === '/api/auth/callback/credentials') {
      const ip = clientIpFromHeaders(req.headers);
      if (!rateLimit(`login:${ip}`, { limit: 10, windowMs: 15 * 60 * 1000 })) {
        return new NextResponse(
          JSON.stringify({ message: 'Too many sign-in attempts. Please wait a few minutes and try again.' }),
          { status: 429, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    if (path.startsWith('/admin') && !PUBLIC_ADMIN_PATHS.includes(path)) {
      // Anonymous visitors are normally stopped by the `authorized` callback
      // below (withAuth redirects them to the sign-in page). This is a second
      // line of defence in case that ever changes.
      if (!token) {
        return NextResponse.redirect(new URL('/admin/login', req.url));
      }
      // Authenticated but without an admin role: show the unauthorized page.
      if (token.role !== 'ADMIN' && token.role !== 'STAFF') {
        return NextResponse.redirect(new URL('/admin/unauthorized', req.url));
      }
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        if (PUBLIC_ADMIN_PATHS.includes(path)) return true;
        // The credentials callback must stay reachable so the rate limiter
        // above can run; it is not a page and grants no session by itself.
        if (path === '/api/auth/callback/credentials') return true;
        // Any authenticated session reaches the middleware function above,
        // which routes wrong-role accounts to /admin/unauthorized. Anonymous
        // requests are redirected to the signIn page (/admin/login).
        if (path.startsWith('/admin')) return !!token;
        return true;
      },
    },
  }
);

export const config = {
  matcher: ['/admin/:path*', '/api/auth/callback/credentials'],
};
