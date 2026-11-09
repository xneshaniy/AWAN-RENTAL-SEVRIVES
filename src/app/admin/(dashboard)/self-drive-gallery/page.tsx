import type { Metadata } from 'next';
import Link from 'next/link';
import { Images, ExternalLink } from 'lucide-react';
import { requireStaffAccess } from '@/lib/admin-auth';
import { isCloudinaryConfigured } from '@/lib/cloudinary';
import { getSelfDriveGallery } from '@/lib/self-drive-gallery';
import { SiteMediaManager } from '@/components/admin/SiteMediaManager';

export const metadata: Metadata = {
  title: 'Self Drive Gallery',
  robots: { index: false, follow: false },
};

/**
 * Media manager for the Self Drive Rentals page gallery.
 *
 * Public uploads render on /self-drive inside the "See the Self Drive
 * Experience" section. Upload, caption, reorder, replace and delete here.
 */
export default async function AdminSelfDriveGalleryPage() {
  await requireStaffAccess();
  const [items] = await Promise.all([getSelfDriveGallery()]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-gray-900 dark:text-white">
            Self Drive Gallery
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Media shown on the public{' '}
            <Link
              href="/self-drive"
              className="text-primary-600 hover:underline dark:text-primary-400"
            >
              Self Drive Rentals page
            </Link>{' '}
            — below the hero, in the &quot;See the Self Drive Experience&quot; section.
          </p>
        </div>
        <Link
          href="/self-drive"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 hover:text-primary-600 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          View page
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-800 dark:border-primary-800 dark:bg-primary-900/20 dark:text-primary-200">
        <Images className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <p>
          Upload real photos and clips from your device. Visitors see them below the hero on the
          Self Drive Rentals page with a play button on videos and a lightbox preview for photos.
        </p>
      </div>

      <SiteMediaManager
        namespace="self_drive_gallery"
        destinationLabel="Self Drive Rentals page"
        items={items}
        uploadConfigured={isCloudinaryConfigured()}
      />
    </div>
  );
}
