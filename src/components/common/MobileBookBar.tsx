'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarCheck } from 'lucide-react';

/**
 * Persistent "Book Now" bar, mobile only (sm and up keep the header CTA).
 *
 * Rendered inside Layout, so it is hidden on routes where it would be
 * redundant or would sit on top of a form:
 *   - /booking*  the visitor is already booking
 *   - /admin*    the staff dashboard has its own navigation
 *
 * The inner container keeps a 6rem right gutter so the floating WhatsApp
 * button (fixed at right-6, 3.5rem wide) never overlaps the CTA.
 */
const HIDDEN_ON = ['/booking', '/admin'];

export function MobileBookBar() {
  const pathname = usePathname();

  const hidden = HIDDEN_ON.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
  if (hidden) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/95 sm:hidden">
      <div className="pl-4 pr-24 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <Link
          href="/booking"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-3.5 text-base font-semibold text-white shadow-md transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          <CalendarCheck className="h-5 w-5" aria-hidden="true" />
          Book Now
        </Link>
      </div>
    </div>
  );
}
