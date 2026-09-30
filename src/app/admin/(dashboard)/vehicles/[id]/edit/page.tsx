import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { VehicleForm, type VehicleFormInitial } from '@/components/admin/VehicleForm';
import { Badge } from '@/components/ui/Badge';
import { RestoreButton } from '@/components/admin/VehicleRowActions';

export const metadata: Metadata = {
  title: 'Edit Vehicle',
  robots: { index: false, follow: false },
};

/** Full edit screen for one vehicle: all fields, archive state and save. */
export default async function AdminEditVehiclePage({ params }: { params: { id: string } }) {
  const vehicle = await prisma.vehicle.findUnique({ where: { id: params.id } });
  if (!vehicle) notFound();

  const initial: VehicleFormInitial = {
    name: vehicle.name,
    brand: vehicle.brand,
    model: vehicle.model,
    year: vehicle.year,
    category: vehicle.category,
    transmission: vehicle.transmission,
    fuelType: vehicle.fuelType,
    seats: vehicle.seats,
    doors: vehicle.doors,
    luggageCapacity: vehicle.luggageCapacity,
    dailyRate: Number(vehicle.dailyRate),
    weeklyRate: vehicle.weeklyRate === null ? null : Number(vehicle.weeklyRate),
    monthlyRate: vehicle.monthlyRate === null ? null : Number(vehicle.monthlyRate),
    description: vehicle.description,
    features: vehicle.features,
    images: vehicle.images,
    thumbnail: vehicle.thumbnail,
    isAvailable: vehicle.isAvailable,
    isFeatured: vehicle.isFeatured,
    location: vehicle.location,
    mileage: vehicle.mileage,
    licensePlate: vehicle.licensePlate,
    ac: vehicle.ac,
    selfDriveAvailable: vehicle.selfDriveAvailable,
    chauffeurAvailable: vehicle.chauffeurAvailable,
    unlimitedKilometers: vehicle.unlimitedKilometers,
    kilometerLimit: vehicle.kilometerLimit,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-heading text-3xl font-bold text-gray-900 dark:text-white">
              Edit Vehicle
            </h1>
            {vehicle.archivedAt && <Badge variant="warning">Archived</Badge>}
            {!vehicle.isAvailable && !vehicle.archivedAt && (
              <Badge variant="danger">Unavailable</Badge>
            )}
          </div>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            {vehicle.brand} {vehicle.model} · {vehicle.year} · {vehicle.licensePlate}
          </p>
        </div>
        <div className="flex gap-3">
          {vehicle.archivedAt && <RestoreButton vehicleId={vehicle.id} vehicleName={vehicle.name} />}
          <Link
            href={`/vehicles/${vehicle.slug}`}
            className="inline-flex items-center justify-center rounded-xl border border-gray-300 px-4 py-2.5 font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            View Public Page
          </Link>
        </div>
      </div>

      <VehicleForm mode="edit" vehicleId={vehicle.id} initial={initial} />
    </div>
  );
}
