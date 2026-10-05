/**
 * Awan Rental Service brand mark.
 *
 * A single self-contained SVG (no external request, no sprite lookup) so the
 * logo is identical in the header, the footer and anywhere else, and can be
 * recoloured or resized without shipping an image file.
 *
 * The same artwork is exported to src/app/icon.svg (favicon) and
 * public/favicon.ico by scripts/generate-icons.mjs — keep the shapes in sync.
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
      <rect width="64" height="64" rx="14" fill="#0369a1" />
      {/* Cabin / windows */}
      <path d="M21 31 L26 22 H38 L43 31 Z" fill="#e0f2fe" />
      {/* Body */}
      <rect x="12" y="31" width="40" height="12" rx="5" fill="#ffffff" />
      {/* Wheels */}
      <circle cx="21" cy="45" r="5.5" fill="#082f49" />
      <circle cx="43" cy="45" r="5.5" fill="#082f49" />
      <circle cx="21" cy="45" r="2" fill="#e0f2fe" />
      <circle cx="43" cy="45" r="2" fill="#e0f2fe" />
    </svg>
  );
}
