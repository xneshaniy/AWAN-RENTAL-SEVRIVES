import { Metadata } from 'next';
import { getBusinessInfo } from '@/lib/settings';
import { getVehicles } from '@/actions/vehicle';
import { Layout } from '@/components/layout/Layout';
import { BreadcrumbJsonLd } from '@/components/seo/BreadcrumbJsonLd';
import { VehicleCarousel } from '@/components/vehicles/VehicleCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { MapPin, Building2, Car, Shield, ChevronRight, User, Plane } from 'lucide-react';
import Link from 'next/link';
import { WhatsAppButton } from '@/components/common/WhatsAppButton';
import { servesCity } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Car Rental Islamabad',
  description: 'Reliable car rental in Islamabad. Self-drive, chauffeur service, airport transfers from Islamabad International Airport. Wide range of vehicles available for daily, weekly, monthly rental.',
  alternates: { canonical: '/car-rental-islamabad' },
};

const ISLAMABAD_LOCATIONS = [
  { name: 'Blue Area', description: 'Business district - corporate offices, hotels' },
  { name: 'F-6 / F-7', description: 'Residential & commercial - Jinnah Super, Melody Market' },
  { name: 'F-10 / F-11', description: 'Modern sectors - Centaurus Mall, hospitals' },
  { name: 'G-9 / G-10', description: 'Markaz, educational institutions' },
  { name: 'I-8 / I-9', description: 'Industrial & residential areas' },
  { name: 'Islamabad Airport', description: 'Islamabad International Airport (30km from city)' },
];

const POPULAR_ROUTES = [
  { from: 'Islamabad', to: 'Murree', distance: '60 km', time: '1.5 hrs', popular: true },
  { from: 'Islamabad', to: 'Nathiagali', distance: '85 km', time: '2.5 hrs', popular: true },
  { from: 'Islamabad', to: 'Lahore', distance: '380 km', time: '4.5 hrs', popular: false },
  { from: 'Islamabad', to: 'Peshawar', distance: '180 km', time: '2.5 hrs', popular: false },
  { from: 'Islamabad', to: 'Multan', distance: '450 km', time: '5.5 hrs', popular: false },
];

export default async function IslamabadCarRentalPage() {
  const [businessInfo, vehiclesData] = await Promise.all([
    getBusinessInfo(),
    getVehicles({ isAvailable: true, location: 'Islamabad', limit: 6 }),
  ]);

  // Service-availability claims only render when Islamabad is enabled in the
  // `service_areas` business setting (Admin > Site Settings > Business).
  const cityServed = servesCity(businessInfo.serviceAreas, 'Islamabad');

  return (
    <Layout businessInfo={businessInfo}>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', path: '/' },
          { name: 'Car Rental Islamabad' },
        ]}
      />
      <section className="relative py-20 sm:py-32 bg-gradient-to-b from-primary-600 via-primary-700 to-primary-900 text-white overflow-hidden" aria-labelledby="isb-title">
        <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-50" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white text-sm font-medium mb-6">
            <MapPin className="w-4 h-4" />
            Islamabad Car Rental
          </span>
          <h1 id="isb-title" className="font-heading font-bold text-4xl sm:text-5xl lg:text-6xl mb-6 leading-tight">
            Car Rental in Islamabad
          </h1>
          <p className="text-lg sm:text-xl text-primary-100 mb-8 max-w-3xl mx-auto leading-relaxed">
            {cityServed
              ? 'Your trusted partner for car rental and transportation services in Pakistan\u2019s capital. Self-drive, chauffeur, and airport transfers from Islamabad International Airport.'
              : 'Planning a trip to Pakistan\u2019s capital? Compare rental vehicles online and book in advance - ask us about self-drive, chauffeur, and airport transfer options for your stay.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="xl" asChild className="group">
              <Link href="/vehicles?location=Islamabad">Explore Vehicles <ChevronRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" /></Link>
            </Button>
            <WhatsAppButton
              customMessage="I need a car rental in Islamabad."
              size="xl"
              label="Book on WhatsApp"
              ariaLabel="Book a car rental in Islamabad on WhatsApp"
            />
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24" aria-labelledby="services-title">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 id="services-title" className="font-heading font-bold text-3xl sm:text-4xl text-gray-900 dark:text-white mb-4">
              {cityServed ? 'Our Services in Islamabad' : 'Services for Your Islamabad Trip'}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Transportation options for residents, businesses, and visitors - compare and book online.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card variant="default" padding="lg" hover className="h-full text-center">
              <CardHeader>
                <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Car className="w-7 h-7 text-primary-600 dark:text-primary-400" />
                </div>
                <CardTitle>Self-Drive Rental</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400 mb-4">Economy to luxury cars for daily, weekly, monthly rental. Pickup or delivery available.</p>
                <Button variant="outline" size="sm" asChild><Link href="/self-drive">Learn More</Link></Button>
              </CardContent>
            </Card>
            <Card variant="default" padding="lg" hover className="h-full text-center">
              <CardHeader>
                <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <User className="w-7 h-7 text-primary-600 dark:text-primary-400" />
                </div>
                <CardTitle>Chauffeur Service</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400 mb-4">Professional drivers for business meetings, airport transfers, and city tours.</p>
                <Button variant="outline" size="sm" asChild><Link href="/chauffeur-service">Learn More</Link></Button>
              </CardContent>
            </Card>
            <Card variant="default" padding="lg" hover className="h-full text-center">
              <CardHeader>
                <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Plane className="w-7 h-7 text-primary-600 dark:text-primary-400" />
                </div>
                <CardTitle>Airport Transfers</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400 mb-4">Islamabad International Airport pick-up and drop-off for arriving and departing flights.</p>
                <Button variant="outline" size="sm" asChild><Link href="/airport-transfers">Learn More</Link></Button>
              </CardContent>
            </Card>
            <Card variant="default" padding="lg" hover className="h-full text-center">
              <CardHeader>
                <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-7 h-7 text-primary-600 dark:text-primary-400" />
                </div>
                <CardTitle>Corporate Travel</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400 mb-4">Employee transport, executive travel, event transportation for Islamabad businesses.</p>
                <Button variant="outline" size="sm" asChild><Link href="/corporate-travel">Learn More</Link></Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <VehicleCarousel
        vehicles={vehiclesData.data}
        title="Available Vehicles in Islamabad"
        subtitle="Ready for Booking"
        viewAllHref="/vehicles?location=Islamabad"
      />

      <section className="py-16 sm:py-24 bg-gray-50 dark:bg-gray-900/50" aria-labelledby="areas-title">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <h2 id="areas-title" className="font-heading font-bold text-3xl sm:text-4xl text-gray-900 dark:text-white mb-6">
                {cityServed ? 'Areas We Serve in Islamabad' : 'Popular Areas in Islamabad'}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                {cityServed
                  ? 'We provide vehicle delivery and pickup across all major sectors and areas of Islamabad.'
                  : 'A quick reference to Islamabad\u2019s sectors so you can plan pick-up points and travel times when booking.'}
              </p>
              <div className="grid grid-cols-2 gap-4">
                {ISLAMABAD_LOCATIONS.map((area, index) => (
                  <Card key={index} variant="outlined" padding="md" className="group">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">{area.name}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{area.description}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-heading font-bold text-2xl text-gray-900 dark:text-white mb-6">
                Popular Intercity Routes
              </h3>
              <div className="space-y-4">
                {POPULAR_ROUTES.map((route, index) => (
                  <Card key={index} variant="outlined" padding="md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
                          <MapPin className="w-5 h-5 text-primary-600 dark:text-primary-400" />
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
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24 bg-primary-600 text-white" aria-labelledby="cta-title">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 id="cta-title" className="font-heading font-bold text-3xl sm:text-4xl mb-4">
            Ready to Explore Islamabad?
          </h2>
          <p className="text-lg text-primary-100 mb-8 max-w-2xl mx-auto">
            Book your vehicle today and experience the comfort and reliability of Awan Rental Service.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild className="group">
              <Link href="/booking">Book a Car</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="group border-white/60 text-white hover:bg-white/10 hover:text-white">
              <Link href="/vehicles">View All Vehicles</Link>
            </Button>
            <WhatsAppButton
              customMessage="I need a car rental in Islamabad."
              size="lg"
              className="group"
              label="Book on WhatsApp"
              ariaLabel="Book a car rental in Islamabad on WhatsApp"
            />
          </div>
        </div>
      </section>
    </Layout>
  );
}