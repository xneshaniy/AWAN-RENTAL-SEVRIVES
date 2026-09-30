import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAllSettings } from '@/actions/settings';
import { SettingsForm } from '@/components/admin/SettingsForm';
import { ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Site Settings',
  robots: { index: false, follow: false },
};

/**
 * Site Settings (Business / Social / Booking / WhatsApp / SEO). Writing goes
 * through the ADMIN-only `updateSettings` action; STAFF accounts are sent to
 * the unauthorized page before any value is shown.
 */
export default async function AdminSettingsPage() {
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
      <div>
        <h1 className="font-heading text-3xl font-bold text-gray-900 dark:text-white">
          Site Settings
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          These values power the public contact page, footer, WhatsApp links, booking rules and
          default search metadata. Leave a field empty (with its placeholder showing) when the
          real value is not known - the public site then hides that information instead of
          inventing it.
        </p>
        <p className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
          Admin accounts only. Changes are saved to PostgreSQL immediately.
        </p>
      </div>

      <SettingsForm settings={items} />
    </div>
  );
}
