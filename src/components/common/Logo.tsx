import Image from 'next/image';

/**
 * The full Awan Rental Service lockup - the car plus the "Awan Rental
 * Service" wordmark - cropped out of Logo/logo.png onto its own white plate
 * with an even margin. Built by scripts/generate-brand-assets.mjs into
 * public/brand-logo.png.
 *
 * Used where the layout has room for the wordmark to stay legible: the
 * footer and the 404 page. The white plate is not decoration - the footer
 * sits on #111827 and the wordmark is black, so dropping the lockup straight
 * onto that surface would make "Rental Service" disappear.
 *
 * The header uses @/components/common/BrandMark instead: the mark alone,
 * paired with the company name as real text.
 */
interface LogoProps {
  /** Tailwind size classes, e.g. "h-32 w-auto rounded-2xl". */
  className?: string;
  /**
   * Alternative text. Omit when the logo sits inside a link that already
   * carries an aria-label, so screen readers do not hear the name twice.
   */
  title?: string;
  /**
   * Load eagerly with a preload hint. Set it when the logo is above the
   * fold (the 404 page); leave it off for the footer, which sits below the
   * fold and should not block first paint.
   */
  priority?: boolean;
}

const LOCKUP = { src: '/brand-logo.png', width: 578, height: 437 } as const;

export function Logo({
  className = 'h-32 w-auto',
  title,
  priority = false,
}: LogoProps) {
  if (title) {
    return <Image {...LOCKUP} alt={title} className={className} priority={priority} />;
  }

  return (
    <Image {...LOCKUP} alt="" aria-hidden="true" className={className} priority={priority} />
  );
}
