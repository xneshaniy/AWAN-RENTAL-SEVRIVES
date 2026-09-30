import { Metadata } from 'next';
import { getVehicles, getVehicleFacets } from '@/actions/vehicle';
import { VehicleList } from './_components/VehicleList';
import { Layout } from '@/components/layout/Layout';
import { WhatsAppFloat } from '@/components/common/WhatsAppFloat';
import { getBusinessInfo } from '@/lib/settings';
import {
  VEHICLE_CATEGORIES,
  type VehicleCategory,
  type VehicleAvailabilityFilter,
  type VehicleSortOption,
} from '@/types';

export const metadata: Metadata = {
  title: 'Our Vehicles',
  description:
    'Explore our range of rental vehicles including economy cars, sedans, SUVs, luxury vehicles, vans, and coasters. Search and filter by category, availability and price. Available for self-drive or chauffeur service across Pakistan.',
  alternates: { canonical: '/vehicles' },
};

interface SearchParams {
  [key: string]: string | string[] | undefined;
}

const SORT_OPTIONS: Record<VehicleSortOption, { sortBy: string; sortOrder: 'asc' | 'desc' }> = {
  newest: { sortBy: 'createdAt', sortOrder: 'desc' },
  'price-asc': { sortBy: 'dailyRate', sortOrder: 'asc' },
  'price-desc': { sortBy: 'dailyRate', sortOrder: 'desc' },
  name: { sortBy: 'name', sortOrder: 'asc' },
};

const VALID_SORTS = Object.keys(SORT_OPTIONS) as VehicleSortOption[];
const PAGE_SIZE = 12;

function first(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

export default async function VehiclesPage({ searchParams }: { searchParams: SearchParams }) {
  const q = first(searchParams.q).slice(0, 100);

  const categoryParam = first(searchParams.category);
  const category = VEHICLE_CATEGORIES.some((entry) => entry.value === categoryParam)
    ? categoryParam
    : '';

  const availabilityParam = first(searchParams.availability);
  const availability: VehicleAvailabilityFilter =
    availabilityParam === 'available' || availabilityParam === 'unavailable'
      ? availabilityParam
      : 'all';

  const featured = first(searchParams.featured) === 'true';

  const sortParam = first(searchParams.sort) as VehicleSortOption;
  const sort: VehicleSortOption = VALID_SORTS.includes(sortParam) ? sortParam : 'newest';

  const page = Math.max(1, parseInt(first(searchParams.page), 10) || 1);

  const filters = { q, category, availability, featured, sort, page };
  const { sortBy, sortOrder } = SORT_OPTIONS[sort];

  const [businessInfo, vehiclesData, facets] = await Promise.all([
    getBusinessInfo(),
    getVehicles({
      search: q || undefined,
      category: category ? (category as VehicleCategory) : undefined,
      isAvailable:
        availability === 'available' ? true : availability === 'unavailable' ? false : undefined,
      isFeatured: featured ? true : undefined,
      sortBy,
      sortOrder,
      page,
      limit: PAGE_SIZE,
    }),
    getVehicleFacets(),
  ]);

  return (
    <Layout businessInfo={businessInfo}>
      <section className="py-16 sm:py-24 bg-gray-50 dark:bg-gray-900/50" aria-labelledby="vehicles-title">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h1
              id="vehicles-title"
              className="font-heading font-bold text-3xl sm:text-4xl lg:text-5xl text-gray-900 dark:text-white mb-4"
            >
              Explore Our Vehicles
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Choose the vehicle that fits your journey. Search the fleet, filter by category and
              availability, and book online - every vehicle is available for self-drive or chauffeur
              service.
            </p>
          </div>
          <VehicleList
            vehicles={vehiclesData.data}
            pagination={vehiclesData.pagination}
            facets={facets}
            filters={filters}
          />
        </div>
      </section>
      <WhatsAppFloat />
    </Layout>
  );
}
