import { Metadata } from 'next';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { WhatsAppFloat } from '@/components/common/WhatsAppFloat';
import { VehicleCarousel } from '@/components/vehicles/VehicleCard';
import { Button } from '@/components/ui/Button';
import { ServiceUseCaseSection } from '@/components/services/ServiceUseCaseSection';
import { ServiceCtaBand } from '@/components/services/ServiceCtaBand';
import { getBusinessInfo } from '@/lib/settings';
import { getVehicles } from '@/actions/vehicle';
import { getWhatsAppUrl, generateServiceInquiryWhatsAppMessage } from '@/lib/whatsapp';
import { WhatsAppButton } from '@/components/common/WhatsAppButton';
import { SITE_NAME, SITE_URL } from '@/config/site';
import {
  User,
  Briefcase,
  Users,
  Plane,
  CalendarCheck,
  Route,
  Building,
  Building2,
  MessageCircle,
  Mail,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Chauffeur-Driven Car Rental in Pakistan',
  description:
    'Chauffeur-driven car rental in Pakistan for business meetings, executive travel, family trips, airport transfers, events, long-distance travel, and corporate transportation. Request a chauffeur or book on WhatsApp.',
  alternates: { canonical: '/chauffeur-service' },
};

const CONCEPT =
  'Travel with a chauffeur for business meetings, executive travel, family trips, airport transfers, events, long-distance journeys, and corporate transportation. Share your pickup point, destination, and schedule when booking — the driver handles the routes, traffic, and parking.';

/** Service name used for WhatsApp enquiry messages on this page. */
const SERVICE_NAME = 'Chauffeur Service';
const REQUEST_MESSAGE = generateServiceInquiryWhatsAppMessage(SERVICE_NAME, {
  question:
    'I would like to request a chauffeur-driven car rental. Please share the available vehicles and booking details for my trip.',
});
const BOOK_MESSAGE = generateServiceInquiryWhatsAppMessage(SERVICE_NAME, {
  question:
    'I would like to book a chauffeur-driven car rental. Please confirm availability and the next steps to reserve.',
});

interface ChauffeurUseCase {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  points: string[];
  link?: { href: string; label: string };
}

const USE_CASES: ChauffeurUseCase[] = [
  {
    id: 'business-meetings',
    icon: Building2,
    title: 'Business Meetings',
    description:
      'Chauffeur-driven travel for meetings, client visits, and office days, so you can focus on the work ahead while the route is handled for you.',
    points: [
      'Pickup and drop-off timed around your meeting schedule.',
      'Share your pickup point, destination, and stops when booking.',
      'Sedans and SUVs for solo travel or small teams.',
    ],
  },
  {
    id: 'executive-travel',
    icon: Briefcase,
    title: 'Executive Travel',
    description:
      'Chauffeur-driven travel for executives and visiting guests, with drivers experienced on local routes.',
    points: [
      'Experienced drivers who know local routes.',
      'Travel without handling traffic, routes, or parking.',
      'Choose a vehicle to suit the occasion and passenger count.',
    ],
  },
  {
    id: 'family-trips',
    icon: Users,
    title: 'Family Trips',
    description:
      'Comfortable chauffeur-driven travel for family outings, holidays, and events across the city and beyond.',
    points: [
      'SUVs, vans, and minibuses with room for passengers and luggage.',
      'Child safety seats available on request when you book.',
      'Plan the day’s route and stops with your driver in advance.',
    ],
    link: { href: '/family-travel', label: 'Explore family travel' },
  },
  {
    id: 'airport-transfers',
    icon: Plane,
    title: 'Airport Transfers',
    description:
      'Chauffeur-driven transfers to and from Islamabad International Airport, Lahore Allama Iqbal International Airport, and other major airports in Pakistan.',
    points: [
      'Share your flight number when booking so the pickup can be planned.',
      'Door-to-door transfers between the airport and hotels, offices, or homes.',
      'Vehicles matched to the number of passengers and bags.',
    ],
    link: { href: '/airport-transfers', label: 'Explore airport transfers' },
  },
  {
    id: 'events',
    icon: CalendarCheck,
    title: 'Events',
    description:
      'Transportation for weddings, corporate events, conferences, seminars, and other gatherings, arranged around your event schedule.',
    points: [
      'Pickup and drop-off times planned around your event schedule.',
      'Vans, coasters, and minibuses to move guests together.',
      'Share pickup points and timings when you book.',
    ],
    link: { href: '/event-transportation', label: 'Explore event transportation' },
  },
  {
    id: 'long-distance-travel',
    icon: Route,
    title: 'Long-Distance Travel',
    description:
      'Chauffeur-driven intercity travel between Islamabad, Rawalpindi, Lahore, Murree, Nathiagali, and other Pakistani cities.',
    points: [
      'Drivers experienced with local and long-distance routes.',
      'Rest or work while the driver handles the journey.',
      'Set your pickup point, drop-off location, and dates when booking.',
    ],
    link: { href: '/intercity-travel', label: 'Explore intercity travel' },
  },
  {
    id: 'corporate-transportation',
    icon: Building,
    title: 'Corporate Transportation',
    description:
      'Chauffeur-driven transport for companies — executives, employees, and visiting guests — for a single journey or a repeating schedule.',
    points: [
      'Trips planned around meeting, conference, and event timings.',
      'One journey or a repeating schedule arranged in advance.',
      'Sedans, SUVs, and larger vehicles for staff or guest transport.',
    ],
    link: { href: '/corporate-travel', label: 'Explore corporate travel' },
  },
];

/** White outline style for secondary CTAs on the gradient hero. */
const HERO_OUTLINE_CLASS = 'border-white text-white hover:bg-white/10 focus:ring-white';

export default async function ChauffeurServicePage() {
  const [businessInfo, vehiclesData] = await Promise.all([
    getBusinessInfo(),
    getVehicles({ isAvailable: true, limit: 50 }),
  ]);

  const chauffeurVehicles = vehiclesData.data.filter(
    (vehicle) => vehicle.chauffeurAvailable
  );

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Chauffeur-Driven Car Rental in Pakistan',
    serviceType: 'Chauffeur Service',
    description: CONCEPT,
    url: `${SITE_URL}/chauffeur-service`,
    provider: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
  };

  return (
    <Layout businessInfo={businessInfo}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section
        className="relative py-16 sm:py-24 lg:py-32 bg-gradient-to-b from-primary-600 via-primary-700 to-primary-900 text-white overflow-hidden"
        aria-labelledby="chauffeur-title"
      >
        <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-50" aria-hidden="true" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white text-sm font-medium mb-6">
            <User className="w-4 h-4" aria-hidden="true" />
            Chauffeur Service
          </span>
          <h1
            id="chauffeur-title"
            className="font-heading font-bold text-4xl sm:text-5xl lg:text-6xl mb-6 leading-tight"
          >
            Chauffeur-Driven Car Rental in Pakistan
          </h1>
          <p className="text-lg sm:text-xl text-primary-100 mb-8 max-w-3xl mx-auto leading-relaxed">
            {CONCEPT}
          </p>
          <div className="flex flex-col sm:flex-row flex-wrap gap-4 justify-center">
            <WhatsAppButton
              message={REQUEST_MESSAGE}
              size="xl"
              variant="outline"
              className={HERO_OUTLINE_CLASS}
              icon={<User className="w-5 h-5" aria-hidden="true" />}
              label="Request Chauffeur Service"
              ariaLabel="Request a chauffeur service on WhatsApp"
            />
            <WhatsAppButton
              message={BOOK_MESSAGE}
              size="xl"
              label="Book on WhatsApp"
            />
            <Button variant="secondary" size="xl" asChild>
              <Link href="/contact">
                <Mail className="w-5 h-5" aria-hidden="true" />
                Contact Us
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Seven use-case sections, rendered by a shared component with
          alternating layout and background tone. */}
      {USE_CASES.map((useCase, index) => (
        <ServiceUseCaseSection
          key={useCase.id}
          id={useCase.id}
          icon={useCase.icon}
          title={useCase.title}
          description={useCase.description}
          points={useCase.points}
          link={useCase.link}
          tone={index % 2 === 1 ? 'muted' : 'default'}
          reversed={index % 2 === 1}
        />
      ))}

      {/* Chauffeur-available vehicles */}
      <VehicleCarousel
        vehicles={chauffeurVehicles}
        title="Chauffeur-Driven Vehicles"
        subtitle="Available Now"
        viewAllHref="/vehicles"
      />

      {/* Closing CTA */}
      <ServiceCtaBand
        id="chauffeur-cta"
        title="Plan Your Chauffeur-Driven Trip"
        description="Share your pickup point, destination, dates, and passenger count to get started."
        actions={[
          {
            label: 'Request Chauffeur Service',
            href: getWhatsAppUrl(REQUEST_MESSAGE),
            external: true,
            variant: 'outline',
            className: HERO_OUTLINE_CLASS,
            icon: User,
          },
          {
            label: 'Book on WhatsApp',
            href: getWhatsAppUrl(BOOK_MESSAGE),
            external: true,
            variant: 'whatsapp',
            icon: MessageCircle,
          },
          {
            label: 'Contact Us',
            href: '/contact',
            variant: 'secondary',
            icon: Mail,
          },
        ]}
      />

      <WhatsAppFloat serviceName={SERVICE_NAME} />
    </Layout>
  );
}
