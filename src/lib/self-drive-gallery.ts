import {
  getSiteMedia,
  parseSiteMediaItems,
  serializeSiteMediaItems,
  SITE_MEDIA_MAX_ITEMS,
  MAX_MEDIA_CAPTION,
  type SiteMediaItem,
} from '@/lib/site-media';
import { prisma } from '@/lib/prisma';
import { cache } from 'react';

/**
 * Self-Drive Rentals media gallery.
 *
 * Thin wrapper around the generic `@/lib/site-media` helpers, kept so every
 * existing call site (page, actions, uploaders) keeps the same names.
 */

export const SELF_DRIVE_GALLERY_KEY = 'self_drive_gallery';
export const SELF_DRIVE_GALLERY_MAX_ITEMS = SITE_MEDIA_MAX_ITEMS;
export const MAX_GALLERY_CAPTION = MAX_MEDIA_CAPTION;

export interface SelfDriveGalleryItem extends SiteMediaItem {}

export function parseSelfDriveGalleryItems(content: string | null): SelfDriveGalleryItem[] {
  return parseSiteMediaItems(content);
}

/** Read the gallery media. Memoized per request. */
export const getSelfDriveGallery = cache(async (): Promise<SelfDriveGalleryItem[]> => {
  return getSiteMedia('self_drive_gallery');
});

/** Serialise gallery items for storage (validated server-side first). */
export function serializeSelfDriveGalleryItems(items: SelfDriveGalleryItem[]): string {
  return serializeSiteMediaItems(items);
}

export { displayImageUrl, videoPosterUrl } from '@/lib/site-media';
