import { Suspense } from 'react';
import { Metadata } from 'next';
import { getVehicles, getVehicleFacets } from '@/actions/vehicle';
import { VehicleList } from './_components/VehicleList';
import { VehiclesListSkeleton } from './_components/VehiclesListSkeleton';
import { Layout } from '@/components/layout/Layout';
import { WhatsAppFloat } from '@/components/common/WhatsAppFloat';
import { getBusinessInfo } from '@/lib/settings';
import {
  VEHICLE_CATEGORIES,
  type VehicleCategory,
  type VehicleAvailabilityFilter,
  type VehicleSortOption,
} from '@/types';
import { Car } from 'lucide-react';

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

export const dynamic = 'force-dynamic';

/**
 * The list page owns its own Suspense boundary instead of using a route-level
 * `loading.tsx`. See `_components/VehiclesListSkeleton.tsx` for why: a segment
 * loading boundary would also wrap `/vehicles/[slug]` and turn a missing
 * vehicle into a soft-404 (HTTP 200) instead of a real 404.
 */
export default async function VehiclesPage({ searchParams }: { searchParams: SearchParams }) {
  const businessInfo = await getBusinessInfo();

  return (
    <Layout businessInfo={businessInfo}>
      <Suspense fallback={<VehiclesListSkeleton />}>
        <VehiclesResults searchParams={searchParams} />
      </Suspense>
      <WhatsAppFloat />
    </Layout>
  );
}

async function VehiclesResults({ searchParams }: { searchParams: SearchParams }) {
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

  // Vehicles are the core content of this page, but if the query fails we
  // still render the page with an empty list so a database hiccup never
  // produces a 500 error.
  let vehiclesData: Awaited<ReturnType<typeof getVehicles>>;
  try {
    vehiclesData = await getVehicles({
      search: q || undefined,
      category: category ? (category as VehicleCategory) : undefined,
      isAvailable:
        availability === 'available' ? true : availability === 'unavailable' ? false : undefined,
      isFeatured: featured ? true : undefined,
      sortBy,
      sortOrder,
      page,
      limit: PAGE_SIZE,
    });
  } catch {
    vehiclesData = { data: [], pagination: { page, limit: PAGE_SIZE, total: 0, totalPages: 0 } };
  }

  // Facets are non-critical: if they fail, render with empty facets so the
  // page still loads with vehicle listings instead of a 500 error.
  let facets: Awaited<ReturnType<typeof getVehicleFacets>>;
  try {
    facets = await getVehicleFacets();
  } catch {
    facets = {
      categories: [],
      totalCount: 0,
      availableCount: 0,
      unavailableCount: 0,
      featuredCount: 0,
    };
  }

  return (
    <>
      <div
        className="relative py-16 sm:py-24 overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-primary-950 text-white"
        aria-labelledby="vehicles-title"
      >
        <div
          className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-accent/10 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute bottom-0 -left-24 h-96 w-96 rounded-full bg-primary-600/20 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white/90 text-xs sm:text-sm font-medium mb-6 border border-white/10">
            <Car className="w-4 h-4" aria-hidden="true" />
            Nationwide Coverage
          </span>
          <h1
            id="vehicles-title"
            className="font-heading font-bold text-4xl sm:text-5xl lg:text-6xl text-white mb-6 leading-tight"
          >
            Choose Your Ride
          </h1>
          <p className="text-lg text-primary-100 max-w-2xl mx-auto leading-relaxed">
            Explore our fleet of well-maintained self-drive and chauffeur-driven vehicles.
            Search, filter and book online — or message us on WhatsApp for a quick quote.
          </p>
        </div>
      </div>

      <section className="py-12 sm:py-16 bg-secondary-50 dark:bg-secondary-900/30" aria-label="Vehicle results and filters">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <VehicleList
            vehicles={vehiclesData.data}
            pagination={vehiclesData.pagination}
            facets={facets}
            filters={filters}
          />
        </div>
      </section>
    </>
  );
}
