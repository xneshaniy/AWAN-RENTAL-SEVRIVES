'use client';

import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

/**
 * Error boundary for the admin segment. Shows a generic message only - the
 * underlying error message and stack are never rendered, so no database or
 * application internals can leak to the browser.
 */
export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Card variant="elevated" padding="lg" className="w-full max-w-lg text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
          <AlertTriangle className="h-7 w-7 text-red-600 dark:text-red-400" aria-hidden="true" />
        </div>
        <h2 className="mb-2 font-heading text-xl font-bold text-gray-900 dark:text-white">
          Something Went Wrong
        </h2>
        <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
          We could not load this admin page. Please try again, or return to the dashboard.
        </p>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Button onClick={reset} type="button">
            Try Again
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin">Back to Dashboard</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
