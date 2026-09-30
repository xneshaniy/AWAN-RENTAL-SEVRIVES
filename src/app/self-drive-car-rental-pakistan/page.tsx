import { Metadata } from 'next';
import { getBusinessInfo } from '@/lib/settings';
import { getVehicles } from '@/actions/vehicle';
import { Layout } from '@/components/layout/Layout';
import { BreadcrumbJsonLd } from '@/components/seo/BreadcrumbJsonLd';
import { VehicleCarousel } from '@/components/vehicles/VehicleCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MapPin, CalendarCheck, Key, RotateCcw, ChevronRight, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { WhatsAppButton } from '@/components/common/WhatsAppButton';

export const metadata: Metadata = {
  title: 'Self-Drive Car Rental in Pakistan',
  description:
    'Self-drive car rental across Pakistan: browse vehicles, pick your dates, and drive yourself. Daily, weekly and monthly self-drive options with online booking.',
  alternates: { canonical: '/self-drive-car-rental-pakistan' },
};

const STEPS = [
  {
    icon: MapPin,
    title: 'Choose a vehicle',
    description: 'Browse the fleet online and filter by category, seats and price until you find the right car.',
  },
  {
    icon: CalendarCheck,
    title: 'Book your dates',
    description: 'Pick pickup and return dates in the booking form and send your request in minutes.',
  },
  {
    icon: Key,
    title: 'Take the keys',
    description: 'Confirm the pickup details with our team, then drive yourself wherever you need to go.',
  },
  {
    icon: RotateCcw,
    title: 'Return when done',
    description: 'Bring the vehicle back at the agreed time and mileage terms - simple and straightforward.',
  },
];

const WHY_POINTS = [
  'Drive yourself - your schedule, your route, your pace.',
  'Available for daily, weekly and monthly rental.',
  'Economy, sedan, SUV and larger vehicles to choose from.',
  'Book online, then confirm the details with our team.',
];

export default async function SelfDriveCarRentalPakistanPage() {
  const [businessInfo, vehiclesData] = await Promise.all([
    getBusinessInfo(),
    getVehicles({ isAvailable: true, limit: 12 }),
  ]);

  // Only vehicles actually flagged for self-drive in the admin are shown -
  // availability always reflects the live database.
  const selfDriveVehicles = vehiclesData.data.filter((vehicle) => vehicle.selfDriveAvailable);

  return (
    <Layout businessInfo={businessInfo}>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', path: '/' },
          { name: 'Self-Drive Car Rental' },
        ]}
      />

      <section
        className="relative py-20 sm:py-32 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden"
        aria-labelledby="self-drive-title"
      >
        <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-50" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white text-sm font-medium mb-6">
                <Key className="w-4 h-4" aria-hidden="true" />
                Self-Drive Rental
              </span>
              <h1
                id="self-drive-title"
                className="font-heading font-bold text-4xl sm:text-5xl lg:text-6xl mb-6 leading-tight"
              >
                Self-Drive Car Rental in Pakistan
              </h1>
              <p className="text-lg sm:text-xl text-gray-300 mb-8 max-w-2xl leading-relaxed">
                Take the wheel yourself. Browse our vehicles, book online, and drive on your own
                schedule - for daily, weekly or monthly rentals across Pakistan.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button size="xl" asChild className="group">
                  <Link href="/booking">
                    Book a Car <ChevronRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </Link>
                </Button>
                <WhatsAppButton
                  customMessage="I would like to book a self-drive car rental."
                  size="xl"
                  label="Book on WhatsApp"
                  ariaLabel="Ask about self-drive car rental on WhatsApp"
                />
              </div>
            </div>
            <div className="relative">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-gray-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/hero.jpg"
                  alt="Rental vehicle ready for a self-drive trip in Pakistan"
                  className="w-full h-full object-cover opacity-90"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <VehicleCarousel
        vehicles={selfDriveVehicles}
        title="Available for Self-Drive"
        subtitle="Flagged for self-drive in our live fleet"
        viewAllHref="/vehicles?availability=available"
      />

      <section className="py-16 sm:py-24" aria-labelledby="how-title">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 id="how-title" className="font-heading font-bold text-3xl sm:text-4xl text-gray-900 dark:text-white mb-4">
              How Self-Drive Rental Works
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Four steps between you and the driver&apos;s seat.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((step, index) => (
              <Card key={step.title} variant="default" padding="lg" className="h-full text-center">
                <CardHeader>
                  <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <step.icon className="w-7 h-7 text-primary-600 dark:text-primary-400" aria-hidden="true" />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary-600 dark:text-primary-400">
                    Step {index + 1}
                  </p>
                  <CardTitle>{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-400">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24 bg-gray-50 dark:bg-gray-900/50" aria-labelledby="why-title">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 id="why-title" className="font-heading font-bold text-3xl sm:text-4xl text-gray-900 dark:text-white mb-6">
                Why Rent Self-Drive?
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
                <CardTitle>Good to Know Before You Book</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-gray-600 dark:text-gray-400">
                <p>
                  Self-drive availability is confirmed case by case - when you send a booking
                  request, our team confirms the vehicle, dates and pickup arrangement with you.
                </p>
                <p>
                  Need a driver instead? Explore our{' '}
                  <Link href="/chauffeur-service" className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400">
                    chauffeur service
                  </Link>{' '}
                  or our full{' '}
                  <Link href="/services" className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400">
                    service list
                  </Link>
                  .
                </p>
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

      <section className="py-16 sm:py-24 bg-primary-600 text-white" aria-labelledby="self-drive-cta-title">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 id="self-drive-cta-title" className="font-heading font-bold text-3xl sm:text-4xl mb-4">
            Ready to Drive?
          </h2>
          <p className="text-lg text-primary-100 mb-8 max-w-2xl mx-auto">
            Send your booking request online, or message us and we will help you pick a
            self-drive vehicle for your trip.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild className="group">
              <Link href="/booking">Book a Car</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="group border-white/60 text-white hover:bg-white/10 hover:text-white">
              <Link href="/vehicles">Browse All Vehicles</Link>
            </Button>
            <WhatsAppButton
              customMessage="I would like to book a self-drive car rental."
              size="lg"
              className="group"
              label="Book on WhatsApp"
              ariaLabel="Ask about self-drive car rental on WhatsApp"
            />
          </div>
          <p className="mt-6 text-sm text-primary-100">
            More questions?{' '}
            <Link href="/contact" className="underline underline-offset-4 hover:text-white">
              Contact us
            </Link>{' '}
            or read about{' '}
            <Link href="/self-drive" className="underline underline-offset-4 hover:text-white">
              self-drive rental
            </Link>
            .
          </p>
        </div>
      </section>
    </Layout>
  );
}
