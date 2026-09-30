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
  title: 'Car Rental Lahore',
  description:
    'Car rental in Lahore: browse vehicles online and book self-drive or chauffeur hire. Area guide for Gulberg, DHA, Johar Town, Model Town and intercity routes from Lahore.',
  alternates: { canonical: '/car-rental-lahore' },
};

const LHR_LOCATIONS = [
  { name: 'Gulberg / MM Alam Road', description: 'Commercial hub - restaurants, shopping, corporate offices' },
  { name: 'DHA Lahore', description: 'Defence Housing Authority - phases 1-9, premium residential' },
  { name: 'Model Town', description: 'Planned residential - Link Road, commercial areas' },
  { name: 'Johar Town', description: 'Large residential - near Expo Centre, universities' },
  { name: 'Lahore Airport', description: 'Allama Iqbal International Airport transfers' },
  { name: 'Old City / Walled City', description: 'Historic area - Badshahi Mosque, Fort, Food Street' },
];

const LHR_ROUTES = [
  { from: 'Lahore', to: 'Islamabad', distance: '380 km', time: '4.5 hrs', popular: true },
  { from: 'Lahore', to: 'Faisalabad', distance: '180 km', time: '2.5 hrs', popular: false },
  { from: 'Lahore', to: 'Multan', distance: '330 km', time: '4 hrs', popular: false },
  { from: 'Lahore', to: 'Peshawar', distance: '480 km', time: '6 hrs', popular: false },
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
    description: 'A professional driver for city sightseeing and business trips.',
    href: '/chauffeur-service',
  },
  {
    icon: Plane,
    title: 'Airport Transfers',
    description: 'Pick-up and drop-off at Allama Iqbal International Airport.',
    href: '/airport-transfers',
  },
  {
    icon: Building2,
    title: 'Corporate Travel',
    description: 'Employee transport and business travel arrangements.',
    href: '/corporate-travel',
  },
];

export default async function LahoreCarRentalPage() {
  const [businessInfo, vehiclesData] = await Promise.all([
    getBusinessInfo(),
    getVehicles({ isAvailable: true, location: 'Lahore', limit: 6 }),
  ]);

  // Service-availability claims only render when Lahore is enabled in the
  // `service_areas` business setting (Admin > Site Settings > Business).
  const cityServed = servesCity(businessInfo.serviceAreas, 'Lahore');

  return (
    <Layout businessInfo={businessInfo}>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', path: '/' },
          { name: 'Car Rental Lahore' },
        ]}
      />
      <section className="relative py-20 sm:py-32 bg-gradient-to-b from-green-600 via-green-700 to-green-900 text-white overflow-hidden" aria-labelledby="lhr-title">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white text-sm font-medium mb-6">
            <MapPin className="w-4 h-4" aria-hidden="true" />
            Lahore Car Rental
          </span>
          <h1 id="lhr-title" className="font-heading font-bold text-4xl sm:text-5xl lg:text-6xl mb-6 leading-tight">
            Car Rental in Lahore
          </h1>
          <p className="text-lg sm:text-xl text-green-100 mb-8 max-w-3xl mx-auto leading-relaxed">
            {cityServed
              ? 'Professional car rental and transportation in Lahore. Self-drive, chauffeur service, and airport transfers from Allama Iqbal Airport. Serving Gulberg, DHA, Model Town and all areas.'
              : 'Travelling around Lahore? Browse rental vehicles online and reserve in advance - ask us about self-drive, chauffeur, and airport transfer options for your trip.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="xl" asChild className="group"><Link href="/vehicles?location=Lahore">Explore Vehicles <ChevronRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" aria-hidden="true" /></Link></Button>
            <WhatsAppButton
              customMessage="I need a car rental in Lahore."
              size="xl"
              label="Book on WhatsApp"
              ariaLabel="Book a car rental in Lahore on WhatsApp"
            />
          </div>
        </div>
      </section>

      <VehicleCarousel
        vehicles={vehiclesData.data}
        title="Vehicles based in Lahore"
        viewAllHref="/vehicles?location=Lahore"
      />

      <section className="py-16 sm:py-24" aria-labelledby="lhr-services-title">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 id="lhr-services-title" className="font-heading font-bold text-3xl sm:text-4xl text-gray-900 dark:text-white mb-4">
              Ways to Travel in Lahore
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Pick the service that suits your plans, then choose a vehicle online.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {SERVICE_LINKS.map((service) => (
              <Card key={service.title} variant="default" padding="lg" hover className="h-full text-center">
                <CardHeader>
                  <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <service.icon className="w-7 h-7 text-green-600 dark:text-green-400" aria-hidden="true" />
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

      <section className="py-16 sm:py-24 bg-gray-50 dark:bg-gray-900/50" aria-labelledby="lhr-areas-title">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <h2 id="lhr-areas-title" className="font-heading font-bold text-3xl sm:text-4xl text-gray-900 dark:text-white mb-6">
                {cityServed ? 'Areas We Serve in Lahore' : 'Popular Areas in Lahore'}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                {cityServed
                  ? 'Vehicle delivery and pick-up across Lahore - mention your area when you book.'
                  : 'A quick reference to Lahore’s neighbourhoods so you can plan pick-up points and travel times when booking.'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {LHR_LOCATIONS.map((area, index) => (
                  <Card key={index} variant="outlined" padding="md" className="group">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
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
                Popular Routes from Lahore
              </h3>
              <div className="space-y-4">
                {LHR_ROUTES.map((route, index) => (
                  <Card key={index} variant="outlined" padding="md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                          <MapPin className="w-5 h-5 text-green-600 dark:text-green-400" aria-hidden="true" />
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
                Distances and times are approximate. Heading somewhere else?{' '}
                <Link href="/contact" className="font-medium text-green-600 hover:text-green-700 dark:text-green-400">
                  Contact us
                </Link>{' '}
                or explore{' '}
                <Link href="/intercity-travel" className="font-medium text-green-600 hover:text-green-700 dark:text-green-400">
                  intercity travel
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24 bg-primary-600 text-white" aria-labelledby="lhr-cta-title">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 id="lhr-cta-title" className="font-heading font-bold text-3xl sm:text-4xl mb-4">
            Ready to Explore Lahore?
          </h2>
          <p className="text-lg text-primary-100 mb-8 max-w-2xl mx-auto">
            Reserve online in minutes, or message us and we will help you pick the right vehicle.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild className="group">
              <Link href="/booking">Book a Car</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="group border-white/60 text-white hover:bg-white/10 hover:text-white">
              <Link href="/vehicles">View All Vehicles</Link>
            </Button>
            <WhatsAppButton
              customMessage="I need a car rental in Lahore."
              size="lg"
              className="group"
              label="Book on WhatsApp"
              ariaLabel="Book a car rental in Lahore on WhatsApp"
            />
          </div>
        </div>
      </section>
    </Layout>
  );
}
