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
          // once the site is served over https in production.
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
