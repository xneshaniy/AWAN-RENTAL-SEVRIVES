'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Users, Settings, Fuel, Luggage, MapPin, Snowflake } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { WhatsAppButton } from '@/components/common/WhatsAppButton';
import { formatCurrency, getVehicleCategoryLabel } from '@/lib/utils';
import { hasConfiguredPrice, humanizeEnum } from '@/lib/vehicles';
import type { VehicleDTO } from '@/types';

interface VehicleCardProps {
  vehicle: VehicleDTO;
  variant?: 'default' | 'compact' | 'featured';
  showBookingCTA?: boolean;
}

export function VehicleCard({ vehicle, variant = 'default', showBookingCTA = true }: VehicleCardProps) {
  const thumbnail = vehicle.thumbnail || vehicle.images[0] || '/placeholder-vehicle.svg';
  const hasPrice = hasConfiguredPrice(vehicle);
  const weeklyRate = vehicle.weeklyRate ?? null;
  const monthlyRate = vehicle.monthlyRate ?? null;
  const canBook = hasPrice && vehicle.isAvailable;
  const detailHref = `/vehicles/${vehicle.slug}`;
  const bookHref = canBook ? `${detailHref}#book` : `${detailHref}#quote`;

  const features = [
    { icon: Users, value: `${vehicle.seats} Seats`, label: 'Seats' },
    { icon: Settings, value: humanizeEnum(vehicle.transmission), label: 'Transmission' },
    { icon: Fuel, value: humanizeEnum(vehicle.fuelType), label: 'Fuel' },
    { icon: Snowflake, value: vehicle.ac ? 'AC' : 'Non-AC', label: 'Air Conditioning' },
  ];

  const isCompact = variant === 'compact';

  const priceBlock = hasPrice ? (
    <div className="flex items-start justify-between gap-4">
      <div>
        <span className="font-heading font-bold text-2xl text-gray-900 dark:text-white">
          {formatCurrency(vehicle.dailyRate)}
        </span>
        <span className="text-gray-500 dark:text-gray-400 ml-1">/day</span>
      </div>
      {(weeklyRate !== null && weeklyRate > 0) || (monthlyRate !== null && monthlyRate > 0) ? (
        <div className="text-right text-sm text-gray-500 dark:text-gray-400 space-y-0.5">
          {weeklyRate !== null && weeklyRate > 0 && (
            <div>{formatCurrency(weeklyRate)} <span aria-hidden="true">/</span>week</div>
          )}
          {monthlyRate !== null && monthlyRate > 0 && (
            <div>{formatCurrency(monthlyRate)} <span aria-hidden="true">/</span>month</div>
          )}
        </div>
      ) : null}
    </div>
  ) : (
    <div>
      <span className="font-heading font-semibold text-lg text-gray-900 dark:text-white">
        Request a Quote
      </span>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
        Share your dates for a personalised price
      </p>
    </div>
  );

  const ctaButtons = (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Button variant="outline" size="md" fullWidth asChild className="flex-1">
          <Link href={detailHref}>View Details</Link>
        </Button>
        <Button variant="primary" size="md" fullWidth asChild className="flex-1">
          <Link href={bookHref}>{canBook ? 'Book Now' : 'Request a Quote'}</Link>
        </Button>
      </div>
      <WhatsAppButton
        vehicleName={vehicle.name}
        size="md"
        fullWidth
        ariaLabel={`Ask about ${vehicle.name} on WhatsApp`}
        label="Ask on WhatsApp"
      />
    </div>
  );

  return (
    <article className={cn(
      'group relative bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700',
      'shadow-sm hover:shadow-xl transition-all duration-300',
      isCompact ? 'flex' : 'flex-col',
      variant === 'featured' ? 'ring-2 ring-primary-500/20' : ''
    )}>
      <div className={cn(
        'relative overflow-hidden',
        isCompact ? 'w-40 sm:w-48 h-48 flex-shrink-0' : 'h-56 sm:h-64'
      )}>
        <Image
          src={thumbnail}
          alt={`${vehicle.brand} ${vehicle.model} ${vehicle.year}`}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes={isCompact ? '192px' : '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <div className="absolute top-3 left-3 z-10 flex flex-col items-start gap-2">
          {vehicle.isFeatured && <Badge variant="warning" size="sm">Featured</Badge>}
          {vehicle.isDemo && <Badge variant="info" size="sm">Demo</Badge>}
        </div>

        <div className="absolute top-3 right-3 z-10">
          <Badge variant={vehicle.isAvailable ? 'success' : 'danger'} size="sm">
            {vehicle.isAvailable ? 'Available' : 'Unavailable'}
          </Badge>
        </div>
      </div>

      {!isCompact && (
        <div className="p-5 flex-1 flex flex-col">
          <div className="mb-3">
            <p className="text-xs font-medium text-primary-600 dark:text-primary-400 uppercase tracking-wide">
              {getVehicleCategoryLabel(vehicle.category)}
            </p>
            <h3 className="font-heading font-semibold text-lg text-gray-900 dark:text-white mt-1 line-clamp-1">
              {vehicle.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {vehicle.brand} {vehicle.model} · {vehicle.year}
            </p>
          </div>

          <div className="flex flex-wrap gap-3 mb-4" role="list" aria-label="Vehicle features">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                <feature.icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                <span className="font-medium">{feature.value}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
            <MapPin className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            <span>{vehicle.location}</span>
            <span className="text-gray-300 dark:text-gray-600" aria-hidden="true">•</span>
            <span>{vehicle.doors} Doors</span>
            <span className="text-gray-300 dark:text-gray-600" aria-hidden="true">•</span>
            <span>{vehicle.luggageCapacity} Bags</span>
          </div>

          <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="mb-3">{priceBlock}</div>
            {showBookingCTA && ctaButtons}
          </div>
        </div>
      )}

      {isCompact && (
        <div className="p-4 flex flex-col justify-between min-w-0">
          <div className="min-w-0">
            <p className="text-xs font-medium text-primary-600 dark:text-primary-400 uppercase tracking-wide mb-1">
              {getVehicleCategoryLabel(vehicle.category)}
            </p>
            <h3 className="font-heading font-semibold text-base text-gray-900 dark:text-white truncate mb-1">
              {vehicle.name}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {vehicle.brand} {vehicle.model} · {vehicle.year}
            </p>
          </div>

          <div className="flex flex-wrap gap-x-3 gap-y-1 my-2" role="list" aria-label="Vehicle features">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <feature.icon className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
                <span className="font-medium truncate">{feature.value}</span>
              </div>
            ))}
          </div>

          <div className="mb-3">{priceBlock}</div>
          {showBookingCTA && ctaButtons}
        </div>
      )}
    </article>
  );
}

interface VehicleCarouselProps {
  vehicles: VehicleDTO[];
  title?: string;
  subtitle?: string;
  showViewAll?: boolean;
  viewAllHref?: string;
}

export function VehicleCarousel({ vehicles, title, subtitle, showViewAll = true, viewAllHref = '/vehicles' }: VehicleCarouselProps) {
  if (vehicles.length === 0) return null;

  return (
    <section className="py-16 sm:py-24" aria-labelledby={title ? 'carousel-title' : undefined}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {(title || subtitle) && (
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
            <div>
              {subtitle && (
                <p className="text-primary-600 dark:text-primary-400 text-sm font-medium uppercase tracking-wide mb-1">
                  {subtitle}
                </p>
              )}
              {title && (
                <h2 id="carousel-title" className="font-heading font-bold text-3xl sm:text-4xl text-gray-900 dark:text-white">
                  {title}
                </h2>
              )}
            </div>
            {showViewAll && (
              <Button variant="outline" size="md" asChild className="mt-4 sm:mt-0">
                <Link href={viewAllHref}>
                  View All
                  <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </Button>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {vehicles.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} />
          ))}
        </div>
      </div>
    </section>
  );
}
