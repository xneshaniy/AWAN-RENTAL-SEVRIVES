'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  ChevronRight as ChevronIcon,
  Users,
  Settings,
  Fuel,
  Luggage,
  MapPin,
  Calendar,
  Shield,
  CheckCircle,
  MessageCircle,
  Snowflake,
  DoorOpen,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { WhatsAppButton } from '@/components/common/WhatsAppButton';
import { WhatsAppFloat } from '@/components/common/WhatsAppFloat';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { BookingForm } from '@/components/booking/BookingForm';
import { VehicleQuoteForm } from './VehicleQuoteForm';
import { VehicleCard } from '@/components/vehicles/VehicleCard';
import { formatCurrency, getVehicleCategoryLabel } from '@/lib/utils';
import {
  hasConfiguredPrice,
  getKilometerLabel,
  getUpcomingAvailabilityPeriods,
  formatVehicleDateRange,
  humanizeEnum,
} from '@/lib/vehicles';
import type { VehicleDTO, VehicleDetailDTO } from '@/types';

interface VehicleDetailProps {
  vehicle: VehicleDetailDTO;
  similarVehicles: VehicleDTO[];
}

interface ModalShellProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

function ModalShell({ title, onClose, children }: ModalShellProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-slide-up"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between z-10">
          <h2 className="font-heading font-semibold text-lg text-gray-900 dark:text-white">{title}</h2>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close dialog">
            <ChevronLeft className="w-5 h-5" aria-hidden="true" />
          </Button>
        </div>
        <div className="p-4 sm:p-6">{children}</div>
      </div>
    </div>
  );
}

export function VehicleDetail({ vehicle, similarVehicles }: VehicleDetailProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showBooking, setShowBooking] = useState(false);
  const [showQuote, setShowQuote] = useState(false);

  const images = vehicle.images.length > 0 ? vehicle.images : ['/placeholder-vehicle.svg'];
  const currentImage = images[currentImageIndex] ?? images[0];

  const hasPrice = hasConfiguredPrice(vehicle);
  const canBook = hasPrice && vehicle.isAvailable;
  const kilometerLabel = getKilometerLabel(vehicle);
  const periods = getUpcomingAvailabilityPeriods(vehicle);

  // Deep links used by the vehicle cards: /vehicles/[slug]#book and #quote
  useEffect(() => {
    const hash = window.location.hash;
    if (hash === '#book' && canBook) setShowBooking(true);
    if (hash === '#quote') setShowQuote(true);
  }, [canBook]);

  // Close modals with the Escape key
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowBooking(false);
        setShowQuote(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const previousImage = () =>
    setCurrentImageIndex((index) => (index - 1 + images.length) % images.length);
  const nextImage = () => setCurrentImageIndex((index) => (index + 1) % images.length);

  const specifications = [
    { icon: Users, label: 'Seating', value: `${vehicle.seats} passengers` },
    { icon: DoorOpen, label: 'Doors', value: `${vehicle.doors}` },
    { icon: Settings, label: 'Transmission', value: humanizeEnum(vehicle.transmission) },
    { icon: Fuel, label: 'Fuel', value: humanizeEnum(vehicle.fuelType) },
    { icon: Snowflake, label: 'Air Conditioning', value: vehicle.ac ? 'Yes' : 'No' },
    { icon: Luggage, label: 'Luggage', value: `${vehicle.luggageCapacity} bags` },
    { icon: MapPin, label: 'Location', value: vehicle.location },
    { icon: Calendar, label: 'Model Year', value: `${vehicle.year}` },
  ];

  return (
    <div className="min-h-screen">
      <section className="py-12 sm:py-16" aria-labelledby="vehicle-title">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-8" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-primary-600 dark:hover:text-primary-400">Home</Link>
            <ChevronIcon className="w-4 h-4" aria-hidden="true" />
            <Link href="/vehicles" className="hover:text-primary-600 dark:hover:text-primary-400">Vehicles</Link>
            <ChevronIcon className="w-4 h-4" aria-hidden="true" />
            <span className="text-gray-900 dark:text-white font-medium" aria-current="page">
              {vehicle.name}
            </span>
          </nav>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Gallery + detail cards */}
            <div className="lg:col-span-2 space-y-6">
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                <Image
                  src={currentImage}
                  alt={`${vehicle.name} - photo ${currentImageIndex + 1} of ${images.length}`}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 1024px) 100vw, 66vw"
                />

                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={previousImage}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 dark:bg-gray-800/90 text-gray-800 dark:text-gray-100 flex items-center justify-center hover:bg-white dark:hover:bg-gray-800 transition-colors"
                      aria-label="Previous photo"
                    >
                      <ChevronLeft className="w-5 h-5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={nextImage}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 dark:bg-gray-800/90 text-gray-800 dark:text-gray-100 flex items-center justify-center hover:bg-white dark:hover:bg-gray-800 transition-colors"
                      aria-label="Next photo"
                    >
                      <ChevronRight className="w-5 h-5" aria-hidden="true" />
                    </button>
                  </>
                )}

                <div className="absolute bottom-4 left-4 flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-full bg-black/60 text-white text-xs font-medium">
                    {currentImageIndex + 1} / {images.length}
                  </span>
                  <WhatsAppButton
                    vehicleName={vehicle.name}
                    iconOnly
                    variant="ghost"
                    size="sm"
                    className="bg-white/90 dark:bg-gray-800/90"
                    ariaLabel={`Ask about ${vehicle.name} on WhatsApp`}
                    icon={<MessageCircle className="w-4 h-4 text-green-600" aria-hidden="true" />}
                  />
                </div>

                <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                  {vehicle.isFeatured && <Badge variant="warning" size="sm">Featured</Badge>}
                  {vehicle.isDemo && <Badge variant="info" size="sm">Demo</Badge>}
                  <Badge variant={vehicle.isAvailable ? 'success' : 'danger'} size="sm">
                    {vehicle.isAvailable ? 'Available' : 'Unavailable'}
                  </Badge>
                </div>
              </div>

              {images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2" role="list" aria-label="Vehicle photos">
                  {images.map((img, index) => (
                    <button
                      key={img + index}
                      type="button"
                      onClick={() => setCurrentImageIndex(index)}
                      className={cn(
                        'relative w-24 h-16 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all',
                        index === currentImageIndex
                          ? 'border-primary-500'
                          : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                      )}
                      aria-label={`View photo ${index + 1}`}
                      aria-current={index === currentImageIndex ? 'true' : 'false'}
                    >
                      <Image src={img} alt="" fill className="object-cover" sizes="96px" />
                    </button>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Rental options */}
                <Card padding="md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Shield className="w-5 h-5 text-primary-600" aria-hidden="true" />
                      Rental Options
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                      <span className="text-gray-600 dark:text-gray-400">Self Drive</span>
                      <Badge variant={vehicle.selfDriveAvailable ? 'success' : 'danger'} size="sm">
                        {vehicle.selfDriveAvailable ? 'Available' : 'Not available'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                      <span className="text-gray-600 dark:text-gray-400">With Driver</span>
                      <Badge variant={vehicle.chauffeurAvailable ? 'success' : 'danger'} size="sm">
                        {vehicle.chauffeurAvailable ? 'Available' : 'Not available'}
                      </Badge>
                    </div>
                    {kilometerLabel && (
                      <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                        <span className="text-gray-600 dark:text-gray-400">Kilometres</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white text-right">
                          {kilometerLabel}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Pricing */}
                <Card padding="md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Calendar className="w-5 h-5 text-primary-600" aria-hidden="true" />
                      Pricing
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {hasPrice ? (
                      <>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-gray-600 dark:text-gray-400">Daily Rate</span>
                          <span className="font-heading font-bold text-lg text-gray-900 dark:text-white">
                            {formatCurrency(vehicle.dailyRate)}
                          </span>
                        </div>
                        {vehicle.weeklyRate !== null && vehicle.weeklyRate > 0 && (
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-gray-600 dark:text-gray-400">Weekly Rate</span>
                            <span className="font-heading font-bold text-lg text-green-600 dark:text-green-400">
                              {formatCurrency(vehicle.weeklyRate)}
                            </span>
                          </div>
                        )}
                        {vehicle.monthlyRate !== null && vehicle.monthlyRate > 0 && (
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-gray-600 dark:text-gray-400">Monthly Rate</span>
                            <span className="font-heading font-bold text-lg text-green-600 dark:text-green-400">
                              {formatCurrency(vehicle.monthlyRate)}
                            </span>
                          </div>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Price excludes fuel. 13% tax is added at checkout.
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="font-heading font-semibold text-lg text-gray-900 dark:text-white">
                          Request a Quote
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Send us your dates and requirements and we will reply with a personalised
                          price for this vehicle.
                        </p>
                        <Button variant="primary" fullWidth onClick={() => setShowQuote(true)}>
                          Request This Vehicle
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Availability */}
                <Card padding="md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <FileText className="w-5 h-5 text-primary-600" aria-hidden="true" />
                      Availability
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Badge variant={vehicle.isAvailable ? 'success' : 'danger'}>
                      {vehicle.isAvailable ? 'Available for booking' : 'Currently unavailable'}
                    </Badge>
                    {periods.length > 0 ? (
                      <ul className="space-y-2" role="list">
                        {periods.map((period, index) => (
                          <li
                            key={`${period.start}-${index}`}
                            className="flex items-start justify-between gap-2 text-sm p-3 rounded-xl bg-gray-50 dark:bg-gray-800"
                          >
                            <span className="text-gray-700 dark:text-gray-300">
                              {formatVehicleDateRange(period.start, period.end)}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                              {period.label}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {vehicle.isAvailable
                          ? 'No reservations on record - this vehicle can be booked immediately.'
                          : 'Currently unavailable. Request this vehicle for the next open dates.'}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Description */}
              <section aria-labelledby="description-title">
                <h2 id="description-title" className="font-heading font-bold text-2xl text-gray-900 dark:text-white mb-4">
                  Vehicle Description
                </h2>
                <div className="prose prose-gray dark:prose-invert max-w-none">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                    {vehicle.description}
                  </p>
                </div>
              </section>

              {/* Specifications */}
              <section aria-labelledby="specs-title">
                <h2 id="specs-title" className="font-heading font-bold text-2xl text-gray-900 dark:text-white mb-4">
                  Specifications
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {specifications.map((spec) => (
                    <Card key={spec.label} padding="md" variant="outlined" className="text-center">
                      <spec.icon className="w-6 h-6 text-primary-600 mx-auto mb-2" aria-hidden="true" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">{spec.label}</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{spec.value}</p>
                    </Card>
                  ))}
                </div>
              </section>

              {/* Features */}
              {vehicle.features.length > 0 && (
                <section aria-labelledby="features-title">
                  <h2 id="features-title" className="font-heading font-bold text-2xl text-gray-900 dark:text-white mb-4">
                    Features
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {vehicle.features.map((feature, index) => (
                      <Badge key={`${feature}-${index}`} variant="outline" className="text-sm">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </section>
              )}

              {/* Rental requirements */}
              {vehicle.rentalRequirements.length > 0 && (
                <section aria-labelledby="requirements-title">
                  <h2 id="requirements-title" className="font-heading font-bold text-2xl text-gray-900 dark:text-white mb-4">
                    Rental Requirements
                  </h2>
                  <Card padding="md">
                    <ul className="space-y-3">
                      {vehicle.rentalRequirements.map((requirement, index) => (
                        <li key={`${requirement}-${index}`} className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                          <span className="text-gray-700 dark:text-gray-300">{requirement}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                </section>
              )}
            </div>

            {/* Booking card */}
            <div className="space-y-6">
              <Card padding="lg" className="sticky top-24">
                <div className="mb-4">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <Badge variant="outline">{getVehicleCategoryLabel(vehicle.category)}</Badge>
                    <Badge variant={vehicle.isAvailable ? 'success' : 'danger'}>
                      {vehicle.isAvailable ? 'Available' : 'Unavailable'}
                    </Badge>
                    {vehicle.isDemo && <Badge variant="info">Demo</Badge>}
                  </div>
                  <h1
                    id="vehicle-title"
                    className="font-heading font-bold text-2xl sm:text-3xl text-gray-900 dark:text-white mb-1"
                  >
                    {vehicle.name}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    {vehicle.brand} {vehicle.model} &middot; {vehicle.year}
                  </p>
                </div>

                <div className="mb-6">
                  {hasPrice ? (
                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <div className="font-heading font-bold text-3xl text-gray-900 dark:text-white">
                          {formatCurrency(vehicle.dailyRate)}
                        </div>
                        <div className="text-gray-500 dark:text-gray-400">/ day</div>
                      </div>
                      <div className="text-right text-sm text-gray-500 dark:text-gray-400 space-y-0.5">
                        {vehicle.weeklyRate !== null && vehicle.weeklyRate > 0 && (
                          <div>{formatCurrency(vehicle.weeklyRate)} / week</div>
                        )}
                        {vehicle.monthlyRate !== null && vehicle.monthlyRate > 0 && (
                          <div>{formatCurrency(vehicle.monthlyRate)} / month</div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="font-heading font-bold text-2xl text-gray-900 dark:text-white">
                        Request a Quote
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Pricing for this vehicle is provided on request.
                      </p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  {[
                    { label: 'Seating', value: `${vehicle.seats}` },
                    { label: 'Transmission', value: humanizeEnum(vehicle.transmission) },
                    { label: 'Fuel', value: humanizeEnum(vehicle.fuelType) },
                    { label: 'Air Conditioning', value: vehicle.ac ? 'Yes' : 'No' },
                  ].map((item) => (
                    <div key={item.label} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                      <p className="text-xs text-gray-500 dark:text-gray-400">{item.label}</p>
                      <p className="font-medium text-gray-900 dark:text-white">{item.value}</p>
                    </div>
                  ))}
                </div>

                <div className="pt-6 border-t border-gray-200 dark:border-gray-700 space-y-3">
                  <Button
                    size="lg"
                    fullWidth
                    onClick={() => (canBook ? setShowBooking(true) : setShowQuote(true))}
                  >
                    {canBook ? 'Book Now' : 'Request This Vehicle'}
                  </Button>
                  {canBook && (
                    <Button variant="outline" size="lg" fullWidth onClick={() => setShowQuote(true)}>
                      Request This Vehicle
                    </Button>
                  )}
                  <WhatsAppButton
                    vehicleName={vehicle.name}
                    size="lg"
                    fullWidth
                    label="WhatsApp Us"
                    ariaLabel={`Ask about ${vehicle.name} on WhatsApp`}
                  />
                  {!vehicle.isAvailable && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                      This vehicle is currently unavailable - request it and we will confirm the next
                      open dates.
                    </p>
                  )}
                  {!hasPrice && vehicle.isAvailable && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                      No fixed price is listed - tell us your dates and we will send a quote.
                    </p>
                  )}
                </div>
              </Card>
            </div>
          </div>

          {/* Similar vehicles */}
          {similarVehicles.length > 0 && (
            <section className="mt-12" aria-labelledby="similar-title">
              <h2 id="similar-title" className="font-heading font-bold text-2xl text-gray-900 dark:text-white mb-6">
                Similar Vehicles
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {similarVehicles.map((similar) => (
                  <VehicleCard key={similar.id} vehicle={similar} />
                ))}
              </div>
            </section>
          )}
        </div>
      </section>

      {/* Booking modal — on success the built-in success screen shows the
          booking reference and a WhatsApp CTA (with a clear configuration
          state when the number is not set). */}
      {showBooking && (
        <ModalShell title={`Book ${vehicle.name}`} onClose={() => setShowBooking(false)}>
          <BookingForm
            vehicleId={vehicle.id}
            vehicleName={vehicle.name}
          />
        </ModalShell>
      )}

      {/* Quote / request modal */}
      {showQuote && (
        <ModalShell title={`Request ${vehicle.name}`} onClose={() => setShowQuote(false)}>
          <VehicleQuoteForm
            vehicleName={vehicle.name}
            onSuccess={() => setShowQuote(false)}
          />
        </ModalShell>
      )}

      {/* Floating WhatsApp launcher — greets with this vehicle's name. */}
      <WhatsAppFloat vehicleName={vehicle.name} />
    </div>
  );
}
