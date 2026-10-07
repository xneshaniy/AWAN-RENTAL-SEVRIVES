import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { requireStaffAccess } from '@/lib/admin-auth';
import { Badge } from '@/components/ui/Badge';
import { Camera, Film, Car, ExternalLink, FolderOpen } from 'lucide-react';
import { GALLERY_CATEGORIES, GALLERY_CATEGORY_LABELS, type GalleryCategory } from '@/types';

export const metadata: Metadata = {
  title: 'Gallery',
  robots: { index: false, follow: false },
};

/** Same trust rule the public gallery uses: unknown values fall back. */
function readCategory(value: string | undefined): GalleryCategory {
  return value && (GALLERY_CATEGORIES as readonly string[]).includes(value)
    ? (value as GalleryCategory)
    : 'EXTERIOR';
}

interface Photo {
  url: string;
  category: GalleryCategory;
  /** True when the entry came from `thumbnail` because `images` is empty. */
  fromThumbnail: boolean;
}

/**
 * Admin-side gallery overview.
 *
 * WHY THIS PAGE EXISTS
 *
 * Photos are not rows in their own table - they are the `Vehicle.images`
 * string array (plus `imageCategories` and `videos`), written only when the
 * vehicle form is saved. Before this screen existed there was no single place
 * in the admin panel where an uploaded photo could be seen, so an upload that
 * was not immediately visible on a vehicle's edit screen looked like it had
 * been dropped.
 *
 * This page reads the SAME columns and applies the SAME fallback rules as the
 * public `/gallery` page, so "what you see here" is exactly "what the public
 * sees" - including the thumbnail fallback for a vehicle whose `images` array
 * is empty.
 *
 * It is read-only by design: media is added or removed on the vehicle edit
 * screen, which owns the row. Editing here would mean two writers for one
 * field.
 */
export default async function AdminGalleryPage() {
  await requireStaffAccess();

  const vehicles = await prisma.vehicle.findMany({
    where: { archivedAt: null },
    select: {
      id: true,
      name: true,
      slug: true,
      category: true,
      images: true,
      imageCategories: true,
      videos: true,
      thumbnail: true,
    },
    orderBy: { name: 'asc' },
  });

  const withMedia = vehicles
    .map((vehicle) => {
      const photos: Photo[] = vehicle.images
        .map((url, index) => ({
          url,
          category: readCategory(vehicle.imageCategories[index]),
          fromThumbnail: false,
        }))
        .filter((photo) => Boolean(photo.url));

      // Mirror of the public gallery: a vehicle with only a thumbnail still
      // belongs in the gallery rather than silently vanishing.
      if (photos.length === 0 && vehicle.thumbnail) {
        photos.push({ url: vehicle.thumbnail, category: 'EXTERIOR', fromThumbnail: true });
      }

      return {
        id: vehicle.id,
        name: vehicle.name,
        slug: vehicle.slug,
        category: vehicle.category,
        photos,
        videos: vehicle.videos.filter(Boolean),
      };
    })
    .filter((vehicle) => vehicle.photos.length > 0 || vehicle.videos.length > 0);

  const totalPhotos = withMedia.reduce((sum, vehicle) => sum + vehicle.photos.length, 0);
  const totalVideos = withMedia.reduce((sum, vehicle) => sum + vehicle.videos.length, 0);
  const thumbnailOnly = withMedia.filter((vehicle) =>
    vehicle.photos.some((photo) => photo.fromThumbnail)
  ).length;

  const stats = [
    { label: 'Photos', value: totalPhotos, icon: Camera },
    { label: 'Videos', value: totalVideos, icon: Film },
    { label: 'Vehicles with media', value: withMedia.length, icon: Car },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-gray-900 dark:text-white">
            Gallery Media
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Every photo and clip across the live fleet, in one place. This is exactly what the
            public <Link href="/gallery" className="text-primary-600 hover:underline dark:text-primary-400">Gallery</Link>{' '}
            shows - uploads appear here as soon as the vehicle is saved.
          </p>
        </div>
        <Link
          href="/admin/vehicles"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
        >
          Manage vehicles
          <ExternalLink className="h-4 w-4" aria-hidden={true} />
        </Link>
      </div>

      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800"
          >
            <dt className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <stat.icon className="h-4 w-4" aria-hidden={true} />
              {stat.label}
            </dt>
            <dd className="mt-2 font-heading text-3xl font-bold text-gray-900 dark:text-white">
              {stat.value}
            </dd>
          </div>
        ))}
      </dl>

      {withMedia.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 px-6 py-16 text-center dark:border-gray-700">
          <FolderOpen className="mx-auto h-8 w-8 text-gray-400" aria-hidden={true} />
          <p className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            No photos or videos yet
          </p>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Open a vehicle and use <strong>Upload Photo</strong> or <strong>Upload Video</strong>,
            then save the vehicle. The media shows up here immediately.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 2xl:grid-cols-3">
          {withMedia.map((vehicle) => (
            <section
              key={vehicle.id}
              aria-label={`Media for ${vehicle.name}`}
              className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
            >
              <header className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3 dark:border-gray-700">
                <div className="min-w-0">
                  <h2 className="truncate font-heading font-semibold text-gray-900 dark:text-white">
                    {vehicle.name}
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {vehicle.photos.length} photo{vehicle.photos.length === 1 ? '' : 's'}
                    {' · '}
                    {vehicle.videos.length} video{vehicle.videos.length === 1 ? '' : 's'}
                  </p>
                </div>
                <Link
                  href={`/admin/vehicles/${vehicle.id}/edit`}
                  className="flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                >
                  Edit
                </Link>
              </header>

              <div className="p-4">
                {vehicle.photos.length > 0 && (
                  <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {vehicle.photos.map((photo, index) => (
                      <li key={`${vehicle.id}-photo-${index}`} className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photo.url}
                          alt={`${vehicle.name} - ${GALLERY_CATEGORY_LABELS[photo.category]} photo ${index + 1}`}
                          loading="lazy"
                          className="aspect-square w-full rounded-lg border border-gray-100 object-cover dark:border-gray-700"
                        />
                        <span className="sr-only">{GALLERY_CATEGORY_LABELS[photo.category]}</span>
                        <span className="absolute left-1 top-1 rounded bg-black/60 px-1 py-0.5 text-[10px] font-medium text-white">
                          {GALLERY_CATEGORY_LABELS[photo.category]}
                        </span>
                        {photo.fromThumbnail && (
                          <span className="absolute right-1 top-1 rounded bg-amber-600/90 px-1 py-0.5 text-[10px] font-medium text-white">
                            thumb
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}

                {vehicle.photos.length === 0 && vehicle.videos.length > 0 && (
                  <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                    This vehicle has clips but no photos yet.
                  </p>
                )}

                {vehicle.videos.length > 0 && (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {vehicle.videos.map((url, index) => (
                      <li key={`${vehicle.id}-video-${index}`}>
                        <Badge variant="default">
                          <Film className="mr-1 h-3 w-3" aria-hidden={true} />
                          Clip {index + 1}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          ))}
        </div>
      )}

      {thumbnailOnly > 0 && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {thumbnailOnly} vehicle{thumbnailOnly === 1 ? ' has' : 's have'} only a thumbnail and no
          uploaded photos - marked <span className="font-medium text-amber-600">thumb</span> above.
        </p>
      )}
    </div>
  );
}
