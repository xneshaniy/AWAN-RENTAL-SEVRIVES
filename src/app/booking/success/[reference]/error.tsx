'use client';

import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

/**
 * Error boundary for /booking/success/[reference]. Shows a generic, friendly
 * message — the underlying error message and stack are never rendered, so no
 * database or application internals can leak to the visitor.
 */
export default function BookingSuccessError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <Card variant="elevated" padding="lg" className="w-full max-w-2xl text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
          <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" aria-hidden="true" />
        </div>
        <h1 className="mb-3 font-heading text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
          Something Went Wrong
        </h1>
        <p className="mb-8 text-gray-600 dark:text-gray-400">
          We could not load this booking confirmation. Please try again, or return to the home page.
        </p>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Button size="lg" onClick={reset} fullWidth className="sm:w-auto">
            Try Again
          </Button>
          <Button size="lg" variant="outline" asChild fullWidth className="sm:w-auto">
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
