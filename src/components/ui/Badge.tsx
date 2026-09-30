'use client';

import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', dot, children, ...props }, ref) => {
    const variants = {
      default: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
      success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      danger: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      outline: 'bg-transparent border border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300',
    };

    const sizes = {
      sm: 'px-2 py-0.5 text-xs gap-1',
      md: 'px-2.5 py-1 text-sm gap-1.5',
      lg: 'px-3 py-1.5 text-base gap-2',
    };

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center font-medium rounded-full',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {dot && <span className={cn('w-1.5 h-1.5 rounded-full', variants[variant].replace('bg-', 'bg-').replace('text-', 'bg-'))} />}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { label: string; variant: BadgeProps['variant']; dot?: boolean }> = {
    PENDING: { label: 'Pending', variant: 'warning', dot: true },
    CONFIRMED: { label: 'Confirmed', variant: 'info', dot: true },
    ACTIVE: { label: 'In Progress', variant: 'success', dot: true },
    COMPLETED: { label: 'Completed', variant: 'default', dot: true },
    CANCELLED: { label: 'Cancelled', variant: 'danger', dot: true },
    NO_SHOW: { label: 'No Show', variant: 'danger', dot: true },
    NEW: { label: 'New', variant: 'info', dot: true },
    IN_PROGRESS: { label: 'In Progress', variant: 'warning', dot: true },
    RESOLVED: { label: 'Resolved', variant: 'success', dot: true },
    CLOSED: { label: 'Closed', variant: 'default', dot: true },
    UNPAID: { label: 'Unpaid', variant: 'danger', dot: true },
    PARTIAL: { label: 'Partial', variant: 'warning', dot: true },
    PAID: { label: 'Paid', variant: 'success', dot: true },
    REFUNDED: { label: 'Refunded', variant: 'info', dot: true },
    FAILED: { label: 'Failed', variant: 'danger', dot: true },
  };

  const config = statusConfig[status] || { label: status, variant: 'default' };

  return <Badge variant={config.variant} dot={config.dot}>{config.label}</Badge>;
}