/**
 * Content-Security-Policy for the site.
 *
 * WHY 'unsafe-inline' IS REQUIRED
 * Next.js App Router (14.x) renders its hydration/RSC bootstrap and the
 * JSON-LD structured data through inline <script> tags that are emitted while
 * the page is being rendered. Without a per-request nonce those tags need
 * 'unsafe-inline'. Introducing nonces here would mean moving every page off
 * static generation and hand-managing a nonce through middleware; for this
 * project the safer trade is an allow-list CSP with 'unsafe-inline' rather than
 * a nonce scheme that can silently break booking, admin login or SEO markup.
 *
 * The policy still blocks the parts that actually stop XSS in practice:
 *   - object-src 'none'            (no plugins / Flash-style payloads)
 *   - base-uri 'self'              (no <base> hijacking of relative URLs)
 *   - form-action 'self'           (no form posts to an attacker)
 *   - frame-ancestors 'none'       (the page cannot be framed at all)
 *   - default-src 'self'           (anything not named explicitly is same-origin)
 *
 * TRUSTED TYPES
 * `trusted-types 'none'` declares that this application never creates a
 * Trusted Types policy — which is true: nothing in the source does, and React
 * 18 only assigns `innerHTML` through `dangerouslySetInnerHTML`.
 * `require-trusted-types-for` is deliberately NOT set, because enabling
 * enforcement would make those `dangerouslySetInnerHTML` assignments throw and
 * blank out the JSON-LD blocks and the analytics bootstrap. Enforcement needs a
 * reviewed Trusted Types policy first; until then the declaration is inert
 * rather than harmful.
 */
function buildContentSecurityPolicy() {
  const scriptSrc = [
    "script-src 'self'",
    "'unsafe-inline'",
    // Only development needs eval (webpack HMR + React Refresh).
    ...(process.env.NODE_ENV === 'production' ? [] : ["'unsafe-eval'"]),
    'https://www.googletagmanager.com',
    'https://www.google-analytics.com',
  ].join(' ');

  return [
    "default-src 'self'",
    scriptSrc,
    // next/font injects a <style> block and several components use inline
    // style attributes, so style-src must stay permissive.
    "style-src 'self' 'unsafe-inline'",
    // Vehicle photos live on Cloudinary, demo photos on Unsplash, and admins
    // may point Site Settings at any https image.
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    // GA4 beacons, plus 'self' for the booking/admin API routes. Cloudinary
    // uploads happen server-side inside /api/admin/upload, so no third-party
    // origin is needed here.
    [
      "connect-src 'self'",
      'https://www.google-analytics.com',
      'https://*.google-analytics.com',
      'https://*.analytics.google.com',
      'https://www.googletagmanager.com',
      'https://*.googletagmanager.com',
    ].join(' '),
    // Gallery videos are served from Cloudinary (and locally as blob: while
    // they are still being previewed).
    "media-src 'self' blob: https:",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "trusted-types 'none'",
    'upgrade-insecure-requests',
  ].join('; ');
}

/** Static file extensions that are content-stable and safe to cache for a year. */
const LONG_LIVED_EXTENSIONS = [
  'svg',
  'jpg',
  'jpeg',
  'png',
  'gif',
  'webp',
  'avif',
  'ico',
  'woff',
  'woff2',
  'ttf',
  'otf',
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Emit .next/standalone/server.js so the host has a runnable entry point.
  // Without this, builds succeed but Hostinger has no runtime to route to and
  // answers 403 at the Apache layer instead of reaching Next.js.
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    // The default width list jumps from 1200 straight to 1920. A 1335 CSS-px
    // desktop viewport therefore had to download a 1920px hero to fill 1335px.
    // The intermediate widths below let the browser pick a variant that is
    // still >= the rendered size but meaningfully smaller - same pixels on
    // screen, less bytes. Nothing here is upscaled: sharp never enlarges past
    // the 1920px source.
    deviceSizes: [640, 750, 828, 1080, 1200, 1280, 1366, 1440, 1536, 1600, 1920, 2048, 3840],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Don't advertise the framework version in responses.
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          // Browsers ignore HSTS over plain http (local dev) and honour it
          // once the site is served over https in production. `preload` only
          // takes effect if the domain is also submitted to hstspreload.org -
          // that step is deliberately left to the site owner.
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          // Keeps this tab's browsing context group isolated from cross-origin
          // openers (window.opener from a mislinked external page).
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Content-Security-Policy', value: buildContentSecurityPolicy() },
        ],
      },
      // Fonts, logos, the hero and /pattern.svg are immutable-per-URL and were
      // being served with no cache lifetime at all (Lighthouse flagged
      // /pattern.svg). Pages, API responses and admin HTML are NOT matched by
      // these rules - they keep their own dynamic caching.
      ...LONG_LIVED_EXTENSIONS.map((ext) => ({
        source: `/:path*.${ext}`,
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      })),
    ];
  },
};

module.exports = nextConfig;
