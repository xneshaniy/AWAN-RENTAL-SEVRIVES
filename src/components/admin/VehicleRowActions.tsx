'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import {
  Pencil,
  Eye,
  CheckCircle2,
  CircleSlash,
  Star,
  Archive,
  ArchiveRestore,
  Trash2,
} from 'lucide-react';
import {
  archiveVehicle,
  restoreVehicle,
  deleteVehicle,
  toggleVehicleAvailability,
  toggleVehicleFeatured,
} from '@/actions/vehicle';
import { cn } from '@/lib/utils';

interface VehicleRowActionsProps {
  vehicleId: string;
  slug: string;
  name: string;
  isAvailable: boolean;
  isFeatured: boolean;
  archived: boolean;
}

function ActionLink({
  href,
  label,
  children,
  external = false,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
  external?: boolean;
}) {
  return (
    <Link
      href={href}
      title={label}
      aria-label={label}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-primary-600 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-primary-400"
    >
      {children}
    </Link>
  );
}

function ActionButton({
  label,
  onClick,
  children,
  danger = false,
  pending = false,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  danger?: boolean;
  pending?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={pending}
      onClick={onClick}
      className={cn(
        'rounded-lg p-2 transition-colors disabled:cursor-wait disabled:opacity-60',
        danger
          ? 'text-red-500 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/30'
          : 'text-gray-500 hover:bg-gray-100 hover:text-primary-600 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-primary-400'
      )}
    >
      {children}
    </button>
  );
}

/** Restore control used on both the list row and the edit page header. */
export function RestoreButton({ vehicleId, vehicleName }: { vehicleId: string; vehicleName: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const onRestore = async () => {
    setPending(true);
    try {
      const result = await restoreVehicle(vehicleId);
      if (!result.success) {
        toast.error(result.error || 'Failed to restore vehicle');
        return;
      }
      toast.success(`${vehicleName} restored to the public site`);
      router.refresh();
    } catch {
      toast.error('Failed to restore vehicle. Please try again.');
    } finally {
      setPending(false);
    }
  };

  return (
    <ActionButton label={`Restore ${vehicleName}`} onClick={onRestore} pending={pending}>
      <ArchiveRestore className="h-5 w-5" aria-hidden="true" />
    </ActionButton>
  );
}

/**
 * Per-row admin actions. Archive and Delete require a second confirming
 * click; every mutation runs through a staff-guarded server action and
 * refreshes the page so PostgreSQL data is always what is displayed.
 */
export function VehicleRowActions({
  vehicleId,
  slug,
  name,
  isAvailable,
  isFeatured,
  archived,
}: VehicleRowActionsProps) {
  const router = useRouter();
  const [pendingDelete, setPendingDelete] = useState(false);
  const [pendingArchive, setPendingArchive] = useState(false);
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<{ success: boolean; error?: string }>, successMessage: string) => {
    setBusy(true);
    try {
      const result = await fn();
      if (!result.success) {
        toast.error(result.error || 'Action failed');
        return;
      }
      toast.success(successMessage);
      router.refresh();
    } catch {
      toast.error('Action failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const onArchive = async () => {
    if (!pendingArchive) {
      setPendingArchive(true);
      return;
    }
    setPendingArchive(false);
    await run(() => archiveVehicle(vehicleId), `${name} archived (hidden from the public site)`);
  };

  const onDelete = async () => {
    if (!pendingDelete) {
      setPendingDelete(true);
      return;
    }
    setPendingDelete(false);
    await run(() => deleteVehicle(vehicleId), `${name} permanently deleted`);
  };

  if (archived) {
    return (
      <div className="flex items-center justify-end gap-1">
        <ActionLink href={`/admin/vehicles/${vehicleId}/edit`} label={`Edit ${name}`}>
          <Pencil className="h-4 w-4" aria-hidden="true" />
        </ActionLink>
        <RestoreButton vehicleId={vehicleId} vehicleName={name} />
        <ActionButton
          label={pendingDelete ? `Confirm permanent deletion of ${name}` : `Delete ${name}`}
          onClick={onDelete}
          danger
          pending={busy}
        >
          <Trash2 className="h-5 w-5" aria-hidden="true" />
        </ActionButton>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <ActionLink href={`/vehicles/${slug}`} label={`View public page for ${name}`} external>
        <Eye className="h-5 w-5" aria-hidden="true" />
      </ActionLink>
      <ActionLink href={`/admin/vehicles/${vehicleId}/edit`} label={`Edit ${name}`}>
        <Pencil className="h-4 w-4" aria-hidden="true" />
      </ActionLink>
      <ActionButton
        label={isAvailable ? `Mark ${name} unavailable` : `Mark ${name} available`}
        pending={busy}
        onClick={() =>
          run(
            () => toggleVehicleAvailability(vehicleId, !isAvailable),
            isAvailable ? `${name} marked unavailable` : `${name} marked available`
          )
        }
      >
        {isAvailable ? (
          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" aria-hidden="true" />
        ) : (
          <CircleSlash className="h-5 w-5" aria-hidden="true" />
        )}
      </ActionButton>
      <ActionButton
        label={isFeatured ? `Remove ${name} from featured` : `Feature ${name}`}
        pending={busy}
        onClick={() =>
          run(
            () => toggleVehicleFeatured(vehicleId, !isFeatured),
            isFeatured ? `${name} removed from featured` : `${name} marked featured`
          )
        }
      >
        <Star
          className={cn('h-5 w-5', isFeatured && 'fill-current text-amber-500')}
          aria-hidden="true"
        />
      </ActionButton>
      <ActionButton
        label={pendingArchive ? `Confirm archiving of ${name}` : `Archive ${name}`}
        onClick={onArchive}
        pending={busy}
      >
        <Archive className="h-5 w-5" aria-hidden="true" />
      </ActionButton>
      <ActionButton
        label={pendingDelete ? `Confirm permanent deletion of ${name}` : `Delete ${name}`}
        onClick={onDelete}
        danger
        pending={busy}
      >
        <Trash2 className="h-5 w-5" aria-hidden="true" />
      </ActionButton>
    </div>
  );
}
