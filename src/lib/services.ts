import type { ComponentType } from 'react';
import {
  Building2,
  Calendar,
  Car,
  MapPin,
  Plane,
  Truck,
  User,
  Users,
} from 'lucide-react';
import type { ServiceDTO, ServiceFeature } from '@/types';

/** Icon keys that can be stored in a Service record's `icon` field. */
export const SERVICE_ICON_KEYS = [
  'car',
  'user',
  'plane',
  'building',
  'map-pin',
  'users',
  'calendar',
  'truck',
] as const;

export type ServiceIconKey = (typeof SERVICE_ICON_KEYS)[number];

const SERVICE_ICONS: Record<ServiceIconKey, ComponentType<{ className?: string }>> = {
  car: Car,
  user: User,
  plane: Plane,
  building: Building2,
  'map-pin': MapPin,
  users: Users,
  calendar: Calendar,
  truck: Truck,
};

/** Resolve a stored icon key, falling back to a generic car icon. */
export function getServiceIcon(icon?: string | null): ComponentType<{ className?: string }> {
  if (icon && Object.prototype.hasOwnProperty.call(SERVICE_ICONS, icon)) {
    return SERVICE_ICONS[icon as ServiceIconKey];
  }
  return Car;
}

function parseFeatures(value: unknown): ServiceFeature[] {
  if (!Array.isArray(value)) return [];
  const features: ServiceFeature[] = [];
  for (const item of value) {
    if (item && typeof item === 'object') {
      const candidate = item as { title?: unknown; description?: unknown };
      if (typeof candidate.title === 'string' && typeof candidate.description === 'string') {
        features.push({ title: candidate.title, description: candidate.description });
      }
    }
  }
  return features;
}

interface RawServiceRecord {
  slug: string;
  title: string;
  content: unknown;
}

/**
 * Map a SiteContent row (key `service_<slug>`) to a ServiceDTO.
 * Missing or malformed fields fall back to safe defaults so a partially
 * edited record still renders instead of crashing the page.
 */
export function toServiceDTO(record: RawServiceRecord): ServiceDTO {
  const content: Record<string, unknown> =
    record.content && typeof record.content === 'object'
      ? (record.content as Record<string, unknown>)
      : {};

  const href = typeof content.href === 'string' && content.href.startsWith('/')
    ? content.href
    : `/${record.slug}`;

  return {
    slug: record.slug,
    name: record.title,
    description: typeof content.description === 'string' ? content.description : '',
    image: typeof content.image === 'string' && content.image.length > 0 ? content.image : null,
    icon: typeof content.icon === 'string' && content.icon.length > 0 ? content.icon : 'car',
    href,
    active: content.active !== false,
    order: typeof content.order === 'number' ? content.order : 0,
    features: parseFeatures(content.features),
  };
}

/** Sort services by their stored order, then by name for a stable order. */
export function sortServices(services: ServiceDTO[]): ServiceDTO[] {
  return [...services].sort(
    (a, b) => a.order - b.order || a.name.localeCompare(b.name)
  );
}
