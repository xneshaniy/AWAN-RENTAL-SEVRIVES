import { SITE_URL } from '@/config/site';

export interface BreadcrumbItem {
  name: string;
  /** Site path for this level; omit on the current (last) page. */
  path?: string;
}

/**
 * BreadcrumbList JSON-LD for one page. Rendered server-side as a plain
 * script tag; names/paths come from the page itself, never from invented
 * data.
 *
 *   <BreadcrumbJsonLd items={[{ name: 'Home', path: '/' }, { name: 'Vehicles', path: '/vehicles' }, { name: vehicle.name }]} />
 */
export function BreadcrumbJsonLd({ items }: { items: BreadcrumbItem[] }) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      ...(item.path ? { item: `${SITE_URL}${item.path}` } : {}),
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
