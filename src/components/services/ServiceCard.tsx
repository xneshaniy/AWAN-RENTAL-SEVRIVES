import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getServiceIcon } from '@/lib/services';
import type { ServiceDTO } from '@/types';

interface ServiceCardProps {
  service: ServiceDTO;
}

/**
 * Service card used across the site. Reads only from a ServiceDTO, so all
 * content (name, description, image, icon, link) comes from the database.
 * The whole card is a single link — no nested interactive elements.
 */
export function ServiceCard({ service }: ServiceCardProps) {
  const Icon = getServiceIcon(service.icon);

  return (
    <Link
      href={service.href}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
    >
      {service.image && (
        <div className="relative aspect-[16/10] overflow-hidden bg-gray-100 dark:bg-gray-700">
          <Image
            src={service.image}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      )}

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/30 transition-colors group-hover:bg-primary-600 group-hover:dark:bg-primary-600">
          <Icon
            className="h-6 w-6 text-primary-600 dark:text-primary-400 transition-colors group-hover:text-white group-hover:dark:text-white"
            aria-hidden="true"
          />
        </div>

        <h3 className="font-heading text-xl font-semibold text-gray-900 dark:text-white mb-2">
          {service.name}
        </h3>

        <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400 mb-5 line-clamp-3">
          {service.description}
        </p>

        <span className="mt-auto inline-flex items-center text-sm font-medium text-primary-600 dark:text-primary-400">
          Learn More
          <ArrowRight
            className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1"
            aria-hidden="true"
          />
        </span>
      </div>
    </Link>
  );
}
