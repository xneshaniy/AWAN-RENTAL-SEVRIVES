import { Metadata } from 'next';
import { Layout } from '@/components/layout/Layout';
import { WhatsAppFloat } from '@/components/common/WhatsAppFloat';
import { getBusinessInfo } from '@/lib/settings';
import { prisma } from '@/lib/prisma';
import { GALLERY_CATEGORIES, type GalleryCategory } from '@/types';
import { GalleryGrid, type GalleryVehicle } from './_components/GalleryGrid';

export const metadata: Metadata = {
  title: 'Gallery',
  description:
    'Browse photos and video clips of our rental fleet in Islamabad - exteriors, interiors, dashboards and luggage space, for every vehicle we rent.',
  alternates: { canonical: '/gallery' },
};

/** A stored category is only trusted when it is one the gallery knows. */
function readCategory(value: string | undefined): GalleryCategory {
  return value && (GALLERY_CATEGORIES as readonly string[]).includes(value)
    ? (value as GalleryCategory)
    : 'EXTERIOR';
}

/**
 * Site-wide gallery: every photo and clip across the live fleet, on one page.
 *
 * Archived vehicles are excluded (same rule as every public vehicle query).
 * `imageCategories` is index-aligned with `images`, so the lookup happens
 * against the original index *before* blanks are dropped - filtering first
 * would silently mis-file every photo after a gap.
 */
export default async function GalleryPage() {
  const businessInfo = await getBusinessInfo();

  const vehicles = await prisma.vehicle.findMany({
    where: { archivedAt: null },
    select: {
      id: true,
      name: true,
      slug: true,
      images: true,
      imageCategories: true,
      videos: true,
      thumbnail: true,
    },
    orderBy: { name: 'asc' },
  });

  const galleryVehicles: GalleryVehicle[] = vehicles
    .map((vehicle) => {
      const photos = vehicle.images
        .map((url, index) => ({
          url,
          category: readCategory(vehicle.imageCategories[index]),
        }))
        .filter((photo) => Boolean(photo.url));

      // A vehicle with only a thumbnail still belongs in the gallery rather
      // than silently vanishing; the thumbnail is otherwise a copy of images[0]
      // and must not be added on top of real photos.
      if (photos.length === 0 && vehicle.thumbnail) {
        photos.push({ url: vehicle.thumbnail, category: 'EXTERIOR' });
      }

      return {
        id: vehicle.id,
        name: vehicle.name,
        slug: vehicle.slug,
        photos,
        videos: vehicle.videos.filter(Boolean),
      } satisfies GalleryVehicle;
    })
    .filter((vehicle) => vehicle.photos.length > 0 || vehicle.videos.length > 0);

  return (
    <Layout businessInfo={businessInfo}>
      <section className="py-16 sm:py-24 bg-gray-50 dark:bg-gray-900/50" aria-labelledby="gallery-title">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h1
              id="gallery-title"
              className="font-heading font-bold text-3xl sm:text-4xl lg:text-5xl text-gray-900 dark:text-white mb-4"
            >
              Gallery
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Photos and video clips of our fleet, straight from the vehicles we rent out.
              Open any picture or clip full screen.
            </p>
          </div>

          {galleryVehicles.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 px-6 py-16 text-center dark:border-gray-700">
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                No photos or videos yet
              </p>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Add pictures or clips to a vehicle in the admin area and they will appear here.
              </p>
            </div>
          ) : (
            <GalleryGrid vehicles={galleryVehicles} />
          )}
        </div>
      </section>
      <WhatsAppFloat />
    </Layout>
  );
}
