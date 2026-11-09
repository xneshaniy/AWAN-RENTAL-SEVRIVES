'use server';

import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { requireStaffAccess } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { deleteCloudinaryAsset } from '@/lib/cloudinary';
import {
  MAX_MEDIA_CAPTION,
  SITE_MEDIA_MAX_ITEMS,
  SITE_MEDIA_NAMESPACES,
  parseSiteMediaItems,
  serializeSiteMediaItems,
  writeSiteMedia,
  type SiteMediaItem,
  type SiteMediaNamespace,
} from '@/lib/site-media';

interface MediaActionResult<T> {
  success: boolean;
  error?: string;
  data?: T;
}

const namespaceSchema = z.enum(SITE_MEDIA_NAMESPACES as [SiteMediaNamespace, ...SiteMediaNamespace[]]);

const assetInputSchema = z.object({
  url: z
    .string()
    .min(1)
    .max(2048)
    .refine((value) => value.startsWith('https://') || value.startsWith('/'), 'Only https:// URLs or root paths are allowed.'),
  publicId: z.string().max(512).nullish(),
  kind: z.enum(['image', 'video']),
  caption: z.string().trim().max(MAX_MEDIA_CAPTION).optional(),
  width: z.number().int().nonnegative().max(20000).optional(),
  height: z.number().int().nonnegative().max(20000).optional(),
});

const captionSchema = z.string().trim().max(MAX_MEDIA_CAPTION);

const TITLES: Record<SiteMediaNamespace, string> = {
  self_drive_gallery: 'Self Drive Gallery',
  homepage_showcase: 'Homepage Showcase',
};

const REVALIDATE_PATHS: Record<SiteMediaNamespace, string[]> = {
  self_drive_gallery: ['/self-drive', '/admin/self-drive-gallery'],
  homepage_showcase: ['/', '/admin/homepage-media'],
};

async function readItems(namespace: SiteMediaNamespace): Promise<SiteMediaItem[]> {
  const row = await prisma.siteContent.findUnique({ where: { key: namespace } });
  return parseSiteMediaItems(row?.content ?? null);
}

async function writeItems(namespace: SiteMediaNamespace, items: SiteMediaItem[]) {
  await writeSiteMedia(namespace, TITLES[namespace], items);
  for (const path of REVALIDATE_PATHS[namespace]) {
    revalidatePath(path);
  }
}

/** Upload one media asset onto a gallery namespace. */
export async function addSiteMediaItem(
  namespace: SiteMediaNamespace,
  input: z.input<typeof assetInputSchema>
): Promise<MediaActionResult<SiteMediaItem>> {
  await requireStaffAccess();

  const parsedNamespace = namespaceSchema.safeParse(namespace);
  if (!parsedNamespace.success) return { success: false, error: 'Invalid gallery.' };

  const parsed = assetInputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid media item.' };
  }

  const items = await readItems(parsedNamespace.data);
  if (items.length >= SITE_MEDIA_MAX_ITEMS) {
    return {
      success: false,
      error: `The gallery can hold up to ${SITE_MEDIA_MAX_ITEMS} items. Remove one first.`,
    };
  }

  const item: SiteMediaItem = {
    id: randomUUID(),
    url: parsed.data.url,
    publicId: parsed.data.publicId ?? null,
    type: parsed.data.kind,
    caption: parsed.data.caption,
    width: parsed.data.width,
    height: parsed.data.height,
    createdAt: Date.now(),
  };

  try {
    await writeItems(parsedNamespace.data, [...items, item]);
    return { success: true, data: item };
  } catch (error) {
    console.error('Add site media item error:', error);
    return { success: false, error: 'Failed to save the media. Please try again.' };
  }
}

/** Update the caption of one media item. */
export async function updateSiteMediaCaption(
  namespace: SiteMediaNamespace,
  id: string,
  caption: string
): Promise<MediaActionResult<SiteMediaItem>> {
  await requireStaffAccess();

  const parsedNamespace = namespaceSchema.safeParse(namespace);
  if (!parsedNamespace.success) return { success: false, error: 'Invalid gallery.' };

  const parsed = captionSchema.safeParse(caption);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid caption.' };
  }

  const items = await readItems(parsedNamespace.data);
  const index = items.findIndex((item) => item.id === id);
  if (index === -1) return { success: false, error: 'That media item no longer exists.' };

  const updated = [...items];
  updated[index] = { ...updated[index], caption: parsed.data || undefined };

  try {
    await writeItems(parsedNamespace.data, updated);
    return { success: true, data: updated[index] };
  } catch (error) {
    console.error('Update site media caption error:', error);
    return { success: false, error: 'Failed to save the caption.' };
  }
}

/** Delete a media item and its Cloudinary asset (best effort). */
export async function deleteSiteMediaItem(
  namespace: SiteMediaNamespace,
  id: string
): Promise<MediaActionResult<true>> {
  await requireStaffAccess();

  const parsedNamespace = namespaceSchema.safeParse(namespace);
  if (!parsedNamespace.success) return { success: false, error: 'Invalid gallery.' };

  const items = await readItems(parsedNamespace.data);
  const target = items.find((item) => item.id === id);
  if (!target) return { success: false, error: 'That media item no longer exists.' };

  const remaining = items.filter((item) => item.id !== id);
  try {
    await writeItems(parsedNamespace.data, remaining);
  } catch (error) {
    console.error('Delete site media item error:', error);
    return { success: false, error: 'Failed to delete the media.' };
  }

  await deleteCloudinaryAsset(target.publicId, target.type);
  return { success: true, data: true };
}

/** Replace a media item with a new upload, deleting the old asset. */
export async function replaceSiteMediaItem(
  namespace: SiteMediaNamespace,
  id: string,
  input: z.input<typeof assetInputSchema>
): Promise<MediaActionResult<SiteMediaItem>> {
  await requireStaffAccess();

  const parsedNamespace = namespaceSchema.safeParse(namespace);
  if (!parsedNamespace.success) return { success: false, error: 'Invalid gallery.' };

  const parsed = assetInputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid media item.' };
  }

  const items = await readItems(parsedNamespace.data);
  const index = items.findIndex((item) => item.id === id);
  if (index === -1) return { success: false, error: 'That media item no longer exists.' };

  const previous = items[index];
  const replacement: SiteMediaItem = {
    ...previous,
    url: parsed.data.url,
    publicId: parsed.data.publicId ?? null,
    type: parsed.data.kind,
    caption: parsed.data.caption ?? previous.caption,
    width: parsed.data.width ?? previous.width,
    height: parsed.data.height ?? previous.height,
  };

  const updated = [...items];
  updated[index] = replacement;

  try {
    await writeItems(parsedNamespace.data, updated);
  } catch (error) {
    console.error('Replace site media item error:', error);
    return { success: false, error: 'Failed to save the replacement media.' };
  }

  await deleteCloudinaryAsset(previous.publicId, previous.type);
  return { success: true, data: replacement };
}

/** Move a media item one position up or down. */
export async function moveSiteMediaItem(
  namespace: SiteMediaNamespace,
  id: string,
  direction: 'up' | 'down'
): Promise<MediaActionResult<true>> {
  await requireStaffAccess();

  const parsedNamespace = namespaceSchema.safeParse(namespace);
  if (!parsedNamespace.success) return { success: false, error: 'Invalid gallery.' };

  if (direction !== 'up' && direction !== 'down') {
    return { success: false, error: 'Invalid direction.' };
  }

  const items = await readItems(parsedNamespace.data);
  const index = items.findIndex((item) => item.id === id);
  if (index === -1) return { success: false, error: 'That media item no longer exists.' };

  const target = direction === 'up' ? index - 1 : index + 1;
  if (target < 0 || target >= items.length) return { success: true, data: true };

  const updated = [...items];
  [updated[index], updated[target]] = [updated[target], updated[index]];

  try {
    await writeItems(parsedNamespace.data, updated);
    return { success: true, data: true };
  } catch (error) {
    console.error('Move site media item error:', error);
    return { success: false, error: 'Failed to reorder the media.' };
  }
}
