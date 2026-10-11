'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ChevronRight, Home } from 'lucide-react';

const ROUTE_LABELS: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/bookings': 'Bookings',
  '/admin/bookings/': 'Bookings',
  '/admin/vehicles': 'Vehicles',
  '/admin/vehicles/': 'Vehicles',
  '/admin/vehicles/create': 'Add Vehicle',
  '/admin/gallery': 'Gallery',
  '/admin/services': 'Services',
  '/admin/blog': 'Blog',
  '/admin/blog/new': 'New Post',
  '/admin/blog/': 'Blog',
  '/admin/faq': 'FAQ',
  '/admin/customers': 'Customers',
  '/admin/messages': 'Messages',
  '/admin/settings': 'Settings',
  '/admin/seo': 'SEO',
  '/admin/users': 'Admin Users',
};

/**
 * Breadcrumb component for admin pages.
 * Builds breadcrumbs from the current pathname.
 */
export function Breadcrumb() {
  const pathname = usePathname();

  const segments = pathname
    .split('/')
    .filter(Boolean)
    .map((segment, index, arr) => {
      const href = '/' + arr.slice(0, index + 1).join('/');
      const label = ROUTE_LABELS[href] || segment.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      const isLast = index === arr.length - 1;
      return { href, label, isLast };
    });

  // Prepend Home/Admin
  const crumbs = [
    { href: '/admin', label: 'Admin', isLast: segments.length === 0 },
    ...segments,
  ];

  return (
    <nav
      className="flex items-center gap-1.5 text-sm lg:flex"
      aria-label="Breadcrumb"
    >
      <ol className="flex items-center gap-1.5" role="list">
        {crumbs.map((crumb, index) => (
          <li key={crumb.href} className="flex items-center gap-1.5">
            {index > 0 && (
              <ChevronRight className="h-3.5 w-3.5 text-gray-400 dark:text-gray-600 flex-shrink-0" aria-hidden="true" />
            )}
            {crumb.isLast ? (
              <span className="font-medium text-gray-900 dark:text-white truncate max-w-[200px]">
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className="text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors truncate max-w-[150px]"
              >
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/**
 * PageHeader - consistent header for admin pages
 */
interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  breadcrumb?: React.ReactNode;
}

export function PageHeader({ title, description, action, breadcrumb }: PageHeaderProps) {
  return (
    <header className="mb-6">
      {breadcrumb && <div className="mb-4">{breadcrumb}</div>}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-heading text-3xl font-bold text-gray-900 dark:text-white truncate">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>
        {action && (
          <div className="flex-shrink-0">
            {action}
          </div>
        )}
      </div>
    </header>
  );
}