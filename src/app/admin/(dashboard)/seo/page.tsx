import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAllSettings } from '@/actions/settings';
import { SettingsForm } from '@/components/admin/SettingsForm';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'SEO Settings',
  robots: { index: false, follow: false },
};

/**
 * SEO defaults: site title, meta description and Open Graph image. Admin
 * accounts only - STAFF is redirected to the unauthorized page.
 */
export default async function AdminSeoPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/admin/login');
  if (session.user.role !== 'ADMIN') redirect('/admin/unauthorized');

  const settings = await getAllSettings();
  const items = settings.map((setting) => ({
    key: setting.key,
    value: setting.value,
    label: setting.label,
    type: setting.type,
    description: setting.description,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3">
        <Link
          href="/admin"
          className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Dashboard
        </Link>
        <div>
          <h1 className="font-heading text-3xl font-bold text-gray-900 dark:text-white">
            SEO Settings
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Site-wide defaults for search results and social sharing. Individual pages define
            their own titles, descriptions and canonical URLs; these values are the fallback for
            anything that does not override them. The same fields are also editable under Site
            Settings.
          </p>
        </div>
      </div>

      <SettingsForm settings={items} sections={['seo']} />
    </div>
  );
}
