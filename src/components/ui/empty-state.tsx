'use client';

import { cn } from '@/lib/utils';
import Image from 'next/image';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  icon,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center py-16 px-4',
        className
      )}
    >
      <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
        {icon || <Image src="/placeholder-vehicle.png" alt="" width={40} height={40} className="rounded-full" />}
      </div>
      <h2 className="font-heading font-bold text-xl sm:text-2xl text-foreground mb-2">
        {title}
      </h2>
      <p className="text-muted-foreground mb-6 max-w-sm">
        {description}
      </p>
      {actionLabel && actionHref && (
        <a
          href={actionHref}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors touch-target"
        >
          {actionLabel}
          <span aria-hidden="true">→</span>
        </a>
      )}
    </div>
  );
}

export function NoVehiclesFound() {
  return (
    <EmptyState
      title="No Vehicles Found"
      description="No vehicles match your current search and filters. Try adjusting them, or browse the full fleet."
      actionLabel="Clear All Filters"
      actionHref="/vehicles"
      icon={
        <svg
          className="w-10 h-10 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
          />
        </svg>
      }
    />
  );
}

export function NoBookings() {
  return (
    <EmptyState
      title="No Bookings Yet"
      description="You haven't made any bookings with Awan Rental Service yet. Start your journey by selecting a vehicle."
      actionLabel="Browse Vehicles"
      actionHref="/vehicles"
      icon={
        <svg
          className="w-10 h-10 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      }
    />
  );
}

export function EmptySearchResults() {
  return (
    <EmptyState
      title="No Results"
      description="We couldn't find any vehicles matching your search criteria. Try broadening your search or adjusting your filters."
      actionLabel="Clear Filters"
      actionHref="/vehicles"
      icon={
        <svg
          className="w-10 h-10 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      }
    />
  );
}

export function EmptyDashboardRecords() {
  return (
    <EmptyState
      title="No Records Found"
      description="There are no records to display at this time. Check back later or contact support if you believe this is an error."
      actionLabel="Dashboard"
      actionHref="/admin/dashboard"
      icon={
        <svg
          className="w-10 h-10 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      }
    />
  );
}
