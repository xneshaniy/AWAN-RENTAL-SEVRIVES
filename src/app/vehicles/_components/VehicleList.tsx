'use client';

import { FormEvent, useEffect, useState, useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Filter, Loader2, Search, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { VehicleCard } from '@/components/vehicles/VehicleCard';
import { getVehicleCategoryLabel } from '@/lib/utils';
import type {
  VehicleDTO,
  VehicleFacets,
  VehicleListingFilters,
} from '@/types';

interface VehicleListProps {
  vehicles: VehicleDTO[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  facets: VehicleFacets;
  filters: VehicleListingFilters;
}

const SORT_LABELS: Array<{ value: string; label: string }> = [
  { value: 'newest', label: 'Newest first' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'name', label: 'Name: A-Z' },
];

export function VehicleList({ vehicles, pagination, facets, filters }: VehicleListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState(filters.q);

  // Keep the search box in sync when the URL changes (back/forward, clear filters).
  useEffect(() => {
    setQuery(filters.q);
  }, [filters.q]);

  const navigate = (patch: Partial<VehicleListingFilters> & { page?: number }) => {
    const next: VehicleListingFilters = { ...filters, ...patch };

    const params = new URLSearchParams();
    if (next.q) params.set('q', next.q);
    if (next.category) params.set('category', next.category);
    if (next.availability !== 'all') params.set('availability', next.availability);
    if (next.featured) params.set('featured', 'true');
    if (next.sort !== 'newest') params.set('sort', next.sort);

    const targetPage = patch.page ?? 1;
    if (targetPage > 1) params.set('page', String(targetPage));

    const queryString = params.toString();
    startTransition(() => {
      router.push(queryString ? `${pathname}?${queryString}` : pathname);
    });
  };

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    navigate({ q: query.trim() });
  };

  const clearFilters = () => {
    setQuery('');
    navigate({ q: '', category: '', availability: 'all', featured: false, sort: 'newest' });
  };

  const hasActiveFilters =
    Boolean(filters.q) ||
    Boolean(filters.category) ||
    filters.availability !== 'all' ||
    filters.featured ||
    filters.sort !== 'newest';

  const categoryOptions = [
    { value: '', label: `All categories (${facets.totalCount})` },
    ...facets.categories.map((entry) => ({
      value: entry.category,
      label: `${getVehicleCategoryLabel(entry.category)} (${entry.count})`,
    })),
  ];

  const availabilityOptions = [
    { value: 'all', label: `All vehicles (${facets.totalCount})` },
    { value: 'available', label: `Available (${facets.availableCount})` },
    { value: 'unavailable', label: `Unavailable (${facets.unavailableCount})` },
  ];

  return (
    <div className="space-y-8">
      {/* Search + filters */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 space-y-4">
        <form onSubmit={handleSearchSubmit} role="search" className="flex flex-col sm:flex-row gap-3">
          <Input
            type="search"
            name="q"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, brand or model..."
            aria-label="Search vehicles"
            className="sm:flex-1"
            icon={<Search className="w-4 h-4" aria-hidden="true" />}
          />
          <Button type="submit" variant="primary" className="sm:w-auto">
            <Search className="w-4 h-4 sm:mr-2" aria-hidden="true" />
            <span className="hidden sm:inline">Search</span>
          </Button>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Select
            value={filters.category}
            onChange={(event) => navigate({ category: event.target.value })}
            options={categoryOptions}
            label="Category"
            aria-label="Filter by category"
          />
          <Select
            value={filters.availability}
            onChange={(event) =>
              navigate({ availability: event.target.value as VehicleListingFilters['availability'] })
            }
            options={availabilityOptions}
            label="Availability"
            aria-label="Filter by availability"
          />
          <Select
            value={filters.sort}
            onChange={(event) =>
              navigate({ sort: event.target.value as VehicleListingFilters['sort'] })
            }
            options={SORT_LABELS}
            label="Sort by"
            aria-label="Sort vehicles"
          />
          <div className="flex items-end">
            <Button
              type="button"
              variant={filters.featured ? 'primary' : 'outline'}
              size="md"
              fullWidth
              aria-pressed={filters.featured}
              onClick={() => navigate({ featured: !filters.featured })}
            >
              <Sparkles className="w-4 h-4 mr-2" aria-hidden="true" />
              Featured only ({facets.featuredCount})
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing{' '}
            <span className="font-semibold text-gray-900 dark:text-white">{vehicles.length}</span>{' '}
            of <span className="font-semibold text-gray-900 dark:text-white">{pagination.total}</span>{' '}
            {pagination.total === 1 ? 'vehicle' : 'vehicles'}
            {facets.featuredCount > 0 && (
              <span className="hidden sm:inline"> · {facets.featuredCount} featured</span>
            )}
          </p>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <X className="w-4 h-4 mr-1" aria-hidden="true" />
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="relative" aria-busy={isPending}>
        {isPending && (
          <div
            className="absolute inset-0 z-10 grid place-items-center bg-gray-50/70 dark:bg-gray-900/70 rounded-2xl"
            role="status"
            aria-label="Loading vehicles"
          >
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" aria-hidden="true" />
          </div>
        )}

        {vehicles.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Filter className="w-10 h-10 text-gray-400" aria-hidden="true" />
            </div>
            <h2 className="font-heading font-semibold text-xl text-gray-900 dark:text-white mb-2">
              No vehicles found
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              {hasActiveFilters
                ? 'No vehicles match your current search and filters. Try adjusting them, or browse the full fleet.'
                : 'No vehicles have been added yet. Please check back soon.'}
            </p>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters}>
                <X className="w-4 h-4 mr-2" aria-hidden="true" />
                Clear all filters
              </Button>
            )}
          </div>
        ) : (
          <div
            className={cn(
              'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 transition-opacity',
              isPending && 'opacity-50'
            )}
          >
            {vehicles.map((vehicle) => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <nav className="flex items-center justify-center gap-3" aria-label="Pagination">
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page <= 1 || isPending}
            onClick={() => navigate({ page: pagination.page - 1 })}
          >
            Previous
          </Button>
          <span className="text-gray-600 dark:text-gray-400 text-sm" aria-live="polite">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page >= pagination.totalPages || isPending}
            onClick={() => navigate({ page: pagination.page + 1 })}
          >
            Next
          </Button>
        </nav>
      )}
    </div>
  );
}
