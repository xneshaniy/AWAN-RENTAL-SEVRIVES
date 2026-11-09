import Link from 'next/link';
import { Car, Search, Home, ArrowLeft, CalendarCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { getBusinessInfo } from '@/lib/settings';
import { Layout } from '@/components/layout/Layout';
import { WhatsAppFloat } from '@/components/common/WhatsAppFloat';
import { Logo } from '@/components/common/Logo';

/**
 * Rendered inside the normal site chrome. A dead end with no header, no footer
 * and no way back is the worst possible 404, so this page always offers the
 * main navigation routes plus a way to reach a human.
 */
export default async function NotFound() {
  const businessInfo = await getBusinessInfo();

  return (
    <Layout businessInfo={businessInfo}>
      <section
        className="flex min-h-[65vh] items-center justify-center px-4 py-16 sm:py-24"
        aria-labelledby="notfound-title"
      >
        <div className="w-full max-w-md text-center">
          {/*
            No card: the mark is vector artwork and the wordmark uses the
            page foreground, so the lockup sits directly on either theme.
          */}
          <div className="mb-8 flex justify-center">
            <Logo size="lg" title="Awan Rental Service" className="animate-fade-in" />
          </div>

          <p
            className="mb-2 animate-slide-up text-8xl font-bold leading-none text-primary-600/20 dark:text-primary-400/20"
            aria-hidden="true"
          >
            404
          </p>

          <h1
            id="notfound-title"
            className="mb-4 animate-slide-up animation-delay-200 font-heading text-3xl font-bold text-gray-900 dark:text-white"
          >
            Page Not Found
          </h1>

          <p className="mb-8 animate-slide-up animation-delay-400 text-gray-600 dark:text-gray-400">
            Sorry, we couldn&apos;t find the page you&apos;re looking for. It may have been
            moved, or the link may be out of date.
          </p>

          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Button size="lg" asChild fullWidth className="sm:w-auto">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
                Back to Home
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild fullWidth className="sm:w-auto">
              <Link href="/vehicles">Browse Vehicles</Link>
            </Button>
          </div>

          <nav aria-label="Popular pages" className="mt-10 border-t border-gray-200 pt-8 dark:border-gray-700">
            <p className="mb-4 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Popular pages
            </p>
            {/* gray-400 is 2.54:1 on this section's white - below the 4.5:1
                WCAG AA minimum. gray-500 lifts it to 4.83:1 in light mode;
                on the dark page background gray-500 is only 4.14:1, so dark
                keeps gray-400 (7.88:1). */}
            <div className="flex items-center justify-center gap-8 text-gray-500 dark:text-gray-400">
              <Link
                href="/services"
                className="flex flex-col items-center gap-1 transition-colors hover:text-primary-600 dark:hover:text-primary-400"
              >
                <Car className="h-6 w-6" aria-hidden="true" />
                <span className="text-xs">Services</span>
              </Link>
              <Link
                href="/booking"
                className="flex flex-col items-center gap-1 transition-colors hover:text-primary-600 dark:hover:text-primary-400"
              >
                <CalendarCheck className="h-6 w-6" aria-hidden="true" />
                <span className="text-xs">Book</span>
              </Link>
              <Link
                href="/contact"
                className="flex flex-col items-center gap-1 transition-colors hover:text-primary-600 dark:hover:text-primary-400"
              >
                <Search className="h-6 w-6" aria-hidden="true" />
                <span className="text-xs">Contact</span>
              </Link>
              <Link
                href="/about"
                className="flex flex-col items-center gap-1 transition-colors hover:text-primary-600 dark:hover:text-primary-400"
              >
                <Home className="h-6 w-6" aria-hidden="true" />
                <span className="text-xs">About</span>
              </Link>
            </div>
          </nav>
        </div>
      </section>

      <WhatsAppFloat />
    </Layout>
  );
}
