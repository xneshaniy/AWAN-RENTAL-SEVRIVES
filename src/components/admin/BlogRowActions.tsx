'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Pencil, Send, Undo2, Archive, Trash2 } from 'lucide-react';
import {
  setBlogPostPublished,
  archiveBlogPost,
  restoreBlogPost,
  deleteBlogPost,
} from '@/actions/blog';
import { Button } from '@/components/ui/Button';

interface BlogRowActionsProps {
  postId: string;
  isPublished: boolean;
  isArchived: boolean;
}

/**
 * Publish/unpublish, archive/restore and delete controls for one blog post
 * in the admin list. Delete needs a second confirming click and archived
 * posts are restored to draft (never auto-published).
 */
export function BlogRowActions({ postId, isPublished, isArchived }: BlogRowActionsProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const run = async (
    action: () => Promise<{ success: boolean; error?: string }>,
    successMessage: string
  ) => {
    setBusy(true);
    try {
      const result = await action();
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

  const onDelete = () => {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    run(() => deleteBlogPost(postId), 'Post deleted');
  };

  return (
    <div className="flex flex-wrap justify-end gap-2">
      <Button asChild variant="outline" size="sm">
        <Link href={`/admin/blog/${postId}/edit`}>
          <Pencil className="mr-1.5 h-4 w-4" aria-hidden="true" />
          Edit
        </Link>
      </Button>

      {!isArchived && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() =>
            run(
              () => setBlogPostPublished(postId, !isPublished),
              isPublished ? 'Post unpublished' : 'Post published'
            )
          }
        >
          {isPublished ? (
            <>
              <Undo2 className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Unpublish
            </>
          ) : (
            <>
              <Send className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Publish
            </>
          )}
        </Button>
      )}

      {!isArchived ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => run(() => archiveBlogPost(postId), 'Post archived')}
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
          onClick={() => run(() => restoreBlogPost(postId), 'Post restored as draft')}
        >
          <Undo2 className="mr-1.5 h-4 w-4" aria-hidden="true" />
          Restore
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
          Cancel
        </Button>
      )}
    </div>
  );
}
