'use client';

import { useEffect, useState, useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Filter, Loader2, Search, X, SlidersHorizontal } from 'lucide-react';
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

const SORT_LABELS: Array<{ value: string; label: string }> = [
  { value: 'newest', label: 'Newest first' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'name', label: 'Name: A-Z' },
];

interface VehicleListProps {
  vehicles: VehicleDTO[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  facets: VehicleFacets;
  filters: VehicleListingFilters;
}

export function VehicleList({ vehicles, pagination, facets, filters }: VehicleListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState(filters.q);
  const [showFilters, setShowFilters] = useState(typeof window !== 'undefined' && window.innerWidth < 1024);

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

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
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
      {/* Desktop: Sidebar filters + Results grid */}
      <div className="hidden lg:flex gap-8">
        <aside className="w-80 flex-shrink-0">
          <div className="sticky top-24">
            <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-heading font-bold text-xl text-foreground">Filters</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="text-primary hover:text-primary/90"
                >
                  <X className="w-4 h-4 mr-1" /> Clear All
                </Button>
              </div>

              <form onSubmit={handleSearchSubmit} role="search" className="mb-6">
                <Input
                  type="search"
                  name="q"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search by name, brand or model..."
                  aria-label="Search vehicles"
                  icon={<Search className="w-4 h-4" aria-hidden="true" />}
                />
                <Button type="submit" variant="primary" className="mt-3 fullWidth w-full">
                  <Search className="w-4 h-4 mr-2" aria-hidden="true" />
                  Search
                </Button>
              </form>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Category</label>
                  <Select
                    value={filters.category}
                    onChange={(event) => navigate({ category: event.target.value })}
                    options={categoryOptions}
                    label="Category"
                    aria-label="Filter by category"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Availability</label>
                  <Select
                    value={filters.availability}
                    onChange={(event) =>
                      navigate({ availability: event.target.value as VehicleListingFilters['availability'] })
                    }
                    options={availabilityOptions}
                    label="Availability"
                    aria-label="Filter by availability"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Sort by</label>
                  <Select
                    value={filters.sort}
                    onChange={(event) =>
                      navigate({ sort: event.target.value as VehicleListingFilters['sort'] })
                    }
                    options={SORT_LABELS}
                    label="Sort by"
                    aria-label="Sort vehicles"
                  />
                </div>
                <div>
                  <Button
                    type="button"
                    variant={filters.featured ? 'primary' : 'outline'}
                    size="md"
                    fullWidth
                    aria-pressed={filters.featured}
                    onClick={() => navigate({ featured: !filters.featured })}
                  >
                    <SlidersHorizontal className="w-4 h-4 mr-2" aria-hidden="true" />
                    Featured only ({facets.featuredCount})
                  </Button>
                </div>
              </div>

              {hasActiveFilters && (
                <div className="mt-6 pt-4 border-t border-border">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                    Active Filters
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {filters.q && (
                      <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm border border-primary/20">
                        {filters.q}
                        <button
                          onClick={() => navigate({ q: '' })}
                          className="ml-2 text-primary hover:underline"
                          aria-label="Remove search filter"
                        >
                          ×
                        </button>
                      </span>
                    )}
                    {filters.category && (
                      <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm border border-primary/20">
                        {categoryOptions.find(o => o.value === filters.category)?.label || filters.category}
                        <button
                          onClick={() => navigate({ category: '' })}
                          className="ml-2 text-primary hover:underline"
                          aria-label="Remove category filter"
                        >
                          ×
                        </button>
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </aside>

        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
            <div>
              <p className="text-primary text-sm font-medium uppercase tracking-wide mb-1">
                Our Fleet
              </p>
              <h1 className="font-heading font-bold text-3xl sm:text-4xl text-foreground">
                {vehicles.length} Vehicles Available
              </h1>
            </div>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-destructive hover:bg-destructive/10"
              >
                <X className="w-4 h-4 mr-1" aria-hidden="true" />
                Clear filters
              </Button>
            )}
          </div>

          <div className="relative" aria-busy={isPending}>
            {isPending && (
              <div
                className="absolute inset-0 z-10 grid place-items-center bg-background/50 backdrop-blur-sm rounded-2xl"
                role="status"
                aria-label="Loading vehicles"
              >
                <Loader2 className="w-8 h-8 animate-spin text-primary" aria-hidden="true" />
              </div>
            )}

            {vehicles.length === 0 ? (
              <div className="text-center py-16 bg-card rounded-xl border border-border">
                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Filter className="w-10 h-10 text-muted-foreground" aria-hidden="true" />
                </div>
                <h2 className="font-heading font-semibold text-xl text-foreground mb-2">
                  No vehicles found
                </h2>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
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
                  <VehicleCard key={vehicle.id} vehicle={vehicle} titleLevel={2} />
                ))}
              </div>
            )}
          </div>

          {pagination.totalPages > 1 && (
            <nav className="mt-12 flex items-center justify-center gap-3" aria-label="Pagination">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1 || isPending}
                onClick={() => navigate({ page: pagination.page - 1 })}
              >
                Previous
              </Button>
              <span className="text-muted-foreground text-sm" aria-live="polite">
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
      </div>

      {/* Mobile: Filters toggle + Results */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between gap-4 mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-primary hover:text-primary/90"
          >
            <SlidersHorizontal className="w-4 h-4" />
            {showFilters ? 'Hide Filters' : 'Filters'}
          </Button>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-destructive hover:bg-destructive/10"
            >
              <X className="w-4 h-4 mr-1" aria-hidden="true" />
              Clear filters
            </Button>
          )}
        </div>

        <div className="bg-card rounded-xl border border-border p-4 mb-6 shadow-sm">
          {showFilters && (
            <>
              <form onSubmit={handleSearchSubmit} role="search" className="mb-4">
                <Input
                  type="search"
                  name="q"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search by name, brand or model..."
                  aria-label="Search vehicles"
                  icon={<Search className="w-4 h-4" aria-hidden="true" />}
                />
                <Button type="submit" variant="primary" className="mt-3 w-full">
                  <Search className="w-4 h-4 mr-2" aria-hidden="true" />
                  Search
                </Button>
              </form>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1 uppercase tracking-wide">Category</label>
                  <Select
                    value={filters.category}
                    onChange={(event) => navigate({ category: event.target.value })}
                    options={categoryOptions}
                    label="Category"
                    aria-label="Filter by category"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1 uppercase tracking-wide">Availability</label>
                  <Select
                    value={filters.availability}
                    onChange={(event) =>
                      navigate({ availability: event.target.value as VehicleListingFilters['availability'] })
                    }
                    options={availabilityOptions}
                    label="Availability"
                    aria-label="Filter by availability"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1 uppercase tracking-wide">Sort by</label>
                  <Select
                    value={filters.sort}
                    onChange={(event) =>
                      navigate({ sort: event.target.value as VehicleListingFilters['sort'] })
                    }
                    options={SORT_LABELS}
                    label="Sort by"
                    aria-label="Sort vehicles"
                  />
                </div>
                <div>
                  <Button
                    type="button"
                    variant={filters.featured ? 'primary' : 'outline'}
                    size="md"
                    fullWidth
                    aria-pressed={filters.featured}
                    onClick={() => navigate({ featured: !filters.featured })}
                  >
                    <SlidersHorizontal className="w-4 h-4 mr-2" aria-hidden="true" />
                    Featured only ({facets.featuredCount})
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="relative" aria-busy={isPending}>
          {isPending && (
            <div
              className="absolute inset-0 z-10 grid place-items-center bg-background/50 backdrop-blur-sm rounded-2xl"
              role="status"
              aria-label="Loading vehicles"
            >
              <Loader2 className="w-8 h-8 animate-spin text-primary" aria-hidden="true" />
            </div>
          )}

          {vehicles.length === 0 ? (
            <div className="text-center py-16 bg-card rounded-xl border border-border">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Filter className="w-10 h-10 text-muted-foreground" aria-hidden="true" />
              </div>
              <h2 className="font-heading font-semibold text-xl text-foreground mb-2">
                No vehicles found
              </h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
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
                'grid grid-cols-1 sm:grid-cols-2 gap-6 transition-opacity',
                isPending && 'opacity-50'
              )}
            >
              {vehicles.map((vehicle) => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} titleLevel={2} />
              ))}
            </div>
          )}
        </div>

        {pagination.totalPages > 1 && (
          <nav className="mt-8 flex items-center justify-center gap-3" aria-label="Pagination">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1 || isPending}
              onClick={() => navigate({ page: pagination.page - 1 })}
            >
              Previous
            </Button>
            <span className="text-muted-foreground text-sm" aria-live="polite">
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
    </div>
  );
}
