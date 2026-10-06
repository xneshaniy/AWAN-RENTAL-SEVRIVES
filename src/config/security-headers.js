/**
 * Single source of truth for the Content-Security-Policy (and the static-asset
 * cache rules) used by the site.
 *
 * It lives in a plain CommonJS file because it has two very different
 * consumers: `next.config.js` (loaded by Node, outside the TypeScript build)
 * and `src/app/layout.tsx` (compiled by Next). Keeping one definition means
 * the browser-enforced policy can never drift from the one on the wire.
 *
 * WHY BOTH A HEADER AND A META TAG
 * -------------------------------
 * `next.config.js` emits the policy as a real `Content-Security-Policy`
 * response header, which is the correct and preferred mechanism - it is what
 * the site serves today from its own origin.
 *
 * Hostinger's platform, however, rewrites that one specific header back to
 * `upgrade-insecure-requests` on every dynamic response (verified: the header
 * reaches the browser as exactly `content-security-policy:
 * upgrade-insecure-requests`, while the sibling headers set right next to it
 * - COOP, HSTS, X-Frame-Options - pass through untouched). A
 * `<meta http-equiv="Content-Security-Policy">` in the document is not
 * something that layer rewrites, so the identical policy is also emitted there
 * and actually takes effect.
 *
 * If Hostinger ever stops overriding the header, the header and the meta tag
 * simply enforce the same policy - browsers intersect multiple policies, and
 * two identical policies impose exactly what one does.
 *
 * WHY 'unsafe-inline'
 * -------------------
 * The Next.js App Router emits its hydration/RSC bootstrap and the JSON-LD
 * structured data as inline <script> tags while rendering the document.
 * Without a per-request nonce those tags need 'unsafe-inline'. Nonces were
 * considered and rejected as the riskier change here: they force every page
 * onto per-request generation and hand-managed nonce plumbing, so a single
 * mistake would blank out booking, admin login or SEO markup. This policy
 * still blocks the mechanisms that matter in practice - object-src, base-uri,
 * form-action, frame-ancestors and an allow-listed script-src.
 *
 * TRUSTED TYPES
 * -------------
 * `trusted-types 'none'` records that this application never creates a
 * Trusted Types policy, which is accurate - nothing in the source does, and
 * React 18 only writes `innerHTML` through `dangerouslySetInnerHTML`.
 * `require-trusted-types-for` is deliberately NOT set: enabling enforcement
 * would make those assignments throw and blank out the JSON-LD blocks and the
 * analytics bootstrap. Enforcement needs a reviewed policy first.
 *
 * `frame-ancestors` is only meaningful in a response header, so it is omitted
 * from the meta form. Clickjacking protection is unaffected - the
 * `X-Frame-Options: DENY` header set alongside it is served by this same
 * config and is not rewritten by the platform.
 */

/**
 * @param {{ includeFrameAncestors?: boolean }} [options]
 * @returns {string} the policy, ready to send as a header or meta content.
 */
function getContentSecurityPolicy(options) {
  const includeFrameAncestors = options ? options.includeFrameAncestors !== false : true;

  const scriptSrc = [
    "script-src 'self'",
    "'unsafe-inline'",
    // Only development needs eval (webpack HMR + React Refresh); production
    // deliberately does not allow it.
    ...(process.env.NODE_ENV === 'production' ? [] : ["'unsafe-eval'"]),
    'https://www.googletagmanager.com',
    'https://www.google-analytics.com',
  ].join(' ');

  const directives = [
    "default-src 'self'",
    scriptSrc,
    // next/font injects a <style> block and several components use inline
    // style attributes, so style-src must stay permissive.
    "style-src 'self' 'unsafe-inline'",
    // Vehicle photos live on Cloudinary, demo photos on Unsplash, and admins
    // may point Site Settings at any https image.
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    // GA4 beacons plus 'self' for the booking/admin API routes. Cloudinary
    // uploads run server-side inside /api/admin/upload, so no third-party
    // origin is needed here.
    [
      "connect-src 'self'",
      'https://www.google-analytics.com',
      'https://*.google-analytics.com',
      'https://*.analytics.google.com',
      'https://www.googletagmanager.com',
      'https://*.googletagmanager.com',
    ].join(' '),
    // Gallery videos come from Cloudinary (blob: while still previewing).
    "media-src 'self' blob: https:",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    // Response-header only: browsers ignore it when delivered via <meta>.
    ...(includeFrameAncestors ? ["frame-ancestors 'none'"] : []),
    "trusted-types 'none'",
    'upgrade-insecure-requests',
  ];

  return directives.join('; ');
}

/**
 * Static file extensions that are content-stable enough to cache for a year.
 * Only `/:path*` routes reach these rules - pages, API responses and admin HTML
 * are deliberately not matched.
 *
 * NOTE: files in `public/` are currently served by Hostinger's own static
 * layer rather than by the Node process, so on production only `*.jpg`/`*.png`
 * pick up a lifetime (from the host's own expires rules). The rule below is
 * correct at the origin and takes effect wherever Next serves the file.
 */
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

module.exports = { getContentSecurityPolicy, LONG_LIVED_EXTENSIONS };
