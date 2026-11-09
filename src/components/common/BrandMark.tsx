import { cn } from '@/lib/utils';

/**
 * Awan Rental Service brand mark.
 *
 * The mark is inline SVG rather than a raster image so it stays perfectly
 * crisp at every size and on every pixel density. It is deliberately the
 * emblem only - the company name is set as real text beside it in the header
 * and in <Logo>, so the name is never baked into pixels and never announced
 * twice by a screen reader.
 *
 * Brand colours are the site's existing navy (#1E3A8A) and gold (#D4AF37),
 * with the off-white surface (#F8FAFC) used for the car body.
 *
 * The sleeker grand-tourer silhouette is scaled ~1.1 around the badge centre
 * so it reads with presence at small sizes, and two gold motion lines sit
 * ahead of the car. No enclosing ring keeps the badge clean and uncluttered.
 */
interface BrandMarkProps {
  /** Tailwind size classes, e.g. "h-8 w-auto". */
  className?: string;
  /**
   * Accessible name. Omit when the mark sits inside a link that already
   * carries an aria-label, so screen readers do not hear the name twice.
   */
  title?: string;
}

export function BrandMark({ className = 'h-8 w-auto', title }: BrandMarkProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="600"
      height="600"
      viewBox="0 0 600 600"
      fill="none"
      className={cn('block shrink-0', className)}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}

      {/* Navy badge: the mark stays legible on light and dark surfaces. */}
      <rect x="24" y="24" width="552" height="552" rx="150" fill="#1E3A8A" />

      {/* Gold motion lines ahead of the car. */}
      <rect x="56" y="294" width="72" height="18" rx="9" fill="#D4AF37" />
      <rect x="76" y="330" width="46" height="14" rx="7" fill="#D4AF37" />

      {/* Car scaled ~1.1 around the badge centre for a bolder, sleeker presence. */}
      <g transform="translate(300 300) scale(1.1) translate(-300 -300)">
        {/* Off-white grand-tourer silhouette. */}
        <path
          d="M 124 348
             C 116 340 113 328 116 316
             L 124 296
             C 128 288 135 283 144 281
             L 188 274
             C 204 260 216 248 228 238
             C 250 224 276 216 302 215
             L 354 215
             C 374 216 392 224 408 238
             L 436 260
             C 454 266 470 276 480 290
             C 486 298 488 308 489 318
             L 486 336
             C 484 345 477 350 468 350
             L 124 348 Z"
          fill="#F8FAFC"
        />

        {/* Cabin glass: a navy band inside the white body. */}
        <path
          d="M 210 264
             C 220 248 232 234 246 224
             C 258 216 276 213 294 213
             L 340 213
             C 355 214 368 220 378 230
             L 408 256
             C 410 260 408 264 404 264
             L 218 264
             C 214 264 212 262 214 264 Z"
          fill="#1E3A8A"
        />

        {/* Wheels: navy tyre, gold rim, gold hub, navy centre. */}
        <circle cx="188" cy="355" r="49" fill="#1E3A8A" />
        <circle cx="432" cy="355" r="49" fill="#1E3A8A" />
        <circle cx="188" cy="355" r="40" stroke="#D4AF37" strokeWidth="11" />
        <circle cx="432" cy="355" r="40" stroke="#D4AF37" strokeWidth="11" />
        <circle cx="188" cy="355" r="13" fill="#D4AF37" />
        <circle cx="432" cy="355" r="13" fill="#D4AF37" />
        <circle cx="188" cy="355" r="5" fill="#1E3A8A" />
        <circle cx="432" cy="355" r="5" fill="#1E3A8A" />
      </g>
    </svg>
  );
}
