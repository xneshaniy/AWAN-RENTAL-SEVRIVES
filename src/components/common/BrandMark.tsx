/**
 * Awan Rental Service brand mark.
 *
 * A single self-contained SVG (no external request, no sprite lookup) so the
 * logo is identical in the header, the footer and anywhere else, and can be
 * recoloured or resized without shipping an image file.
 *
 * The favicon set (public/favicon.ico, public/site.webmanifest) is generated
 * from Logo/logo.png by scripts/generate-favicons.mjs — keep the brand red
 * in sync when either changes.
 */
interface BrandMarkProps {
  /** Tailwind size classes, e.g. "w-8 h-8". */
  className?: string;
  /**
   * Accessible name. Omit when the mark sits inside a link that already
   * carries an aria-label - the artwork is then hidden from screen readers
   * instead of being announced twice.
   */
  title?: string;
}

export function BrandMark({ className = 'w-8 h-8', title }: BrandMarkProps) {
  const label = title ?? 'Awan Rental Service';

  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      {...(title
        ? { role: 'img', 'aria-label': label }
        : { 'aria-hidden': true, focusable: 'false' })}
    >
      {title && <title>{label}</title>}
      {/* Plate */}
      <rect width="64" height="64" rx="14" fill="#d80000" />
      {/* Cabin / windows */}
      <path d="M21 31 L26 22 H38 L43 31 Z" fill="#ffebeb" />
      {/* Body */}
      <rect x="12" y="31" width="40" height="12" rx="5" fill="#ffffff" />
      {/* Wheels */}
      <circle cx="21" cy="45" r="5.5" fill="#470000" />
      <circle cx="43" cy="45" r="5.5" fill="#470000" />
      <circle cx="21" cy="45" r="2" fill="#ffebeb" />
      <circle cx="43" cy="45" r="2" fill="#ffebeb" />
    </svg>
  );
}
