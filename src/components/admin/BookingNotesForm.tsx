'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { addBookingAdminNote } from '@/actions/booking';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Input';
import { StickyNote } from 'lucide-react';

interface BookingNotesFormProps {
  bookingId: string;
  existingNotes: string | null;
}

/**
 * Admin notes for a booking. New notes are appended server-side with a
 * timestamp, so earlier notes are never lost. Saved to the adminNotes column
 * in PostgreSQL - never shown on any public page.
 */
export function BookingNotesForm({ bookingId, existingNotes }: BookingNotesFormProps) {
  const router = useRouter();
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const save = async () => {
    if (!note.trim()) {
      toast.error('Write a note before saving');
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await addBookingAdminNote(bookingId, note);
      if (!result.success) {
        toast.error(result.error || 'Failed to save note');
        return;
      }
      toast.success('Note saved');
      setNote('');
      router.refresh();
    } catch {
      toast.error('Failed to save note. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {existingNotes ? (
        <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800/60">
          <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 dark:text-gray-300">
            {existingNotes}
          </pre>
        </div>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400">No admin notes yet.</p>
      )}

      <div className="space-y-2">
        <label
          htmlFor="admin-note"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Add a note
        </label>
        <Textarea
          id="admin-note"
          rows={3}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Internal note - visible to admin/staff only..."
          disabled={isSubmitting}
        />
        <Button
          type="button"
          size="sm"
          onClick={save}
          loading={isSubmitting}
          disabled={isSubmitting || !note.trim()}
        >
          <StickyNote className="mr-1.5 h-4 w-4" aria-hidden="true" />
          {isSubmitting ? 'Saving...' : 'Save Note'}
        </Button>
      </div>
    </div>
  );
}
