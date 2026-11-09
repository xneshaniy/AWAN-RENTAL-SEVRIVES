'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowDown,
  ArrowUp,
  Film,
  Image as ImageIcon,
  Loader2,
  Play,
  RefreshCw,
  Trash2,
  Upload,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  addSiteMediaItem,
  deleteSiteMediaItem,
  moveSiteMediaItem,
  replaceSiteMediaItem,
  updateSiteMediaCaption,
} from '@/actions/site-media';
import {
  MAX_MEDIA_CAPTION,
  SITE_MEDIA_MAX_ITEMS,
  displayImageUrl,
  videoPosterUrl,
  type SiteMediaItem,
  type SiteMediaNamespace,
} from '@/lib/site-media';

const ACCEPT = 'image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime';

interface SiteMediaManagerProps {
  /** Which gallery namespace this manager edits. */
  namespace: SiteMediaNamespace;
  /** Public destination label used in the helper copy, e.g. "Self Drive Rentals page". */
  destinationLabel: string;
  items: SiteMediaItem[];
  uploadConfigured: boolean;
}

interface UploadResultBody {
  url?: string;
  publicId?: string;
  width?: number;
  height?: number;
  error?: string;
}

const kindOf = (file: File) => (file.type.startsWith('video/') ? 'video' : 'image');

export function SiteMediaManager({ namespace, destinationLabel, items, uploadConfigured }: SiteMediaManagerProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [busyItem, setBusyItem] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [urlKind, setUrlKind] = useState<'image' | 'video'>('image');
  const [urlBusy, setUrlBusy] = useState(false);
  const uploadRef = useRef<HTMLInputElement>(null);
  const replaceRefs = useRef(new Map<string, HTMLInputElement>());

  async function handleAddByUrl() {
    const url = urlInput.trim();
    if (!url || urlBusy) return;
    if (!url.startsWith('https://') && !url.startsWith('/')) {
      toast.error('Only https:// URLs or root paths like /hero.jpg are allowed.');
      return;
    }
    setUrlBusy(true);
    const result = await addSiteMediaItem(namespace, { url, kind: urlKind });
    setUrlBusy(false);
    if (!result.success) {
      toast.error(result.error || 'Could not add the media item.');
      return;
    }
    setUrlInput('');
    toast.success('Media added.');
    router.refresh();
  }

  async function uploadOne(file: File): Promise<{ ok: boolean; error?: string }> {
    const kind = kindOf(file);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('kind', kind);

    let response: Response;
    try {
      response = await fetch('/api/admin/upload', { method: 'POST', body: formData });
    } catch {
      return { ok: false, error: 'Could not reach the upload service. Check your connection.' };
    }

    const body = (await response.json().catch(() => ({}))) as UploadResultBody;
    if (!response.ok || !body?.url) {
      return { ok: false, error: body?.error || `Upload failed (HTTP ${response.status}).` };
    }

    const saved = await addSiteMediaItem(namespace, {
      url: body.url,
      publicId: body.publicId ?? null,
      kind,
      width: body.width,
      height: body.height,
    });
    if (!saved.success) {
      return { ok: false, error: saved.error || 'The file uploaded, but saving it failed.' };
    }
    return { ok: true };
  }

  async function handleUpload(files: FileList | null) {
    if (!files?.length || busy) return;
    const selected = Array.from(files);
    setBusy(true);

    const failures: string[] = [];
    let added = 0;
    for (const file of selected) {
      const accepted =
        file.type === 'image/jpeg' ||
        file.type === 'image/png' ||
        file.type === 'image/webp' ||
        file.type.startsWith('video/');
      if (!accepted) {
        failures.push(`${file.name}: unsupported type (use JPG, PNG, WEBP or MP4).`);
        continue;
      }
      const result = await uploadOne(file);
      if (result.ok) added += 1;
      else failures.push(`${file.name}: ${result.error ?? 'upload failed'}`);
    }

    setBusy(false);
    if (uploadRef.current) uploadRef.current.value = '';
    if (added > 0) toast.success(`${added} file${added === 1 ? '' : 's'} uploaded.`);
    if (failures.length > 0) {
      console.error('Media upload failures:', failures);
      toast.error(failures[0]);
    }
    router.refresh();
  }

  async function handleReplace(id: string, file: File | undefined) {
    if (!file || busyItem) return;
    setBusyItem(id);
    const kind = kindOf(file);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('kind', kind);

    try {
      const response = await fetch('/api/admin/upload', { method: 'POST', body: formData });
      const body = (await response.json().catch(() => ({}))) as UploadResultBody;
      if (!response.ok || !body?.url) {
        toast.error(body?.error || 'Upload failed. Please try again.');
        return;
      }
      const replaced = await replaceSiteMediaItem(namespace, id, {
        url: body.url,
        publicId: body.publicId ?? null,
        kind,
        width: body.width,
        height: body.height,
      });
      if (!replaced.success) {
        toast.error(replaced.error || 'Could not save the replacement.');
        return;
      }
      toast.success('Media replaced.');
      router.refresh();
    } catch {
      toast.error('Could not reach the upload service.');
    } finally {
      setBusyItem(null);
    }
  }

  async function handleCaption(id: string, caption: string) {
    const trimmed = caption.trim();
    const result = await updateSiteMediaCaption(namespace, id, trimmed);
    if (!result.success) {
      toast.error(result.error || 'Could not save the caption.');
      return;
    }
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Remove this media item?')) return;
    setBusyItem(id);
    const result = await deleteSiteMediaItem(namespace, id);
    setBusyItem(null);
    if (!result.success) {
      toast.error(result.error || 'Could not delete the media.');
      return;
    }
    toast.success('Media removed.');
    router.refresh();
  }

  async function handleMove(id: string, direction: 'up' | 'down') {
    setBusyItem(id);
    const result = await moveSiteMediaItem(namespace, id, direction);
    setBusyItem(null);
    if (!result.success) toast.error(result.error || 'Could not reorder.');
    router.refresh();
  }

  const atCapacity = items.length >= SITE_MEDIA_MAX_ITEMS;

  return (
    <div className="space-y-6">
      {/* Upload bar */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-heading text-lg font-semibold text-gray-900 dark:text-white">
              Upload media
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              JPG, JPEG, PNG, WEBP or MP4 · {items.length} of {SITE_MEDIA_MAX_ITEMS} used ·{' '}
              {atCapacity && <span className="font-medium text-amber-600 dark:text-amber-400">limit reached </span>}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <input
              ref={uploadRef}
              type="file"
              accept={ACCEPT}
              multiple
              className="sr-only"
              aria-hidden="true"
              onChange={(event) => void handleUpload(event.target.files)}
            />
            <button
              type="button"
              onClick={() => uploadRef.current?.click()}
              disabled={busy || atCapacity || !uploadConfigured}
              className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Upload className="h-4 w-4" aria-hidden="true" />
              )}
              {busy ? 'Uploading…' : 'Upload from device'}
            </button>
          </div>
        </div>

        {!uploadConfigured && (
          <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
            Uploads are not configured for this environment. Set the Cloudinary credentials, then
            reload this page to enable uploading from your device.
          </p>
        )}

        {/* Fallback: add media by URL (works everywhere, useful before Cloudinary is set) */}
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300 sm:w-44 sm:shrink-0">
            Or add by URL
          </span>
          <select
            value={urlKind}
            onChange={(event) => setUrlKind(event.target.value as 'image' | 'video')}
            aria-label="Media type"
            className="h-10 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
          >
            <option value="image">Image</option>
            <option value="video">Video</option>
          </select>
          <input
            type="url"
            value={urlInput}
            onChange={(event) => setUrlInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') void handleAddByUrl();
            }}
            placeholder="https://… or /hero.jpg"
            aria-label="Media URL"
            className="h-10 min-w-0 flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
          />
          <button
            type="button"
            onClick={() => void handleAddByUrl()}
            disabled={urlBusy || !urlInput.trim() || atCapacity}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-primary-600 px-4 text-sm font-semibold text-primary-600 transition-colors hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-primary-400 dark:text-primary-300 dark:hover:bg-primary-900/20"
          >
            {urlBusy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : 'Add'}
          </button>
        </div>
      </div>

      {/* Grid of items */}
      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 px-6 py-16 text-center dark:border-gray-700">
          <ImageIcon className="mx-auto h-8 w-8 text-gray-400" aria-hidden="true" />
          <p className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No media yet</p>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Upload photos or clips from your device — they will appear on the {destinationLabel}.
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3" role="list">
          {items.map((item, index) => {
            const isVideo = item.type === 'video';
            const poster = isVideo ? videoPosterUrl(item.url, 480) : null;
            const isBusy = busyItem === item.id;
            return (
              <li
                key={item.id}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="relative aspect-video w-full overflow-hidden bg-gray-100 dark:bg-gray-900">
                  {isVideo ? (
                    <>
                      {poster ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={poster}
                          alt={item.caption?.trim() || 'Video thumbnail'}
                          loading="lazy"
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      ) : (
                        <video
                          src={item.url}
                          muted
                          playsInline
                          preload="metadata"
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      )}
                      <span className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-gray-900 shadow">
                          <Play className="ml-0.5 h-5 w-5" aria-hidden="true" />
                        </span>
                      </span>
                      <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded bg-black/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                        <Film className="h-3 w-3" aria-hidden="true" /> Video
                      </span>
                    </>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={displayImageUrl(item.url, 600)}
                      alt={item.caption?.trim() || 'Media image'}
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  )}
                </div>

                <div className="space-y-3 p-4">
                  <label className="block">
                    <span className="sr-only">Caption</span>
                    <input
                      type="text"
                      defaultValue={item.caption ?? ''}
                      maxLength={MAX_MEDIA_CAPTION}
                      placeholder="Caption (optional)"
                      onBlur={(event) => {
                        if (event.target.value.trim() !== (item.caption ?? '').trim()) {
                          void handleCaption(item.id, event.target.value);
                        }
                      }}
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                    />
                  </label>

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => void handleMove(item.id, 'up')}
                        disabled={index === 0 || isBusy}
                        aria-label="Move up"
                        title="Move up"
                        className="rounded-lg border border-gray-200 p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-primary-600 disabled:cursor-not-allowed disabled:opacity-30 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                      >
                        <ArrowUp className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleMove(item.id, 'down')}
                        disabled={index === items.length - 1 || isBusy}
                        aria-label="Move down"
                        title="Move down"
                        className="rounded-lg border border-gray-200 p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-primary-600 disabled:cursor-not-allowed disabled:opacity-30 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                      >
                        <ArrowDown className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <input
                        ref={(node) => {
                          if (node) replaceRefs.current.set(item.id, node);
                          else replaceRefs.current.delete(item.id);
                        }}
                        type="file"
                        accept={ACCEPT}
                        className="sr-only"
                        aria-label="Replace media"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) void handleReplace(item.id, file);
                          event.target.value = '';
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => replaceRefs.current.get(item.id)?.click()}
                        disabled={isBusy || !uploadConfigured}
                        aria-label="Replace media"
                        title="Replace media"
                        className="rounded-lg border border-gray-200 p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-primary-600 disabled:cursor-not-allowed disabled:opacity-30 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                      >
                        <RefreshCw className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(item.id)}
                        disabled={isBusy}
                        aria-label="Delete media"
                        title="Delete media"
                        className="rounded-lg border border-red-200 p-2 text-red-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40"
                      >
                        {isBusy ? (
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        ) : (
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
