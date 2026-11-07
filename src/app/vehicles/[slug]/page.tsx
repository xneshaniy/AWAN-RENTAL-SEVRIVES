import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getVehicleBySlug, getSimilarVehicles } from '@/actions/vehicle';
import { VehicleDetail } from './_components/VehicleDetail';
import { Layout } from '@/components/layout/Layout';
import { BreadcrumbJsonLd } from '@/components/seo/BreadcrumbJsonLd';
import { getBusinessInfo } from '@/lib/settings';
import { hasConfiguredPrice } from '@/lib/vehicles';
import { getVehicleCategoryLabel } from '@/lib/utils';
import { SITE_URL, SITE_NAME } from '@/config/site';

export const dynamic = 'force-dynamic';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const vehicle = await getVehicleBySlug(params.slug);

  if (!vehicle) {
    return { title: 'Vehicle Not Found', robots: { index: false, follow: false } };
  }

  const description = vehicle.description.slice(0, 160);
  const image = vehicle.images[0] || vehicle.thumbnail || '/og-image.jpg';

  return {
    title: vehicle.name,
    description,
    alternates: { canonical: `/vehicles/${vehicle.slug}` },
    openGraph: {
      title: `${vehicle.name} | ${SITE_NAME}`,
      description,
      images: image,
      type: 'website',
      url: `/vehicles/${vehicle.slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${vehicle.name} | ${SITE_NAME}`,
      description,
      images: image,
    },
  };
}

export default async function VehicleDetailPage({ params }: Props) {
  let vehicle;
  try {
    vehicle = await getVehicleBySlug(params.slug);
  } catch {
    vehicle = null;
  }

  if (!vehicle) {
    notFound();
  }

  let businessInfo;
  let similarVehicles = [];
  try {
    [businessInfo, similarVehicles] = await Promise.all([
      getBusinessInfo(),
      getSimilarVehicles(vehicle.slug, vehicle.category, 4),
    ]);
  } catch {
    businessInfo = null;
  }

  // Vehicle structured data for search engines (offers only when a real
  // price is configured in the database).
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: vehicle.name,
    description: vehicle.description,
    sku: vehicle.slug,
    brand: { '@type': 'Brand', name: vehicle.brand },
    category: getVehicleCategoryLabel(vehicle.category),
    image: vehicle.images.length > 0 ? vehicle.images : ['/placeholder-vehicle.svg'],
    ...(hasConfiguredPrice(vehicle)
      ? {
          offers: {
            '@type': 'Offer',
            price: vehicle.dailyRate,
            priceCurrency: 'PKR',
            availability: vehicle.isAvailable
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
            url: `${SITE_URL}/vehicles/${vehicle.slug}`,
          },
        }
      : {}),
  };

  return (
    <Layout businessInfo={businessInfo}>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', path: '/' },
          { name: 'Vehicles', path: '/vehicles' },
          { name: vehicle.name },
        ]}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <VehicleDetail vehicle={vehicle} similarVehicles={similarVehicles} />
    </Layout>
  );
}
