import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'Unauthorized Access',
  robots: { index: false, follow: false },
};

/**
 * 403-style page for authenticated visitors whose account role does not grant
 * access to the admin area (e.g. CUSTOMER accounts). Reached from the layout
 * and middleware when a session exists but the role check fails.
 */
export default function AdminUnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-900">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-lg dark:border-gray-700 dark:bg-gray-800">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
          <ShieldAlert className="h-8 w-8 text-amber-600 dark:text-amber-400" aria-hidden="true" />
        </div>
        <h1 className="mb-3 font-heading text-2xl font-bold text-gray-900 dark:text-white">
          You Don&apos;t Have Access
        </h1>
        <p className="mb-8 text-gray-600 dark:text-gray-400">
          This area is restricted to Awan Rental Service administrators. If you believe you should
          have access, please contact the site administrator.
        </p>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/admin/login">Sign In as Admin</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
