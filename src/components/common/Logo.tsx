import Image from 'next/image';

/**
 * The full Awan Rental Service lockup - the car plus the "Awan Rental
 * Service" wordmark - cropped out of Logo/logo.png with its background
 * flooded away and an even transparent margin. Built by
 * scripts/generate-brand-assets.mjs into public/brand-logo.png.
 *
 * Used where the layout has room for the wordmark to stay legible: the
 * footer and the 404 page. The PNG carries NO background of its own, so it
 * can be dropped on any light surface without showing a rectangle. Because
 * the wordmark is black, a surface dark enough to swallow it supplies a light
 * card in CSS instead - see Footer and not-found.tsx.
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
