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
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:shadow-xl hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      {service.image && (
        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
          <Image
            src={service.image}
            alt={`${service.name} services in Pakistan`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      )}

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
          <Icon
            className="h-6 w-6 text-primary transition-colors group-hover:text-accent-foreground"
            aria-hidden="true"
          />
        </div>

        <h3 className="font-heading text-xl font-semibold text-foreground mb-2">
          {service.name}
        </h3>

        <p className="text-sm leading-relaxed text-muted-foreground mb-5 line-clamp-3">
          {service.description}
        </p>

        <span className="mt-auto inline-flex items-center text-sm font-medium text-primary">
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
