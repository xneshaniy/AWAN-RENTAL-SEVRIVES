import { Metadata } from 'next';
import { getBusinessInfo } from '@/lib/settings';
import { getVehicles } from '@/actions/vehicle';
import { Layout } from '@/components/layout/Layout';
import { BreadcrumbJsonLd } from '@/components/seo/BreadcrumbJsonLd';
import { VehicleCarousel } from '@/components/vehicles/VehicleCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { MapPin, Car, User, Plane, Building2, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { WhatsAppButton } from '@/components/common/WhatsAppButton';
import { servesCity } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Car Rental Rawalpindi',
  description:
    'Car rental in Rawalpindi: compare vehicles online and book self-drive or chauffeur hire. Area guide for Saddar, Peshawar Road, Bahria Town and intercity routes from Rawalpindi.',
  alternates: { canonical: '/car-rental-rawalpindi' },
};

const RWP_LOCATIONS = [
  { name: 'Saddar', description: 'Commercial center - shopping, hotels, restaurants' },
  { name: 'Peshawar Road', description: 'Major highway corridor - easy intercity access' },
  { name: 'Bahria Town', description: 'Premium housing society - phases 1-8' },
  { name: 'DHA Rawalpindi', description: 'Defence Housing Authority - upscale residential' },
  { name: 'Airport Road', description: 'Connecting to Islamabad International Airport' },
  { name: 'Rawalpindi City', description: 'Historic areas - Raja Bazaar, Committee Chowk' },
];

const RWP_ROUTES = [
  { from: 'Rawalpindi', to: 'Islamabad', distance: '20 km', time: '40 min', popular: true },
  { from: 'Rawalpindi', to: 'Murree', distance: '65 km', time: '2 hrs', popular: true },
  { from: 'Rawalpindi', to: 'Peshawar', distance: '180 km', time: '2.5 hrs', popular: false },
  { from: 'Rawalpindi', to: 'Lahore', distance: '350 km', time: '4.5 hrs', popular: false },
];

const SERVICE_LINKS = [
  {
    icon: Car,
    title: 'Self-Drive Rental',
    description: 'Drive yourself on daily, weekly or monthly rates.',
    href: '/self-drive',
  },
  {
    icon: User,
    title: 'Chauffeur Service',
    description: 'A professional driver for city and intercity trips.',
    href: '/chauffeur-service',
  },
  {
    icon: Plane,
    title: 'Airport Transfers',
    description: 'Pick-up and drop-off at Islamabad International Airport.',
    href: '/airport-transfers',
  },
  {
    icon: Building2,
    title: 'Corporate Travel',
    description: 'Employee transport and business travel arrangements.',
    href: '/corporate-travel',
  },
];

export default async function RawalpindiCarRentalPage() {
  const [businessInfo, vehiclesData] = await Promise.all([
    getBusinessInfo(),
    getVehicles({ isAvailable: true, location: 'Rawalpindi', limit: 6 }),
  ]);

  // Service-availability claims only render when Rawalpindi is enabled in
  // the `service_areas` business setting (Admin > Site Settings > Business).
  const cityServed = servesCity(businessInfo.serviceAreas, 'Rawalpindi');

  return (
    <Layout businessInfo={businessInfo}>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', path: '/' },
          { name: 'Car Rental Rawalpindi' },
        ]}
      />
      <section className="relative py-20 sm:py-32 bg-gradient-to-b from-secondary-600 via-secondary-700 to-secondary-900 text-white overflow-hidden" aria-labelledby="rwp-title">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white text-sm font-medium mb-6">
            <MapPin className="w-4 h-4" aria-hidden="true" />
            Rawalpindi Car Rental
          </span>
          <h1 id="rwp-title" className="font-heading font-bold text-4xl sm:text-5xl lg:text-6xl mb-6 leading-tight">
            Car Rental in Rawalpindi
          </h1>
          <p className="text-lg sm:text-xl text-secondary-100 mb-8 max-w-3xl mx-auto leading-relaxed">
            {cityServed
              ? 'Reliable car rental and transportation services in Rawalpindi. Self-drive, chauffeur, and airport transfers covering Saddar, Bahria Town, DHA, and all major areas.'
              : 'Planning a trip through Rawalpindi? Compare rental vehicles online and book in advance - ask us about self-drive, chauffeur, and airport transfer options for your journey.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="xl" asChild className="group"><Link href="/vehicles?location=Rawalpindi">Explore Vehicles <ChevronRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" aria-hidden="true" /></Link></Button>
            <WhatsAppButton
              customMessage="I need a car rental in Rawalpindi."
              size="xl"
              label="Book on WhatsApp"
              ariaLabel="Book a car rental in Rawalpindi on WhatsApp"
            />
          </div>
        </div>
      </section>

      <VehicleCarousel
        vehicles={vehiclesData.data}
        title="Vehicles based in Rawalpindi"
        viewAllHref="/vehicles?location=Rawalpindi"
      />

      <section className="py-16 sm:py-24" aria-labelledby="rwp-services-title">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 id="rwp-services-title" className="font-heading font-bold text-3xl sm:text-4xl text-gray-900 dark:text-white mb-4">
              Ways to Travel from Rawalpindi
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Choose the service that fits your trip, then pick a vehicle online.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {SERVICE_LINKS.map((service) => (
              <Card key={service.title} variant="default" padding="lg" hover className="h-full text-center">
                <CardHeader>
                  <div className="w-14 h-14 bg-secondary-100 dark:bg-secondary-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <service.icon className="w-7 h-7 text-secondary-600 dark:text-secondary-400" aria-hidden="true" />
                  </div>
                  <CardTitle>{service.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">{service.description}</p>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={service.href}>Learn More</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24 bg-gray-50 dark:bg-gray-900/50" aria-labelledby="rwp-areas-title">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <h2 id="rwp-areas-title" className="font-heading font-bold text-3xl sm:text-4xl text-gray-900 dark:text-white mb-6">
                {cityServed ? 'Areas We Serve in Rawalpindi' : 'Popular Areas in Rawalpindi'}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                {cityServed
                  ? 'Vehicle delivery and pick-up across Rawalpindi - mention your area when you book.'
                  : 'A quick reference to Rawalpindi’s neighbourhoods so you can plan pick-up and travel times when booking.'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {RWP_LOCATIONS.map((area, index) => (
                  <Card key={index} variant="outlined" padding="md" className="group">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-secondary-600 dark:text-secondary-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{area.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{area.description}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-heading font-bold text-2xl text-gray-900 dark:text-white mb-6">
                Popular Routes from Rawalpindi
              </h3>
              <div className="space-y-4">
                {RWP_ROUTES.map((route, index) => (
                  <Card key={index} variant="outlined" padding="md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-secondary-100 dark:bg-secondary-900/30 rounded-xl flex items-center justify-center">
                          <MapPin className="w-5 h-5 text-secondary-600 dark:text-secondary-400" aria-hidden="true" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{route.from} → {route.to}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{route.distance} · {route.time}</p>
                        </div>
                      </div>
                      {route.popular && <Badge variant="warning" size="sm">Popular</Badge>}
                    </div>
                  </Card>
                ))}
              </div>
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                Distances and times are approximate. Need a different destination?{' '}
                <Link href="/contact" className="font-medium text-secondary-600 hover:text-secondary-700 dark:text-secondary-400">
                  Ask us
                </Link>{' '}
                or check{' '}
                <Link href="/intercity-travel" className="font-medium text-secondary-600 hover:text-secondary-700 dark:text-secondary-400">
                  intercity travel
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24 bg-primary-600 text-white" aria-labelledby="rwp-cta-title">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 id="rwp-cta-title" className="font-heading font-bold text-3xl sm:text-4xl mb-4">
            Book Your Vehicle Today
          </h2>
          <p className="text-lg text-primary-100 mb-8 max-w-2xl mx-auto">
            Reserve online in minutes, or send us a message and we will help you choose the right vehicle.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild className="group">
              <Link href="/booking">Book a Car</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="group border-white/60 text-white hover:bg-white/10 hover:text-white">
              <Link href="/vehicles">View All Vehicles</Link>
            </Button>
            <WhatsAppButton
              customMessage="I need a car rental in Rawalpindi."
              size="lg"
              className="group"
              label="Book on WhatsApp"
              ariaLabel="Book a car rental in Rawalpindi on WhatsApp"
            />
          </div>
        </div>
      </section>
    </Layout>
  );
}
