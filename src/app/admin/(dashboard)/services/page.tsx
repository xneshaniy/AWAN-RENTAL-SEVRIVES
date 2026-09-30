import type { Metadata } from 'next';
import { getServices } from '@/actions/settings';
import { toServiceDTO, sortServices } from '@/lib/services';
import { ServiceManager } from '@/components/admin/ServiceManager';

export const metadata: Metadata = {
  title: 'Services',
  robots: { index: false, follow: false },
};

/**
 * Service content management. Services are stored in PostgreSQL (SiteContent
 * rows keyed `service_<slug>`) and the public service pages read them live.
 */
export default async function AdminServicesPage() {
  // Raw rows -> DTOs; includes inactive services so they can be re-activated.
  const services = sortServices((await getServices()).map((row) => toServiceDTO(row)));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-gray-900 dark:text-white">
          Service Management
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Create and edit the services shown on the public site. Deactivated services disappear
          from public listings without being deleted.
        </p>
      </div>

      <ServiceManager initialServices={services} />
    </div>
  );
}
