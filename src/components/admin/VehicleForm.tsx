'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import type { FieldPath } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { vehicleSchema } from '@/lib/validations';
import { createVehicle, updateVehicle } from '@/actions/vehicle';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ArrowLeft, ImagePlus, Trash2 } from 'lucide-react';

type VehicleFormValues = z.infer<typeof vehicleSchema>;

/** Plain, serializable subset of a Vehicle used to prefill the edit form. */
export interface VehicleFormInitial {
  name: string;
  brand: string;
  model: string;
  year: number;
  category: string;
  transmission: string;
  fuelType: string;
  seats: number;
  doors: number;
  luggageCapacity: number;
  dailyRate: number;
  weeklyRate?: number | null;
  monthlyRate?: number | null;
  description: string;
  features: string[];
  images: string[];
  thumbnail?: string | null;
  isAvailable: boolean;
  isFeatured: boolean;
  location: string;
  mileage: number;
  licensePlate: string;
  ac: boolean;
  selfDriveAvailable: boolean;
  chauffeurAvailable: boolean;
  unlimitedKilometers: boolean;
  kilometerLimit?: number | null;
}

const CATEGORY_OPTIONS = [
  { value: 'ECONOMY', label: 'Economy' },
  { value: 'SEDAN', label: 'Sedan' },
  { value: 'SUV', label: 'SUV' },
  { value: 'LUXURY', label: 'Luxury' },
  { value: 'VAN', label: 'Van' },
  { value: 'MINIBUS', label: 'Minibus' },
  { value: 'COASTER', label: 'Coaster' },
  { value: 'HIGHLACE', label: 'Highace' },
  { value: 'PICKUP', label: 'Pickup' },
];

const TRANSMISSION_OPTIONS = [
  { value: 'MANUAL', label: 'Manual' },
  { value: 'AUTOMATIC', label: 'Automatic' },
];

const FUEL_OPTIONS = [
  { value: 'PETROL', label: 'Petrol' },
  { value: 'DIESEL', label: 'Diesel' },
  { value: 'HYBRID', label: 'Hybrid' },
  { value: 'ELECTRIC', label: 'Electric' },
  { value: 'CNG', label: 'CNG' },
];

function CheckboxRow({
  id,
  label,
  hint,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { id: string; label: string; hint?: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-gray-200 p-3 dark:border-gray-700">
      <input
        type="checkbox"
        id={id}
        className="mt-0.5 h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
        {...props}
      />
      <label htmlFor={id} className="cursor-pointer">
        <span className="block font-medium text-gray-800 dark:text-gray-200">{label}</span>
        {hint && <span className="block text-xs text-gray-500 dark:text-gray-400">{hint}</span>}
      </label>
    </div>
  );
}

interface VehicleFormProps {
  mode: 'create' | 'edit';
  vehicleId?: string;
  initial?: VehicleFormInitial;
}

/**
 * Shared create/edit vehicle form. Validation runs client-side through the
 * shared Zod `vehicleSchema` (react-hook-form) and again server-side inside
 * the `createVehicle` / `updateVehicle` actions, whose fieldErrors are mapped
 * back onto the form.
 */
export function VehicleForm({ mode, vehicleId, initial }: VehicleFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<string[]>(initial?.images?.length ? initial.images : ['']);
  const [imagesError, setImagesError] = useState<string | null>(null);
  const [featuresText, setFeaturesText] = useState((initial?.features ?? []).join('\n'));

  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors },
  } = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      name: initial?.name ?? '',
      brand: initial?.brand ?? '',
      model: initial?.model ?? '',
      year: initial?.year ?? new Date().getFullYear(),
      category: (initial?.category as VehicleFormValues['category']) ?? 'ECONOMY',
      transmission: (initial?.transmission as VehicleFormValues['transmission']) ?? 'AUTOMATIC',
      fuelType: (initial?.fuelType as VehicleFormValues['fuelType']) ?? 'PETROL',
      seats: initial?.seats ?? 4,
      doors: initial?.doors ?? 4,
      luggageCapacity: initial?.luggageCapacity ?? 2,
      dailyRate: initial?.dailyRate ?? 0,
      weeklyRate: initial?.weeklyRate ?? undefined,
      monthlyRate: initial?.monthlyRate ?? undefined,
      description: initial?.description ?? '',
      isAvailable: initial?.isAvailable ?? true,
      isFeatured: initial?.isFeatured ?? false,
      location: initial?.location ?? 'Islamabad',
      mileage: initial?.mileage ?? 0,
      licensePlate: initial?.licensePlate ?? '',
      thumbnail: initial?.thumbnail ?? undefined,
      ac: initial?.ac ?? true,
      selfDriveAvailable: initial?.selfDriveAvailable ?? true,
      chauffeurAvailable: initial?.chauffeurAvailable ?? true,
      unlimitedKilometers: initial?.unlimitedKilometers ?? false,
      kilometerLimit: initial?.kilometerLimit ?? undefined,
    },
  });

  const unlimitedKilometers = watch('unlimitedKilometers');

  const applyFieldErrors = (fieldErrors: Record<string, string[]> | undefined) => {
    if (!fieldErrors) return;
    Object.entries(fieldErrors).forEach(([field, messages]) => {
      const message = messages?.[0];
      if (!message) return;
      if (field.startsWith('images')) {
        setImagesError(message);
        return;
      }
      try {
        setError(field as FieldPath<VehicleFormValues>, { type: 'server', message });
      } catch {
        toast.error(message);
      }
    });
  };

  const onSubmit = async (data: VehicleFormValues) => {
    setImagesError(null);
    setIsSubmitting(true);
    try {
      const cleanedImages = images.map((url) => url.trim()).filter(Boolean);
      const features = featuresText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);

      const payload: VehicleFormValues = {
        ...data,
        images: cleanedImages,
        features,
        weeklyRate: data.weeklyRate || null,
        monthlyRate: data.monthlyRate || null,
        kilometerLimit: data.unlimitedKilometers ? null : data.kilometerLimit || null,
        thumbnail: data.thumbnail?.trim() ? data.thumbnail.trim() : null,
      };

      const result =
        mode === 'create' ? await createVehicle(payload) : await updateVehicle(vehicleId!, payload);

      if (!result.success) {
        applyFieldErrors(result.fieldErrors);
        toast.error(result.error || 'Failed to save vehicle');
        return;
      }

      toast.success(mode === 'create' ? 'Vehicle created' : 'Vehicle updated');
      router.push('/admin/vehicles');
      router.refresh();
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const setImageAt = (index: number, value: string) => {
    setImages((current) => current.map((url, i) => (i === index ? value : url)));
  };

  const addImage = () => setImages((current) => [...current, '']);
  const removeImage = (index: number) =>
    setImages((current) => current.filter((_, i) => i !== index));

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" aria-busy={isSubmitting}>
      <fieldset disabled={isSubmitting} className="space-y-6">
        <Card variant="default" padding="lg">
          <CardHeader>
            <CardTitle>Vehicle Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input
                {...register('name')}
                label="Display Name"
                placeholder="e.g. Toyota Corolla"
                error={errors.name?.message}
                required
              />
              <Input
                {...register('licensePlate')}
                label="License Plate"
                placeholder="e.g. ABC-123"
                error={errors.licensePlate?.message}
                required
              />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Input {...register('brand')} label="Brand" placeholder="Toyota" error={errors.brand?.message} required />
              <Input {...register('model')} label="Model" placeholder="Corolla" error={errors.model?.message} required />
              <Input
                {...register('year')}
                type="number"
                label="Year"
                min={1990}
                max={new Date().getFullYear() + 1}
                error={errors.year?.message}
                required
              />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Select
                {...register('category')}
                label="Category"
                options={CATEGORY_OPTIONS}
                error={errors.category?.message}
              />
              <Input {...register('location')} label="Location" error={errors.location?.message} />
            </div>
          </CardContent>
        </Card>

        <Card variant="default" padding="lg">
          <CardHeader>
            <CardTitle>Specifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <Input {...register('seats')} type="number" label="Seats" min={1} max={50} error={errors.seats?.message} />
              <Input {...register('doors')} type="number" label="Doors" min={2} max={6} error={errors.doors?.message} />
              <Input
                {...register('luggageCapacity')}
                type="number"
                label="Luggage"
                min={0}
                max={20}
                error={errors.luggageCapacity?.message}
              />
              <Input
                {...register('mileage')}
                type="number"
                label="Mileage (km)"
                min={0}
                error={errors.mileage?.message}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Select
                {...register('transmission')}
                label="Transmission"
                options={TRANSMISSION_OPTIONS}
                error={errors.transmission?.message}
              />
              <Select {...register('fuelType')} label="Fuel Type" options={FUEL_OPTIONS} error={errors.fuelType?.message} />
            </div>
            <CheckboxRow id="ac" label="Air Conditioning" hint="Vehicle includes A/C" {...register('ac')} />
          </CardContent>
        </Card>

        <Card variant="default" padding="lg">
          <CardHeader>
            <CardTitle>Pricing (PKR)</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Input
              {...register('dailyRate')}
              type="number"
              label="Daily Rate"
              min={0}
              step={100}
              error={errors.dailyRate?.message}
              required
            />
            <Input
              {...register('weeklyRate')}
              type="number"
              label="Weekly Rate"
              min={0}
              step={100}
              helperText="Optional - for 7+ day rentals"
              error={errors.weeklyRate?.message}
            />
            <Input
              {...register('monthlyRate')}
              type="number"
              label="Monthly Rate"
              min={0}
              step={100}
              helperText="Optional - for 30+ day rentals"
              error={errors.monthlyRate?.message}
            />
          </CardContent>
        </Card>

        <Card variant="default" padding="lg">
          <CardHeader>
            <CardTitle>Rental Options &amp; Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <CheckboxRow
                id="selfDriveAvailable"
                label="Self-drive rental"
                hint="Customers can rent this vehicle without a driver"
                {...register('selfDriveAvailable')}
              />
              <CheckboxRow
                id="chauffeurAvailable"
                label="Chauffeur rental"
                hint="Available with a professional driver"
                {...register('chauffeurAvailable')}
              />
              <CheckboxRow
                id="unlimitedKilometers"
                label="Unlimited kilometers"
                hint="No distance cap on the rental"
                {...register('unlimitedKilometers')}
              />
              <Input
                {...register('kilometerLimit')}
                type="number"
                label="Kilometer Limit"
                min={0}
                placeholder="e.g. 150"
                helperText="Used when unlimited kilometers is off"
                disabled={unlimitedKilometers}
                error={errors.kilometerLimit?.message}
              />
              <CheckboxRow
                id="isAvailable"
                label="Available for booking"
                hint="Turn off to temporarily hide this vehicle from booking"
                {...register('isAvailable')}
              />
              <CheckboxRow
                id="isFeatured"
                label="Featured vehicle"
                hint="Shown in homepage highlights"
                {...register('isFeatured')}
              />
            </div>
          </CardContent>
        </Card>

        <Card variant="default" padding="lg">
          <CardHeader>
            <CardTitle>Description &amp; Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              {...register('description')}
              label="Description"
              rows={5}
              placeholder="Describe the vehicle, ideal use cases and what is included..."
              error={errors.description?.message}
              required
            />
            <Textarea
              label="Features (one per line)"
              rows={4}
              value={featuresText}
              onChange={(event) => setFeaturesText(event.target.value)}
              helperText="e.g. Bluetooth, Backup camera, USB charging"
            />
            <Input
              {...register('thumbnail')}
              type="text"
              label="Thumbnail Image URL"
              placeholder="/vehicles/car.jpg"
              error={errors.thumbnail?.message}
            />
          </CardContent>
        </Card>

        <Card variant="default" padding="lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Images</span>
              <Button type="button" variant="outline" size="sm" onClick={addImage}>
                <ImagePlus className="mr-1.5 h-4 w-4" aria-hidden="true" />
                Add Image
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {imagesError && (
              <p role="alert" className="text-sm text-red-600 dark:text-red-400">
                {imagesError}
              </p>
            )}
            {images.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No images yet. Add at least one image URL so the vehicle looks good on the public site.
              </p>
            )}
            {images.map((url, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  type="text"
                  value={url}
                  onChange={(event) => setImageAt(index, event.target.value)}
                  placeholder="/vehicles/image.jpg or https://..."
                  aria-label={`Image URL ${index + 1}`}
                  fullWidth
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  aria-label={`Remove image ${index + 1}`}
                  className="rounded-lg p-2.5 text-gray-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30"
                >
                  <Trash2 className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="submit" size="lg" loading={isSubmitting} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Vehicle' : 'Save Changes'}
          </Button>
          <Button type="button" variant="outline" size="lg" asChild>
            <Link href="/admin/vehicles">
              <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
              Back to Vehicles
            </Link>
          </Button>
        </div>
      </fieldset>
    </form>
  );
}
