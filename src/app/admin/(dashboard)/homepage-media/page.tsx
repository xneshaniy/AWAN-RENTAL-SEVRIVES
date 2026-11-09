import type { Metadata } from 'next';
import Link from 'next/link';
import { Images, ExternalLink } from 'lucide-react';
import { requireStaffAccess } from '@/lib/admin-auth';
import { isCloudinaryConfigured } from '@/lib/cloudinary';
import { getSiteMedia } from '@/lib/site-media';
import { SiteMediaManager } from '@/components/admin/SiteMediaManager';

export const metadata: Metadata = {
  title: 'Homepage Showcase',
  robots: { index: false, follow: false },
};

/**
 * Media manager for the homepage showcase section.
 *
 * Items uploaded here render in the auto-playing showcase section on the
 * public homepage - below the hero, above the trust section.
 */
export default async function AdminHomepageMediaPage() {
  await requireStaffAccess();
  const items = await getSiteMedia('homepage_showcase');

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-gray-900 dark:text-white">
            Homepage Showcase
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Photos and video clips that auto-play in the showcase section on the public homepage,
            right below the main hero. These are the visuals visitors see first.
          </p>
        </div>
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 hover:text-primary-600 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          View homepage
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-800 dark:border-primary-800 dark:bg-primary-900/20 dark:text-primary-200">
        <Images className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <p>
          Upload your own car photos and clips here. They automatically appear in the homepage
          showcase — images fade in and out, videos auto-play inside the slide. Captions are
          optional.
        </p>
      </div>

      <SiteMediaManager
        namespace="homepage_showcase"
        destinationLabel="homepage showcase"
        items={items}
        uploadConfigured={isCloudinaryConfigured()}
      />
    </div>
  );
}
