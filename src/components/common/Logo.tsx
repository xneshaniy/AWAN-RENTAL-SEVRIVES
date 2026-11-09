import { cn } from '@/lib/utils';

/**
 * Awan Rental Service lockup for the footer and the 404 page.
 *
 * Uses the site's actual brand logo (public/icon-192.png). On dark surfaces
 * the artwork (red + black on transparent) is placed on a white badge so it
 * stays legible; on light surfaces it renders as-is.
 */
interface LogoProps {
  /** Size of the lockup. `lg` is intended for the 404 page. */
  size?: 'sm' | 'lg';
  /**
   * Wordmark tone. Kept for backwards compatibility; the mark now carries the
   * wordmark itself.
   */
  tone?: 'auto' | 'light';
  /** Extra layout classes for the wrapper. */
  className?: string;
  /**
   * Accessible name. Use when the lockup is not already inside a link with
   * its own label.
   */
  title?: string;
}

const SIZES = {
  sm: 'h-12 sm:h-14',
  lg: 'h-24 sm:h-28',
} as const;

export function Logo({ size = 'sm', className, title }: LogoProps) {
  return (
    <span className={cn('inline-flex items-center', className)} role={title ? 'img' : undefined} aria-label={title}>
      <img
        src="/icon-192.png"
        alt={title ?? 'Awan Rental Service'}
        width="192"
        height="192"
        className={cn(
          'w-auto shrink-0 rounded-2xl bg-white p-2 shadow-sm',
          SIZES[size]
        )}
      />
    </span>
  );
}
