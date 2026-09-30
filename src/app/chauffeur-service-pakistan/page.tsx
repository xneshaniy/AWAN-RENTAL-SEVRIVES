import { Metadata } from 'next';
import { getBusinessInfo } from '@/lib/settings';
import { getVehicles } from '@/actions/vehicle';
import { Layout } from '@/components/layout/Layout';
import { BreadcrumbJsonLd } from '@/components/seo/BreadcrumbJsonLd';
import { VehicleCarousel } from '@/components/vehicles/VehicleCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { User, Plane, Briefcase, Users, MapPin, ChevronRight, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { WhatsAppButton } from '@/components/common/WhatsAppButton';

export const metadata: Metadata = {
  title: 'Chauffeur Service in Pakistan',
  description:
    'Chauffeur service with a professional driver for airport transfers, business meetings, family trips and intercity travel. Book a chauffeur-driven car online in Pakistan.',
  alternates: { canonical: '/chauffeur-service-pakistan' },
};

const USE_CASES = [
  {
    icon: Plane,
    title: 'Airport Journeys',
    description:
      'Arrive or depart without parking worries - a chauffeur handles the drive while you focus on the flight.',
    href: '/airport-transfers',
  },
  {
    icon: Briefcase,
    title: 'Business Travel',
    description:
      'Reach meetings, client visits and conferences on time with a professional driver at the wheel.',
    href: '/corporate-travel',
  },
  {
    icon: Users,
    title: 'Family & Groups',
    description:
      'Family events, weddings and group outings are easier when everyone travels together with a driver.',
    href: '/family-travel',
  },
  {
    icon: MapPin,
    title: 'Intercity Trips',
    description:
      'Door-to-door travel between cities - sit back and let an experienced driver cover the road.',
    href: '/intercity-travel',
  },
];

const WHY_POINTS = [
  'A professional driver handles the roads and parking.',
  'Ideal when you do not want to drive in unfamiliar cities.',
  'Works for airport pickups, city days and intercity routes.',
  'Confirm the itinerary with our team when you book.',
];

export default async function ChauffeurServicePakistanPage() {
  const [businessInfo, vehiclesData] = await Promise.all([
    getBusinessInfo(),
    getVehicles({ isAvailable: true, limit: 12 }),
  ]);

  // Only vehicles flagged for chauffeur service in the admin are shown -
  // availability always reflects the live database.
  const chauffeurVehicles = vehiclesData.data.filter((vehicle) => vehicle.chauffeurAvailable);

  return (
    <Layout businessInfo={businessInfo}>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', path: '/' },
          { name: 'Chauffeur Service' },
        ]}
      />

      <section
        className="relative py-20 sm:py-32 bg-gradient-to-b from-primary-700 via-primary-800 to-gray-900 text-white overflow-hidden"
        aria-labelledby="chauffeur-title"
      >
        <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-50" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white text-sm font-medium mb-6">
                <User className="w-4 h-4" aria-hidden="true" />
                Chauffeur-Driven Travel
              </span>
              <h1
                id="chauffeur-title"
                className="font-heading font-bold text-4xl sm:text-5xl lg:text-6xl mb-6 leading-tight"
              >
                Chauffeur Service in Pakistan
              </h1>
              <p className="text-lg sm:text-xl text-primary-100 mb-8 max-w-2xl leading-relaxed">
                Travel with a professional driver behind the wheel - for airport journeys, business
                meetings, family occasions and road trips between cities.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button size="xl" variant="secondary" asChild className="group">
                  <Link href="/booking">
                    Book a Car <ChevronRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </Link>
                </Button>
                <WhatsAppButton
                  customMessage="I would like to book a chauffeur-driven car."
                  size="xl"
                  label="Book on WhatsApp"
                  ariaLabel="Ask about chauffeur service on WhatsApp"
                />
              </div>
            </div>
            <div className="relative">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-gray-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/hero.jpg"
                  alt="Chauffeur-driven rental vehicle for hire in Pakistan"
                  className="w-full h-full object-cover opacity-90"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <VehicleCarousel
        vehicles={chauffeurVehicles}
        title="Available with a Chauffeur"
        subtitle="Flagged for chauffeur service in our live fleet"
        viewAllHref="/vehicles?availability=available"
      />

      <section className="py-16 sm:py-24" aria-labelledby="use-cases-title">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 id="use-cases-title" className="font-heading font-bold text-3xl sm:text-4xl text-gray-900 dark:text-white mb-4">
              When a Chauffeur Makes Sense
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Different trips, one convenient arrangement - a driver you can rely on.
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
                  <p className="text-gray-600 dark:text-gray-400 mb-4">{item.description}</p>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={item.href}>Learn More</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24 bg-gray-50 dark:bg-gray-900/50" aria-labelledby="chauffeur-why-title">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 id="chauffeur-why-title" className="font-heading font-bold text-3xl sm:text-4xl text-gray-900 dark:text-white mb-6">
                Sit Back and Travel
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
                <CardTitle>Planning a Chauffeur Trip?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-gray-600 dark:text-gray-400">
                <p>
                  Tell us the pickup point, destination, dates and number of passengers in your
                  booking request - our team will confirm a suitable vehicle and driver with you.
                </p>
                <p>
                  Prefer to drive yourself? See{' '}
                  <Link href="/self-drive" className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400">
                    self-drive rental
                  </Link>
                  , or browse{' '}
                  <Link href="/services" className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400">
                    all services
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

      <section className="py-16 sm:py-24 bg-primary-600 text-white" aria-labelledby="chauffeur-cta-title">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 id="chauffeur-cta-title" className="font-heading font-bold text-3xl sm:text-4xl mb-4">
            Book a Chauffeur-Driven Car
          </h2>
          <p className="text-lg text-primary-100 mb-8 max-w-2xl mx-auto">
            Send your booking request online, or message us with your itinerary and we will sort
            out the vehicle and driver.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild className="group">
              <Link href="/booking">Book a Car</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="group border-white/60 text-white hover:bg-white/10 hover:text-white">
              <Link href="/vehicles">Browse All Vehicles</Link>
            </Button>
            <WhatsAppButton
              customMessage="I would like to book a chauffeur-driven car."
              size="lg"
              className="group"
              label="Book on WhatsApp"
              ariaLabel="Ask about chauffeur service on WhatsApp"
            />
          </div>
          <p className="mt-6 text-sm text-primary-100">
            Prefer to talk first?{' '}
            <Link href="/contact" className="underline underline-offset-4 hover:text-white">
              Contact us
            </Link>{' '}
            or read about{' '}
            <Link href="/chauffeur-service" className="underline underline-offset-4 hover:text-white">
              chauffeur service
            </Link>
            .
          </p>
        </div>
      </section>
    </Layout>
  );
}
