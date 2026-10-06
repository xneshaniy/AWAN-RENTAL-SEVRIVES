import Image from 'next/image';

/**
 * Awan Rental Service brand mark.
 *
 * The car + swoosh artwork cropped out of Logo/logo.png, built by
 * scripts/generate-brand-assets.mjs into public/brand-mark.png.
 *
 * Deliberately the mark *only*. The company name is printed as real text
 * beside it, so the header never shows the name twice and the name stays
 * selectable, translatable and indexable. The background is transparent, so
 * the car's open body picks up whatever sits behind it exactly the way it
 * does on the white artwork plate.
 *
 * For the full lockup (car + wordmark) see @/components/common/Logo.
 */
interface BrandMarkProps {
  /** Tailwind size classes, e.g. "h-5 w-auto sm:h-8". */
  className?: string;
  /**
   * Accessible name. Omit when the mark sits inside a link that already
   * carries an aria-label - the artwork is then hidden from screen readers
   * instead of being announced twice.
   */
  title?: string;
}

const MARK = { src: '/brand-mark.png', width: 502, height: 200 } as const;

export function BrandMark({ className = 'h-8 w-auto', title }: BrandMarkProps) {
  // Always in the header, so never lazy-loaded - a late mark would pop in
  // next to text that has already painted.
  const eager = { loading: 'eager' as const };

  if (title) {
    return <Image {...MARK} {...eager} alt={title} className={className} />;
  }

  return <Image {...MARK} {...eager} alt="" aria-hidden="true" className={className} />;
}
