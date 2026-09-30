import Link from 'next/link';
import { Car, Home, Search, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <div className="text-9xl font-bold text-primary-600/20 dark:text-primary-400/20">404</div>
        </div>
        <h1 className="font-heading font-bold text-3xl text-gray-900 dark:text-white mb-4">
          Page Not Found
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Sorry, we couldn&apos;t find the page you&apos;re looking for. It might have been moved or doesn&apos;t exist.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild>
            <Link href="/">Back to Home</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/vehicles">Browse Vehicles</Link>
          </Button>
        </div>
        <div className="mt-10 flex items-center justify-center gap-8 text-gray-400">
          <a href="/services" className="flex flex-col items-center gap-1 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
            <Car className="w-6 h-6" aria-hidden="true" />
            <span className="text-xs">Services</span>
          </a>
          <a href="/contact" className="flex flex-col items-center gap-1 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
            <Search className="w-6 h-6" aria-hidden="true" />
            <span className="text-xs">Contact</span>
          </a>
          <a href="/about" className="flex flex-col items-center gap-1 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
            <Home className="w-6 h-6" aria-hidden="true" />
            <span className="text-xs">About</span>
          </a>
        </div>
      </div>
    </div>
  );
}