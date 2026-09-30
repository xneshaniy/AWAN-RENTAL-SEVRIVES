'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { ChevronRight, MapPin, Calendar, Clock, Car, ChevronDown, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { WhatsAppButton } from '@/components/common/WhatsAppButton';

interface HeroProps {
  businessInfo?: Awaited<ReturnType<typeof import('@/lib/settings').getBusinessInfo>>;
}

const RENTAL_TYPE_OPTIONS = [
  { value: 'SELF_DRIVE', label: 'Self Drive' },
  { value: 'CHAUFFEUR', label: 'With Driver' },
  { value: 'AIRPORT_TRANSFER', label: 'Airport Transfer' },
  { value: 'CORPORATE', label: 'Corporate Travel' },
];

export function Hero({ businessInfo: _businessInfo }: HeroProps) {
  const router = useRouter();
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [rentalType, setRentalType] = useState('');

  const minDate = new Date().toISOString().split('T')[0];

  const handleBookingSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (pickup) params.set('pickup', pickup);
    if (dropoff) params.set('dropoff', dropoff);
    if (pickupDate) params.set('date', pickupDate);
    if (pickupTime) params.set('time', pickupTime);
    if (rentalType) params.set('rentalType', rentalType);
    const query = params.toString();
    router.push(`/vehicles${query ? `?${query}` : ''}`);
  };

  return (
    <section className="relative min-h-[640px] lg:min-h-screen flex items-center overflow-hidden" aria-labelledby="hero-title">
      <div className="absolute inset-0 z-0">
        <Image
          src="/hero.jpg"
          alt="Rental vehicle on an open highway ready for a road trip"
          fill
          className="object-cover object-center"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/90 via-gray-900/75 to-gray-900/50" />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div className="animate-slide-up">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" aria-hidden="true" />
              Serving Islamabad, Rawalpindi, Lahore &amp; Nationwide
            </span>
            <h1 id="hero-title" className="font-heading font-bold text-4xl sm:text-5xl lg:text-6xl text-white leading-tight mb-6">
              Reliable Car Rental &amp;{' '}
              <span className="text-yellow-400">Transportation</span> in Pakistan
            </h1>
            <p className="text-lg sm:text-xl text-gray-300 leading-relaxed mb-8 max-w-xl">
              Comfortable vehicles, professional service, and flexible rental options for business travelers, tourists, families, and local customers.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="xl" asChild className="group">
                <Link href="/vehicles">
                  Explore Vehicles
                  <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </Link>
              </Button>
              <WhatsAppButton size="xl" label="Book on WhatsApp" />
            </div>
          </div>

          <div className="animate-slide-up" style={{ animationDelay: '200ms' }}>
            <form
              onSubmit={handleBookingSearch}
              className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-white/20"
              aria-labelledby="hero-search-title"
            >
              <h2 id="hero-search-title" className="font-heading font-semibold text-xl text-gray-900 dark:text-white mb-5">
                Find a Vehicle
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
                  <Input
                    name="pickup"
                    placeholder="Pickup Location"
                    aria-label="Pickup Location"
                    autoComplete="off"
                    className="pl-10"
                    value={pickup}
                    onChange={(e) => setPickup(e.target.value)}
                  />
                </div>

                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
                  <Input
                    name="dropoff"
                    placeholder="Drop-off Location"
                    aria-label="Drop-off Location"
                    autoComplete="off"
                    className="pl-10"
                    value={dropoff}
                    onChange={(e) => setDropoff(e.target.value)}
                  />
                </div>

                <div className="relative">
                  <Calendar className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
                  <Input
                    type="date"
                    name="date"
                    aria-label="Pickup Date"
                    min={minDate}
                    className="pl-10"
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                  />
                </div>

                <div className="relative">
                  <Clock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
                  <Input
                    type="time"
                    name="time"
                    aria-label="Pickup Time"
                    className="pl-10"
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                  />
                </div>

                <div className="relative sm:col-span-2">
                  <Car className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" aria-hidden="true" />
                  <Select
                    name="rentalType"
                    aria-label="Rental Type"
                    placeholder="Rental Type"
                    className="pl-10"
                    options={RENTAL_TYPE_OPTIONS}
                    value={rentalType}
                    onChange={(e) => setRentalType(e.target.value)}
                  />
                </div>
              </div>

              <Button type="submit" size="lg" fullWidth className="mt-5">
                <Search className="w-5 h-5" aria-hidden="true" />
                Check Vehicles
              </Button>
            </form>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce" aria-hidden="true">
        <ChevronDown className="w-6 h-6 text-white/60" />
      </div>
    </section>
  );
}
