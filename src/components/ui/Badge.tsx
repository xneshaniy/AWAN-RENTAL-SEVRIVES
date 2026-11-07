'use client';

import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'outline' | 'gold';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', dot, children, ...props }, ref) => {
    const variants = {
      default: 'bg-muted text-muted-foreground',
      secondary: 'bg-secondary text-secondary-foreground',
      success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
      danger: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      gold: 'bg-accent/10 text-accent-foreground border border-accent/20',
      outline: 'border border-input bg-background text-foreground',
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
          'inline-flex items-center justify-center font-medium rounded-full border',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {dot && (
          <span
            className={cn(
              'h-1.5 w-1.5 rounded-full',
              variant === 'success' ? 'bg-green-500' :
              variant === 'warning' ? 'bg-amber-500' :
              variant === 'danger' ? 'bg-red-500' :
              variant === 'info' ? 'bg-blue-500' :
              'bg-primary'
            )}
          />
        )}
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
    ACTIVE: { label: 'Active', variant: 'success', dot: true },
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
