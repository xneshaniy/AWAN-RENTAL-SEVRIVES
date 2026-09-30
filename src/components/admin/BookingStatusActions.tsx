'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { CheckCircle, PlayCircle, Flag, Ban, HelpCircle } from 'lucide-react';
import { updateBookingStatus } from '@/actions/booking';
import { BOOKING_TRANSITION_ACTION_LABELS } from '@/lib/booking-status';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import type { BookingStatus } from '@prisma/client';

const ICONS: Record<BookingStatus, React.ComponentType<{ className?: string }>> = {
  PENDING: Ban,
  CONFIRMED: CheckCircle,
  ACTIVE: PlayCircle,
  COMPLETED: Flag,
  CANCELLED: Ban,
  NO_SHOW: HelpCircle,
};

const DANGER_TARGETS: BookingStatus[] = ['CANCELLED', 'NO_SHOW'];

interface BookingStatusActionsProps {
  bookingId: string;
  currentStatus: BookingStatus;
  /** Valid next statuses, computed server-side from BOOKING_STATUS_TRANSITIONS. */
  allowed: BookingStatus[];
}

/**
 * Status transition buttons. Only legal transitions are rendered, and
 * destructive ones (cancel / no-show) require a second confirming click.
 * Every change goes through the staff-guarded `updateBookingStatus` action,
 * which re-validates the transition server-side before writing to PostgreSQL.
 */
export function BookingStatusActions({ bookingId, currentStatus, allowed }: BookingStatusActionsProps) {
  const router = useRouter();
  const [busyTarget, setBusyTarget] = useState<BookingStatus | null>(null);
  const [confirming, setConfirming] = useState<BookingStatus | null>(null);

  if (allowed.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        This booking is in a final state ({currentStatus}) - no further status changes are possible.
      </p>
    );
  }

  const changeStatus = async (target: BookingStatus) => {
    if (DANGER_TARGETS.includes(target) && confirming !== target) {
      setConfirming(target);
      return;
    }
    setConfirming(null);
    setBusyTarget(target);
    try {
      const result = await updateBookingStatus(bookingId, target);
      if (!result.success) {
        toast.error(result.error || 'Failed to update booking status');
        return;
      }
      toast.success(`Booking marked as ${target}`);
      router.refresh();
    } catch {
      toast.error('Failed to update booking status. Please try again.');
    } finally {
      setBusyTarget(null);
    }
  };

  return (
    <div className="flex flex-wrap gap-3" role="group" aria-label="Change booking status">
      {allowed.map((target) => {
        const Icon = ICONS[target];
        const danger = DANGER_TARGETS.includes(target);
        const isConfirming = confirming === target;
        const pending = busyTarget === target;
        return (
          <Button
            key={target}
            type="button"
            variant={danger ? 'destructive' : target === 'CONFIRMED' ? 'primary' : 'outline'}
            size="sm"
            disabled={busyTarget !== null}
            loading={pending}
            onClick={() => changeStatus(target)}
            className={cn(isConfirming && 'animate-pulse')}
          >
            <Icon className="mr-1.5 h-4 w-4" aria-hidden="true" />
            {isConfirming
              ? `Confirm: ${BOOKING_TRANSITION_ACTION_LABELS[target]}?`
              : BOOKING_TRANSITION_ACTION_LABELS[target]}
          </Button>
        );
      })}
      {confirming && (
        <Button type="button" variant="ghost" size="sm" onClick={() => setConfirming(null)}>
          Keep Current Status
        </Button>
      )}
    </div>
  );
}
