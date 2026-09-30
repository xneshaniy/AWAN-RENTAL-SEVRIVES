'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Car, Home, RefreshCw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" aria-hidden="true" />
          </div>
        </div>
        <h1 className="font-heading font-bold text-3xl text-gray-900 dark:text-white mb-4">
          Something Went Wrong
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          We apologize for the inconvenience. An unexpected error occurred while loading this page.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={reset}>
            <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
            Try Again
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-8 text-left p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm">
            <summary className="font-medium cursor-pointer mb-2">Error Details (Development)</summary>
            <pre className="whitespace-pre-wrap text-red-600 dark:text-red-400">{error.message}</pre>
            {error.digest && <p className="mt-2 text-gray-500">Digest: {error.digest}</p>}
          </details>
        )}
      </div>
    </div>
  );
}