import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { formatCurrency, getVehicleCategoryLabel, cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Plus, Search, Car } from 'lucide-react';
import { VehicleRowActions } from '@/components/admin/VehicleRowActions';
import { VehicleCategory } from '@prisma/client';

export const metadata: Metadata = {
  title: 'Vehicle Management',
  robots: { index: false, follow: false },
};

interface VehiclesPageProps {
  searchParams: { view?: string; category?: string; q?: string };
}

/**
 * Fleet management list. Filtered by ?view=active|archived, ?category and
 * ?q - all backed by PostgreSQL. Row actions (edit, status, featured,
 * archive, delete) live in a client component wired to server actions.
 */
export default async function AdminVehiclesPage({ searchParams }: VehiclesPageProps) {
  const view = searchParams.view === 'archived' ? 'archived' : 'active';
  const categoryFilter = searchParams.category;
  const query = searchParams.q?.trim();

  const where: Record<string, unknown> = {};
  where.archivedAt = view === 'archived' ? { not: null } : null;
  if (categoryFilter && Object.values(VehicleCategory).includes(categoryFilter as VehicleCategory)) {
    where.category = categoryFilter as VehicleCategory;
  }
  if (query) {
    where.OR = [
      { name: { contains: query, mode: 'insensitive' } },
      { brand: { contains: query, mode: 'insensitive' } },
      { model: { contains: query, mode: 'insensitive' } },
      { licensePlate: { contains: query, mode: 'insensitive' } },
    ];
  }

  const [vehicles, categoryCounts, archivedCount] = await Promise.all([
    prisma.vehicle.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { bookings: true } } },
    }),
    prisma.vehicle.groupBy({
      by: ['category'],
      where: { archivedAt: null },
      _count: { _all: true },
    }),
    prisma.vehicle.count({ where: { archivedAt: { not: null } } }),
  ]);

  const activeCount = await prisma.vehicle.count({ where: { archivedAt: null } });
  const countFor = (category: VehicleCategory) =>
    categoryCounts.find((entry) => entry.category === category)?._count._all ?? 0;

  const hasFilters = Boolean(query || categoryFilter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-gray-900 dark:text-white">
            Vehicle Management
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Create, edit and archive fleet vehicles. Changes go live on the public site immediately.
          </p>
        </div>
        <Link
          href="/admin/vehicles/create"
          className="inline-flex items-center justify-center rounded-xl bg-primary-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-primary-700"
        >
          <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
          Add Vehicle
        </Link>
      </div>

      {/* Search (server-side GET form - works without JavaScript) */}
      <form action="/admin/vehicles" method="get" className="flex flex-wrap items-center gap-3">
        <input type="hidden" name="view" value={view} />
        {categoryFilter && <input type="hidden" name="category" value={categoryFilter} />}
        <div className="relative w-full max-w-sm">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            aria-hidden="true"
          />
          <input
            type="search"
            name="q"
            defaultValue={query ?? ''}
            placeholder="Search name, brand, plate..."
            aria-label="Search vehicles"
            className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-9 pr-4 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>
        <button
          type="submit"
          className="rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white"
        >
          Search
        </button>
        {hasFilters && (
          <Link
            href="/admin/vehicles"
            className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
          >
            Clear filters
          </Link>
        )}
      </form>

      {/* View tabs */}
      <div className="flex gap-2" role="navigation" aria-label="Vehicle views">
        <Link
          href="/admin/vehicles"
          aria-current={view === 'active' ? 'page' : undefined}
          className={cn(
            'rounded-xl px-4 py-2 text-sm font-medium transition-colors',
            view === 'active'
              ? 'bg-primary-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
          )}
        >
          Active ({activeCount})
        </Link>
        <Link
          href="/admin/vehicles?view=archived"
          aria-current={view === 'archived' ? 'page' : undefined}
          className={cn(
            'rounded-xl px-4 py-2 text-sm font-medium transition-colors',
            view === 'archived'
              ? 'bg-primary-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
          )}
        >
          Archived ({archivedCount})
        </Link>
      </div>

      {/* Category chips (only meaningful for the active view) */}
      {view === 'active' && (
        <div className="flex flex-wrap gap-2" aria-label="Filter by category">
          <Link
            href="/admin/vehicles"
            className={cn(
              'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
              !categoryFilter
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                : 'bg-white text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
            )}
          >
            All ({activeCount})
          </Link>
          {Object.values(VehicleCategory).map((cat) => (
            <Link
              key={cat}
              href={`/admin/vehicles?category=${cat}`}
              className={cn(
                'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                categoryFilter === cat
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                  : 'bg-white text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
              )}
            >
              {getVehicleCategoryLabel(cat)} ({countFor(cat)})
            </Link>
          ))}
        </div>
      )}

      <Card variant="default" padding="md">
        <CardContent>
          {vehicles.length === 0 ? (
            <div className="py-14 text-center">
              <Car className="mx-auto mb-4 h-12 w-12 text-gray-300 dark:text-gray-600" aria-hidden="true" />
              <p className="mb-1 font-medium text-gray-700 dark:text-gray-300">
                {hasFilters
                  ? 'No vehicles match your filters.'
                  : view === 'archived'
                    ? 'No archived vehicles.'
                    : 'No vehicles added yet.'}
              </p>
              <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
                {hasFilters
                  ? 'Try a different search or clear the filters.'
                  : view === 'archived'
                    ? 'Archived vehicles stay in the database but are hidden from the public site.'
                    : 'Create your first vehicle to start building the fleet.'}
              </p>
              {hasFilters ? (
                <Link
                  href="/admin/vehicles"
                  className="inline-flex items-center justify-center rounded-xl border border-gray-300 px-5 py-2.5 font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Clear filters
                </Link>
              ) : (
                view === 'active' && (
                  <Link
                    href="/admin/vehicles/create"
                    className="inline-flex items-center justify-center rounded-xl bg-primary-600 px-5 py-2.5 font-medium text-white hover:bg-primary-700"
                  >
                    <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                    Add Your First Vehicle
                  </Link>
                )
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                    <th className="w-24 pb-3 font-medium">Image</th>
                    <th className="pb-3 font-medium">Vehicle</th>
                    <th className="pb-3 font-medium">Category</th>
                    <th className="hidden pb-3 font-medium md:table-cell">Details</th>
                    <th className="pb-3 font-medium">Rates</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Bookings</th>
                    <th className="w-52 pb-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {vehicles.map((vehicle) => (
                    <tr key={vehicle.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="py-4">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={vehicle.thumbnail || vehicle.images[0] || '/placeholder-vehicle.jpg'}
                          alt={vehicle.name}
                          className="h-14 w-20 rounded-lg object-cover"
                        />
                      </td>
                      <td className="py-4">
                        <div className="font-medium text-gray-900 dark:text-white">{vehicle.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {vehicle.brand} {vehicle.model} · {vehicle.year}
                        </div>
                        <div className="text-xs text-gray-400">{vehicle.licensePlate}</div>
                      </td>
                      <td className="py-4">
                        <Badge variant="info">{getVehicleCategoryLabel(vehicle.category)}</Badge>
                      </td>
                      <td className="hidden py-4 text-sm text-gray-600 dark:text-gray-400 md:table-cell">
                        <div>
                          {vehicle.seats} seats · {vehicle.transmission}
                        </div>
                        <div>
                          {vehicle.fuelType} · {vehicle.luggageCapacity} bags
                        </div>
                        <div className="flex flex-wrap gap-1 pt-1">
                          {vehicle.selfDriveAvailable && (
                            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs dark:bg-gray-700">
                              Self-drive
                            </span>
                          )}
                          {vehicle.chauffeurAvailable && (
                            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs dark:bg-gray-700">
                              Chauffeur
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 text-sm text-gray-700 dark:text-gray-300">
                        <div className="font-medium">{formatCurrency(Number(vehicle.dailyRate))}/day</div>
                        {vehicle.weeklyRate && (
                          <div className="text-green-600 dark:text-green-400">
                            {formatCurrency(Number(vehicle.weeklyRate))}/week
                          </div>
                        )}
                        {vehicle.monthlyRate && (
                          <div className="text-green-600 dark:text-green-400">
                            {formatCurrency(Number(vehicle.monthlyRate))}/month
                          </div>
                        )}
                      </td>
                      <td className="py-4">
                        <div className="flex flex-wrap items-center gap-2">
                          {vehicle.archivedAt ? (
                            <Badge variant="warning">Archived</Badge>
                          ) : (
                            <StatusBadge status={vehicle.isAvailable ? 'AVAILABLE' : 'UNAVAILABLE'} />
                          )}
                          {vehicle.isFeatured && !vehicle.archivedAt && (
                            <Badge variant="warning" size="sm">
                              Featured
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-4 text-sm text-gray-600 dark:text-gray-400">
                        {vehicle._count.bookings}
                      </td>
                      <td className="py-4">
                        <VehicleRowActions
                          vehicleId={vehicle.id}
                          slug={vehicle.slug}
                          name={vehicle.name}
                          isAvailable={vehicle.isAvailable}
                          isFeatured={vehicle.isFeatured}
                          archived={Boolean(vehicle.archivedAt)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
