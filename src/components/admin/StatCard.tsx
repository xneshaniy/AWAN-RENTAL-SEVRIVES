'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { LiveStatValue } from '@/components/admin/LiveStatValue';

interface StatCardProps {
  label: string;
  value: React.ReactNode | string | number;
  icon: React.ReactNode;
  color: string;
  href?: string;
  trend?: {
    value: number;
    label: string;
    positive?: boolean;
  };
  loading?: boolean;
}

export function StatCard({ label, value, icon, color, href, trend, loading = false }: StatCardProps) {
  const content = (
    <div className="flex items-start justify-between">
      <div className="min-w-0">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{label}</p>
        <p className="font-heading font-bold text-2xl sm:text-3xl text-gray-900 dark:text-white">
          {loading ? (
            <span className="inline-block h-8 w-24 animate-pulse bg-gray-200 dark:bg-gray-700 rounded" />
          ) : (
            value
          )}
        </p>
        {trend && (
          <div className="mt-2 flex items-center gap-1">
            <span
              className={cn(
                'text-xs font-medium',
                trend.positive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              )}
            >
              {trend.positive ? '↑' : '↓'} {trend.value}% {trend.label}
            </span>
          </div>
        )}
      </div>
      <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0', color)}>
        {icon}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block"
        aria-label={`View ${label}`}
      >
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 hover:shadow-md hover:border-primary-200 dark:hover:border-primary-800 transition-all duration-200">
          {content}
        </div>
      </Link>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
      {content}
    </div>
  );
}