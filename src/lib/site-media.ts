import * as React from 'react';
import { prisma } from '@/lib/prisma';

/**
 * Generic admin-managed media gallery stored in SiteContent.
 *
 * Namespace keys pick which gallery a row belongs to:
 *   'self_drive_gallery'  - the public /self-drive page gallery
 *   'homepage_showcase'   - the auto-playing homepage showcase section
 *
 * No schema change is required and reads happen server-side with React
 * `cache` so a page reuses one query per request.
 */

export interface SiteMediaItem {
  id: string;
  url: string;
  publicId?: string | null;
  type: 'image' | 'video';
  caption?: string;
  width?: number;
  height?: number;
  createdAt: number;
}

export type SiteMediaNamespace = 'self_drive_gallery' | 'homepage_showcase';

export const SITE_MEDIA_NAMESPACES: readonly SiteMediaNamespace[] = [
  'self_drive_gallery',
  'homepage_showcase',
] as const;

export const SITE_MEDIA_MAX_ITEMS = 30;
export const MAX_MEDIA_CAPTION = 140;

const reactCache = (React as unknown as { cache?: <T>(fn: T) => T }).cache;
const cache: <T>(fn: T) => T = reactCache ?? ((fn) => fn);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normaliseItem(raw: unknown): SiteMediaItem | null {
  if (!isRecord(raw)) return null;
  const url = typeof raw.url === 'string' && raw.url.length > 0 ? raw.url : null;
  const type = raw.type === 'video' ? 'video' : raw.type === 'image' ? 'image' : null;
  const id = typeof raw.id === 'string' && raw.id.length > 0 ? raw.id : null;
  if (!url || !type || !id) return null;
  return {
    id,
    url,
    publicId: typeof raw.publicId === 'string' && raw.publicId.length > 0 ? raw.publicId : null,
    type,
    caption: typeof raw.caption === 'string' && raw.caption.length > 0 ? raw.caption.slice(0, MAX_MEDIA_CAPTION) : undefined,
    width: typeof raw.width === 'number' && Number.isFinite(raw.width) ? raw.width : undefined,
    height: typeof raw.height === 'number' && Number.isFinite(raw.height) ? raw.height : undefined,
    createdAt: typeof raw.createdAt === 'number' ? raw.createdAt : Date.now(),
  };
}

export function parseSiteMediaItems(content: string | null): SiteMediaItem[] {
  if (!content) return [];
  try {
    const parsed = JSON.parse(content) as unknown;
    const items = Array.isArray(parsed)
      ? parsed
      : isRecord(parsed) && Array.isArray(parsed.items)
        ? parsed.items
        : [];
    return items.map(normaliseItem).filter((item): item is SiteMediaItem => Boolean(item));
  } catch {
    return [];
  }
}

/** Read a media gallery. Memoized per request. */
export const getSiteMedia = cache(async (namespace: SiteMediaNamespace): Promise<SiteMediaItem[]> => {
  const row = await prisma.siteContent.findUnique({ where: { key: namespace } });
  return parseSiteMediaItems(row?.content ?? null);
});

/** Serialise media items for storage. */
export function serializeSiteMediaItems(items: SiteMediaItem[]): string {
  return JSON.stringify(items);
}

/** Write a media gallery row. */
export async function writeSiteMedia(
  namespace: SiteMediaNamespace,
  title: string,
  items: SiteMediaItem[]
): Promise<void> {
  await prisma.siteContent.upsert({
    where: { key: namespace },
    update: { title, content: serializeSiteMediaItems(items) },
    create: { key: namespace, title, content: serializeSiteMediaItems(items) },
  });
}

/** Cloudinary-optimised display URL for an image (f_auto + q_auto + width cap). */
export function displayImageUrl(url: string, width: number): string {
  try {
    if (!url.includes('/image/upload/') || !url.includes('res.cloudinary.com')) return url;
    return url.replace('/image/upload/', `/image/upload/f_auto,q_auto,w_${width}/`);
  } catch {
    return url;
  }
}

/** Cloudinary poster thumbnail for a video (so_auto picks a representative frame). */
export function videoPosterUrl(url: string, width = 800): string | null {
  try {
    if (!url.includes('/video/upload/') || !url.includes('res.cloudinary.com')) return null;
    return url
      .replace('/video/upload/', `/video/upload/so_auto,f_jpg,q_auto,w_${width}/`)
      .replace(/\.(mp4|webm|mov|m4v|avi|mkv)$/i, '.jpg');
  } catch {
    return null;
  }
}
