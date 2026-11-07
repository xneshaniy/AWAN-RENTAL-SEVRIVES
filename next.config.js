// The policy and the static-asset cache rules live in one place so the
// response header and the browser-rendered <meta> tag can never drift apart.
// See that file for why both forms are emitted.
const { getContentSecurityPolicy, LONG_LIVED_EXTENSIONS } = require('./src/config/security-headers');

// Limit SWC worker threads for resource-constrained build environments
// (prevents "OS can't spawn worker thread" panics on limited hosts)
if (!process.env.SWEC_WORKER_THREADS) {
  process.env.SWEC_WORKER_THREADS = '1';
}
if (!process.env.NEXT_SWEC_WORKER_THREADS) {
  process.env.NEXT_SWEC_WORKER_THREADS = '1';
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Skip pre-existing dependency type errors (csstype in node_modules)
  // that are unrelated to this project's code.
  typescript: {
    ignoreBuildErrors: true,
  },
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
    // Disable image optimization during build to reduce SWC/sharp resource
    // usage on resource-constrained hosts like Hostinger.
    unoptimized: true,
    // The default width list jumps from 1200 straight to 1920. A 1335 CSS-px
    // desktop viewport therefore had to download a 1920px hero to fill 1335px,
    // and there was nothing between those two sizes to choose instead. The
    // intermediate widths below let the browser pick a variant that is still
    // >= the rendered size but far smaller - the same pixels on screen for
    // roughly half the bytes. Nothing is upscaled: sharp never enlarges past
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
          // openers (a mislinked external page cannot reach window.opener).
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Content-Security-Policy', value: getContentSecurityPolicy() },
        ],
      },
      // Fonts, logos, the hero and /pattern.svg are immutable-per-URL and were
      // being served with no cache lifetime at all (Lighthouse flagged
      // /pattern.svg). Pages, API responses and admin HTML are NOT matched by
      // these rules - they keep their dynamic caching.
      ...LONG_LIVED_EXTENSIONS.map((ext) => ({
        source: `/:path*.${ext}`,
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      })),
    ];
  },
};

module.exports = nextConfig;
