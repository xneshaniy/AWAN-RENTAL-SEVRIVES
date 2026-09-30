import { Metadata } from 'next';
import { getBusinessInfo } from '@/lib/settings';
import { getVehicles } from '@/actions/vehicle';
import { getEnabledAirports } from '@/config/airports';
import { servesCity } from '@/lib/seo';
import { Layout } from '@/components/layout/Layout';
import { BreadcrumbJsonLd } from '@/components/seo/BreadcrumbJsonLd';
import { VehicleCarousel } from '@/components/vehicles/VehicleCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Plane, MapPin, Clock, MessageSquare, ChevronRight, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { WhatsAppButton } from '@/components/common/WhatsAppButton';

export const metadata: Metadata = {
  title: 'Airport Transfer in Islamabad',
  description:
    'Islamabad airport transfer: pre-book pick-up and drop-off at Islamabad International Airport. Share your flight details, choose a vehicle, and travel to or from the terminal with ease.',
  alternates: { canonical: '/airport-transfer-islamabad' },
};

const STEPS = [
  {
    icon: MessageSquare,
    title: 'Send your request',
    description: 'Tell us your flight, date, pickup point and whether you are arriving or departing.',
  },
  {
    icon: Plane,
    title: 'Share flight details',
    description: 'Add your flight number so our team knows exactly when to expect you at the terminal.',
  },
  {
    icon: MapPin,
    title: 'Confirm the pickup',
    description: 'We confirm the vehicle, pickup spot and timing with you before the trip.',
  },
  {
    icon: Clock,
    title: 'Travel to/from the airport',
    description: 'Your driver meets you for the transfer to your destination in Islamabad.',
  },
];

const WHY_POINTS = [
  'Pre-booked transfer to and from Islamabad International Airport.',
  'Car, SUV, or van/minibus preference when you request the transfer.',
  'Flight number captured so pickup timing can be coordinated.',
  'Combine it with a city stay - ask about vehicles in Islamabad.',
];

export default async function AirportTransferIslamabadPage() {
  const [businessInfo, vehiclesData] = await Promise.all([
    getBusinessInfo(),
    getVehicles({ isAvailable: true, limit: 12 }),
  ]);

  // Only airports that are enabled in the airport configuration are shown.
  const enabledAirports = getEnabledAirports();
  const isbAirport = enabledAirports.find((airport) => airport.city.toLowerCase().includes('islamabad'));

  // City coverage claims require Islamabad in the `service_areas` setting.
  const cityServed = servesCity(businessInfo.serviceAreas, 'Islamabad');

  return (
    <Layout businessInfo={businessInfo}>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', path: '/' },
          { name: 'Airport Transfer Islamabad' },
        ]}
      />

      <section
        className="relative py-20 sm:py-32 bg-gradient-to-b from-secondary-700 via-secondary-800 to-gray-900 text-white overflow-hidden"
        aria-labelledby="airport-title"
      >
        <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-50" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white text-sm font-medium mb-6">
              <Plane className="w-4 h-4" aria-hidden="true" />
              Airport Transfers
            </span>
            <h1
              id="airport-title"
              className="font-heading font-bold text-4xl sm:text-5xl lg:text-6xl mb-6 leading-tight"
            >
              Airport Transfer in Islamabad
            </h1>
            <p className="text-lg sm:text-xl text-secondary-100 mb-8 max-w-3xl mx-auto leading-relaxed">
              {isbAirport
                ? 'Pre-book your pick-up or drop-off at Islamabad International Airport - share your flight details, choose your vehicle, and travel terminal to door.'
                : 'Planning a transfer to or from the airport? Send us your flight details and we will confirm the available transfer options for your date.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="xl" variant="secondary" asChild className="group">
                <Link href="/airport-transfers">
                  Request a Transfer <ChevronRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </Link>
              </Button>
              <WhatsAppButton
                customMessage="I need an airport transfer in Islamabad."
                size="xl"
                label="Book on WhatsApp"
                ariaLabel="Ask about Islamabad airport transfer on WhatsApp"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24" aria-labelledby="airport-steps-title">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 id="airport-steps-title" className="font-heading font-bold text-3xl sm:text-4xl text-gray-900 dark:text-white mb-4">
              How Your Airport Transfer Works
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              From request to terminal - four simple steps.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((step, index) => (
              <Card key={step.title} variant="default" padding="lg" className="h-full text-center">
                <CardHeader>
                  <div className="w-14 h-14 bg-secondary-100 dark:bg-secondary-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <step.icon className="w-7 h-7 text-secondary-600 dark:text-secondary-400" aria-hidden="true" />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-secondary-600 dark:text-secondary-400">
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

      <section className="py-16 sm:py-24 bg-gray-50 dark:bg-gray-900/50" aria-labelledby="airport-info-title">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <h2 id="airport-info-title" className="font-heading font-bold text-3xl sm:text-4xl text-gray-900 dark:text-white mb-6">
                {cityServed ? 'Airport Travel in Islamabad' : 'Planning an Islamabad Airport Trip?'}
              </h2>
              <ul className="space-y-4">
                {WHY_POINTS.map((point) => (
                  <li key={point} className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-secondary-600 dark:text-secondary-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <span className="text-lg text-gray-600 dark:text-gray-400">{point}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-gray-600 dark:text-gray-400">
                Extending your trip?{' '}
                <Link href="/car-rental-islamabad" className="font-medium text-secondary-600 hover:text-secondary-700 dark:text-secondary-400">
                  Car rental in Islamabad
                </Link>{' '}
                covers self-drive and chauffeur options for stays in the city.
              </p>
            </div>
            <Card variant="outlined" padding="lg">
              <CardHeader>
                <CardTitle>Configured Airport Transfers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {enabledAirports.length > 0 ? (
                  enabledAirports.map((airport) => (
                    <div
                      key={airport.id}
                      className="flex items-start justify-between gap-3 rounded-xl border border-gray-200 p-4 dark:border-gray-700"
                    >
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{airport.label}</p>
                        {airport.note && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">{airport.note}</p>
                        )}
                      </div>
                      <Badge variant="success" size="sm">Available</Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-600 dark:text-gray-400">
                    Airport transfer options change from time to time -{' '}
                    <Link href="/contact" className="font-medium text-secondary-600 hover:text-secondary-700 dark:text-secondary-400">
                      contact us
                    </Link>{' '}
                    to confirm availability for your date.
                  </p>
                )}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button asChild>
                    <Link href="/airport-transfers">Request a Transfer</Link>
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
        vehicles={vehiclesData.data}
        title="Vehicles for Airport Transfers"
        subtitle="Choose a car, SUV or van in the transfer request"
        viewAllHref="/vehicles"
      />

      <section className="py-16 sm:py-24 bg-primary-600 text-white" aria-labelledby="airport-cta-title">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 id="airport-cta-title" className="font-heading font-bold text-3xl sm:text-4xl mb-4">
            Book Your Airport Transfer
          </h2>
          <p className="text-lg text-primary-100 mb-8 max-w-2xl mx-auto">
            Send your flight details in a transfer request, or message us and we will help you
            arrange the ride.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild className="group">
              <Link href="/airport-transfers">Request a Transfer</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="group border-white/60 text-white hover:bg-white/10 hover:text-white">
              <Link href="/booking">Book a Car</Link>
            </Button>
            <WhatsAppButton
              customMessage="I need an airport transfer in Islamabad."
              size="lg"
              className="group"
              label="Book on WhatsApp"
              ariaLabel="Ask about Islamabad airport transfer on WhatsApp"
            />
          </div>
          <p className="mt-6 text-sm text-primary-100">
            Need a ride for a different route?{' '}
            <Link href="/contact" className="underline underline-offset-4 hover:text-white">
              Contact us
            </Link>{' '}
            or see our{' '}
            <Link href="/airport-transfers" className="underline underline-offset-4 hover:text-white">
              airport transfers
            </Link>{' '}
            page.
          </p>
        </div>
      </section>
    </Layout>
  );
}
