'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import {
  Mail,
  MailOpen,
  CheckCircle2,
  Archive,
  Trash2,
  Undo2,
} from 'lucide-react';
import {
  setContactMessageRead,
  setContactMessageStatus,
  deleteContactMessage,
} from '@/actions/messages';
import { Button } from '@/components/ui/Button';

interface MessageActionsProps {
  messageId: string;
  isRead: boolean;
  status: 'OPEN' | 'RESOLVED' | 'ARCHIVED';
}

/**
 * Read/unread, resolve, archive and delete controls for one contact
 * message. Delete needs a second confirming click. All mutations run through
 * staff-guarded server actions writing to ContactMessage in PostgreSQL.
 */
export function MessageActions({ messageId, isRead, status }: MessageActionsProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const run = async (
    action: () => Promise<{ success: boolean; error?: string }>,
    successMessage: string,
    after?: () => void
  ) => {
    setBusy(true);
    try {
      const result = await action();
      if (!result.success) {
        toast.error(result.error || 'Action failed');
        return;
      }
      toast.success(successMessage);
      after?.();
      router.refresh();
    } catch {
      toast.error('Action failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const onDelete = () => {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    run(() => deleteContactMessage(messageId), 'Message deleted', () =>
      router.push('/admin/messages')
    );
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={busy}
        onClick={() =>
          run(
            () => setContactMessageRead(messageId, !isRead),
            isRead ? 'Marked as unread' : 'Marked as read'
          )
        }
      >
        {isRead ? (
          <>
            <Mail className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Mark Unread
          </>
        ) : (
          <>
            <MailOpen className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Mark Read
          </>
        )}
      </Button>

      {status !== 'RESOLVED' && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() =>
            run(() => setContactMessageStatus(messageId, 'RESOLVED'), 'Message marked resolved')
          }
        >
          <CheckCircle2 className="mr-1.5 h-4 w-4" aria-hidden="true" />
          Mark Resolved
        </Button>
      )}

      {status === 'RESOLVED' && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() =>
            run(() => setContactMessageStatus(messageId, 'OPEN'), 'Message reopened')
          }
        >
          <Undo2 className="mr-1.5 h-4 w-4" aria-hidden="true" />
          Reopen
        </Button>
      )}

      {status !== 'ARCHIVED' ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() =>
            run(() => setContactMessageStatus(messageId, 'ARCHIVED'), 'Message archived')
          }
        >
          <Archive className="mr-1.5 h-4 w-4" aria-hidden="true" />
          Archive
        </Button>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => run(() => setContactMessageStatus(messageId, 'OPEN'), 'Message restored')}
        >
          <Undo2 className="mr-1.5 h-4 w-4" aria-hidden="true" />
          Unarchive
        </Button>
      )}

      <Button
        type="button"
        variant={confirmingDelete ? 'destructive' : 'outline'}
        size="sm"
        disabled={busy}
        onClick={onDelete}
      >
        <Trash2 className="mr-1.5 h-4 w-4" aria-hidden="true" />
        {confirmingDelete ? 'Confirm Delete?' : 'Delete'}
      </Button>
      {confirmingDelete && (
        <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmingDelete(false)}>
          Keep Message
        </Button>
      )}
    </div>
  );
}
