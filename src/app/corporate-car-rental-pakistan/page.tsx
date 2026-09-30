import { Metadata } from 'next';
import { getBusinessInfo } from '@/lib/settings';
import { getVehicles } from '@/actions/vehicle';
import { getActiveServices } from '@/actions/settings';
import { Layout } from '@/components/layout/Layout';
import { BreadcrumbJsonLd } from '@/components/seo/BreadcrumbJsonLd';
import { VehicleCarousel } from '@/components/vehicles/VehicleCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Briefcase, CalendarDays, Users, Building2, ChevronRight, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { WhatsAppButton } from '@/components/common/WhatsAppButton';

export const metadata: Metadata = {
  title: 'Corporate Car Rental in Pakistan',
  description:
    'Corporate car rental for businesses in Pakistan: executive travel, employee transport and event transportation with online booking, WhatsApp and email coordination.',
  alternates: { canonical: '/corporate-car-rental-pakistan' },
};

const USE_CASES = [
  {
    icon: Briefcase,
    title: 'Executive Travel',
    description: 'Move managers and guests between meetings, hotels and offices without delays.',
  },
  {
    icon: Users,
    title: 'Employee Transport',
    description: 'Arrange staff travel for shifts, site visits and offsites in one booking.',
  },
  {
    icon: Building2,
    title: 'Client & Office Visits',
    description: 'Keep teams punctual for client visits, audits and inter-office travel.',
  },
  {
    icon: CalendarDays,
    title: 'Events & Conferences',
    description: 'Coordinate guest movement for seminars, exhibitions and corporate events.',
  },
];

const WHY_POINTS = [
  'One point of contact for bookings and itinerary changes.',
  'Self-drive and chauffeur-driven options depending on the assignment.',
  'Vehicles ranging from sedans to vans and coasters for larger groups.',
  'Send requests online, by WhatsApp or by email - whatever fits your workflow.',
];

export default async function CorporateCarRentalPakistanPage() {
  const [businessInfo, vehiclesData, services] = await Promise.all([
    getBusinessInfo(),
    getVehicles({ isAvailable: true, limit: 12 }),
    getActiveServices(),
  ]);

  // Executive-friendly categories actually present in the live fleet.
  const executiveVehicles = vehiclesData.data.filter((vehicle) =>
    ['SEDAN', 'SUV', 'LUXURY'].includes(vehicle.category)
  );

  // Active services from the database, linked as internal navigation.
  const serviceLinks = services.slice(0, 4).map((service) => ({
    title: service.name,
    description: service.description,
    href: service.href,
  }));

  return (
    <Layout businessInfo={businessInfo}>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', path: '/' },
          { name: 'Corporate Car Rental' },
        ]}
      />

      <section
        className="relative py-20 sm:py-32 bg-gradient-to-b from-gray-900 via-primary-900 to-gray-900 text-white overflow-hidden"
        aria-labelledby="corporate-title"
      >
        <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-50" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white text-sm font-medium mb-6">
                <Building2 className="w-4 h-4" aria-hidden="true" />
                Business Travel
              </span>
              <h1
                id="corporate-title"
                className="font-heading font-bold text-4xl sm:text-5xl lg:text-6xl mb-6 leading-tight"
              >
                Corporate Car Rental in Pakistan
              </h1>
              <p className="text-lg sm:text-xl text-gray-300 mb-8 max-w-2xl leading-relaxed">
                Car rental and transportation solutions for businesses - executive travel,
                employee transport and event transportation, arranged around your schedule.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button size="xl" asChild className="group">
                  <Link href="/booking">
                    Book a Car <ChevronRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </Link>
                </Button>
                <WhatsAppButton
                  customMessage="I would like to discuss corporate car rental for our business."
                  size="xl"
                  label="Discuss on WhatsApp"
                  ariaLabel="Discuss corporate car rental on WhatsApp"
                />
              </div>
            </div>
            <div className="relative">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-gray-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/hero.jpg"
                  alt="Corporate rental vehicle for business travel in Pakistan"
                  className="w-full h-full object-cover opacity-90"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24" aria-labelledby="corporate-use-title">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 id="corporate-use-title" className="font-heading font-bold text-3xl sm:text-4xl text-gray-900 dark:text-white mb-4">
              Built Around Business Needs
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              The common ways companies use our vehicles and drivers.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {USE_CASES.map((item) => (
              <Card key={item.title} variant="default" padding="lg" className="h-full text-center">
                <CardHeader>
                  <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <item.icon className="w-7 h-7 text-primary-600 dark:text-primary-400" aria-hidden="true" />
                  </div>
                  <CardTitle>{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-400">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24 bg-gray-50 dark:bg-gray-900/50" aria-labelledby="corporate-why-title">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <h2 id="corporate-why-title" className="font-heading font-bold text-3xl sm:text-4xl text-gray-900 dark:text-white mb-6">
                How We Work with Businesses
              </h2>
              <ul className="space-y-4">
                {WHY_POINTS.map((point) => (
                  <li key={point} className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <span className="text-lg text-gray-600 dark:text-gray-400">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Card variant="outlined" padding="lg">
              <CardHeader>
                <CardTitle>Related Services</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {serviceLinks.length > 0 ? (
                  serviceLinks.map((service) => (
                    <div key={service.href}>
                      <Link
                        href={service.href}
                        className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
                      >
                        {service.title}
                      </Link>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{service.description}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-600 dark:text-gray-400">
                    Browse the full service list on the{' '}
                    <Link href="/services" className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400">
                      services page
                    </Link>
                    .
                  </p>
                )}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button asChild>
                    <Link href="/booking">Book a Car</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/contact">Contact Us</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <VehicleCarousel
        vehicles={executiveVehicles}
        title="Vehicles for Business Travel"
        subtitle="Sedans, SUVs and luxury vehicles in our live fleet"
        viewAllHref="/vehicles?category=SEDAN"
      />

      <section className="py-16 sm:py-24 bg-primary-600 text-white" aria-labelledby="corporate-cta-title">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 id="corporate-cta-title" className="font-heading font-bold text-3xl sm:text-4xl mb-4">
            Arrange Business Travel
          </h2>
          <p className="text-lg text-primary-100 mb-8 max-w-2xl mx-auto">
            Send a booking request for your dates, or contact us to discuss a recurring corporate
            arrangement.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild className="group">
              <Link href="/booking">Book a Car</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="group border-white/60 text-white hover:bg-white/10 hover:text-white">
              <Link href="/contact">Contact Us</Link>
            </Button>
            <WhatsAppButton
              customMessage="I would like to discuss corporate car rental for our business."
              size="lg"
              className="group"
              label="Discuss on WhatsApp"
              ariaLabel="Discuss corporate car rental on WhatsApp"
            />
          </div>
          <p className="mt-6 text-sm text-primary-100">
            Already know the vehicle?{' '}
            <Link href="/vehicles" className="underline underline-offset-4 hover:text-white">
              Browse the fleet
            </Link>{' '}
            or read about{' '}
            <Link href="/corporate-travel" className="underline underline-offset-4 hover:text-white">
              corporate travel
            </Link>
            .
          </p>
        </div>
      </section>
    </Layout>
  );
}
