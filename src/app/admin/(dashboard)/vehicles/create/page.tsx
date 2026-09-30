import type { Metadata } from 'next';
import { VehicleForm } from '@/components/admin/VehicleForm';

export const metadata: Metadata = {
  title: 'Add Vehicle',
  robots: { index: false, follow: false },
};

/** Create a new vehicle in PostgreSQL. Data is validated with the shared Zod vehicleSchema. */
export default function AdminCreateVehiclePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-gray-900 dark:text-white">Add Vehicle</h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Add a new vehicle to the fleet. It appears on the public site as soon as it is available.
        </p>
      </div>
      <VehicleForm mode="create" />
    </div>
  );
}
