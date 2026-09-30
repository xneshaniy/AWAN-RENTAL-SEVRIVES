import { Metadata } from 'next';
import Link from 'next/link';
import { Layout } from '@/components/layout/Layout';
import { WhatsAppFloat } from '@/components/common/WhatsAppFloat';
import { VehicleCarousel } from '@/components/vehicles/VehicleCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { getBusinessInfo } from '@/lib/settings';
import { getVehicles } from '@/actions/vehicle';
import { getServiceBySlug, getFAQs } from '@/actions/settings';
import {
  generateServiceInquiryWhatsAppMessage,
} from '@/lib/whatsapp';
import { WhatsAppButton } from '@/components/common/WhatsAppButton';
import { SITE_NAME, SITE_URL } from '@/config/site';
import { VEHICLE_CATEGORIES } from '@/types';
import {
  CalendarDays,
  CalendarRange,
  CalendarClock,
  Car,
  MapPin,
  Truck,
  ClipboardCheck,
  HelpCircle,
  ChevronRight,
  ChevronDown,
  CheckCircle,
  Gauge,
} from 'lucide-react';

/** Business-approved concept copy — also seeded as the service's DB description. */
const APPROVED_CONCEPT =
  'Our self-drive car rental options come with flexible rental arrangements, allowing you to focus on your journey rather than worrying about unnecessary restrictions. Depending on the selected vehicle and rental plan, you can pick up your rental or request delivery to your doorstep, office, or arrival airport.';

const PAGE_DESCRIPTION =
  'Rent a car for self-drive in Pakistan with flexible daily, weekly, and monthly rental periods. Choose from economy cars, sedans, and SUVs, pick up or request delivery, review the rental requirements, and book online or on WhatsApp.';

export const metadata: Metadata = {
  title: 'Self Drive Car Rental in Pakistan',
  description: PAGE_DESCRIPTION,
  alternates: { canonical: '/self-drive' },
};

/** Service name used for WhatsApp enquiry messages on this page. */
const SERVICE_NAME = 'Self Drive Car Rental';
const QUOTE_MESSAGE = generateServiceInquiryWhatsAppMessage(SERVICE_NAME, {
  question:
    'I would like to request a quote for this service. Please share the available vehicles, rates, and delivery options.',
});
const BOOK_MESSAGE = generateServiceInquiryWhatsAppMessage(SERVICE_NAME);

const RENTAL_PERIODS = [
  {
    icon: CalendarDays,
    title: 'Daily',
    description: "For short trips and city travel. Daily rates are shown on each vehicle's page.",
  },
  {
    icon: CalendarRange,
    title: 'Weekly',
    description: 'For longer plans. Weekly rates are listed on the vehicles that support them.',
  },
  {
    icon: CalendarClock,
    title: 'Monthly',
    description: 'For extended use. Monthly rates are shown where available.',
  },
];

const PICKUP_POINTS = [
  'Collect the vehicle from the agreed pickup location in Islamabad, Rawalpindi, or Lahore.',
  'Have your driving licence and CNIC or passport ready at handover.',
  'Inspect the vehicle and confirm its condition before you drive away.',
];

const DELIVERY_POINTS = [
  'Request delivery to your doorstep, office, or arrival airport when you book.',
  'Delivery and collection are available within Islamabad, Rawalpindi, and Lahore for an additional fee.',
  'Ask for delivery at the time of booking so it can be arranged with your dates.',
];

const BOOKING_STEPS = [
  {
    title: 'Browse vehicles',
    description: 'Compare available vehicles by category, price, and specifications on the listing page.',
  },
  {
    title: 'Choose your dates',
    description: 'Pick your rental period and decide between collecting the vehicle or requesting delivery.',
  },
  {
    title: 'Send your request',
    description: 'Complete the booking form with your details, or message us directly on WhatsApp.',
  },
  {
    title: 'Confirm and collect',
    description: 'We confirm availability and hand over the vehicle at your chosen pickup point or delivery location.',
  },
];

export default async function SelfDrivePage() {
  const [businessInfo, service, vehiclesData, faqs] = await Promise.all([
    getBusinessInfo(),
    getServiceBySlug('self-drive'),
    getVehicles({ isAvailable: true, limit: 50 }),
    getFAQs(),
  ]);

  // Prefer the database record so admins can edit it later; fall back to the
  // business-approved concept so the page never renders without it.
  const concept = service?.description?.trim() || APPROVED_CONCEPT;

  const selfDriveVehicles = vehiclesData.data.filter((vehicle) => vehicle.selfDriveAvailable);

  // Unlimited-kilometre messaging is shown ONLY for vehicles whose database
  // record has `unlimitedKilometers` enabled — never as a blanket claim.
  const unlimitedKmVehicles = selfDriveVehicles.filter((vehicle) => vehicle.unlimitedKilometers);
  const kmLimits = Array.from(
    new Set(
      selfDriveVehicles
        .filter((vehicle) => !vehicle.unlimitedKilometers && typeof vehicle.kilometerLimit === 'number')
        .map((vehicle) => vehicle.kilometerLimit as number)
    )
  ).sort((a, b) => a - b);

  const categoryCounts = selfDriveVehicles.reduce<Record<string, number>>((acc, vehicle) => {
    acc[vehicle.category] = (acc[vehicle.category] || 0) + 1;
    return acc;
  }, {});
  const categoryChips = VEHICLE_CATEGORIES.filter(
    (category) => categoryCounts[category.value] > 0
  ).map((category) => ({ label: category.label, count: categoryCounts[category.value] }));

  const requirements = Array.from(
    new Set(selfDriveVehicles.flatMap((vehicle) => vehicle.rentalRequirements ?? []))
  );

  const serviceLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Self Drive Car Rental in Pakistan',
    serviceType: 'Self Drive Car Rental',
    description: concept,
    url: `${SITE_URL}/self-drive`,
    provider: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
  };

  const faqLd =
    faqs.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqs.map((faq) => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: faq.answer,
            },
          })),
        }
      : null;

  return (
    <Layout businessInfo={businessInfo}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceLd) }}
      />
      {faqLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
        />
      )}

      {/* Hero */}
      <section
        className="relative py-16 sm:py-24 lg:py-32 bg-gradient-to-b from-primary-600 via-primary-700 to-primary-900 text-white overflow-hidden"
        aria-labelledby="self-drive-title"
      >
        <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-50" aria-hidden="true" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white text-sm font-medium mb-6">
            <Car className="w-4 h-4" aria-hidden="true" />
            Self Drive
          </span>
          <h1
            id="self-drive-title"
            className="font-heading font-bold text-4xl sm:text-5xl lg:text-6xl mb-6 leading-tight"
          >
            Self Drive Car Rental in Pakistan
          </h1>
          <p className="text-lg sm:text-xl text-primary-100 mb-8 max-w-3xl mx-auto leading-relaxed">
            {concept}
          </p>
          <div className="flex flex-col sm:flex-row flex-wrap gap-4 justify-center">
            <Button size="xl" variant="secondary" asChild className="group">
              <Link href="/vehicles">
                Explore Vehicles
                <ChevronRight
                  className="w-5 h-5 ml-1 transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </Link>
            </Button>
            <WhatsAppButton
              message={QUOTE_MESSAGE}
              size="xl"
              variant="outline"
              className="border-white text-white hover:bg-white/10 focus:ring-white"
              label="Request a Quote"
            />
            <WhatsAppButton
              message={BOOK_MESSAGE}
              size="xl"
              label="Book on WhatsApp"
            />
          </div>
        </div>
      </section>

      {/* 1. Flexible rental periods */}
      <section className="py-16 sm:py-24" aria-labelledby="periods-title">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2
              id="periods-title"
              className="font-heading font-bold text-3xl sm:text-4xl text-gray-900 dark:text-white mb-4"
            >
              Flexible Rental Periods
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Rent by the day, week, or month. Rates are listed on each vehicle, so you only pay
              for the period your trip needs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {RENTAL_PERIODS.map((period) => (
              <Card key={period.title} padding="lg" hover className="h-full">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center mb-4">
                    <period.icon
                      className="w-6 h-6 text-primary-600 dark:text-primary-400"
                      aria-hidden="true"
                    />
                  </div>
                  <CardTitle>{period.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-400">{period.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Kilometre terms — data-driven, never a blanket unlimited claim */}
          <div className="rounded-2xl border border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/20 p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-11 h-11 bg-primary-100 dark:bg-primary-900/40 rounded-xl flex items-center justify-center">
                <Gauge
                  className="w-6 h-6 text-primary-600 dark:text-primary-400"
                  aria-hidden="true"
                />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-lg text-gray-900 dark:text-white mb-2">
                  Kilometre Terms
                </h3>
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  Mileage terms are set per vehicle. Each vehicle&apos;s page shows its exact
                  daily kilometre limit
                  {kmLimits.length > 0 && (
                    <>
                      {' '}
                      — current limits include{' '}
                      {kmLimits.map((limit) => `${limit} km per day`).join(' or ')}
                    </>
                  )}
                  .
                </p>
                {unlimitedKmVehicles.length > 0 && (
                  <p className="text-gray-700 dark:text-gray-300">
                    <strong className="text-primary-700 dark:text-primary-300">
                      Unlimited kilometres
                    </strong>{' '}
                    are included on:{' '}
                    {unlimitedKmVehicles.map((vehicle) => vehicle.name).join(', ')}.
                  </p>
                )}
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Need more time? Contact us at least 24 hours before your return — extensions
                  depend on vehicle availability.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Vehicle selection */}
      <section
        className="py-16 sm:py-24 bg-gray-50 dark:bg-gray-900/50"
        aria-labelledby="selection-title"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <h2
              id="selection-title"
              className="font-heading font-bold text-3xl sm:text-4xl text-gray-900 dark:text-white mb-4"
            >
              Vehicle Selection
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Choose the vehicle that fits your trip. The listing page can be filtered by
              category, transmission, seats, and price, and every vehicle shows its own rates,
              mileage terms, and availability.
            </p>
          </div>

          {categoryChips.length > 0 && (
            <ul className="flex flex-wrap justify-center gap-3 mb-8" role="list">
              {categoryChips.map((chip) => (
                <li
                  key={chip.label}
                  className="inline-flex items-center gap-2 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  {chip.label}
                  <span className="rounded-full bg-primary-100 dark:bg-primary-900/40 px-2 py-0.5 text-xs font-semibold text-primary-700 dark:text-primary-300">
                    {chip.count}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <div className="text-center">
            <Button size="lg" asChild className="group">
              <Link href="/vehicles">
                Explore Vehicles
                <ChevronRight
                  className="w-5 h-5 ml-1 transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Self-drive vehicle carousel */}
      <VehicleCarousel
        vehicles={selfDriveVehicles}
        title="Self-Drive Vehicles"
        subtitle="Available Now"
        viewAllHref="/vehicles"
      />

      {/* 3. Pickup options / 4. Delivery options */}
      <div className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-start">
          <section aria-labelledby="pickup-title">
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center mb-4">
              <MapPin
                className="w-6 h-6 text-primary-600 dark:text-primary-400"
                aria-hidden="true"
              />
            </div>
            <h2
              id="pickup-title"
              className="font-heading font-bold text-3xl sm:text-4xl text-gray-900 dark:text-white mb-4"
            >
              Pickup Options
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Collect the vehicle yourself when it suits your schedule.
            </p>
            <ul className="space-y-4" role="list">
              {PICKUP_POINTS.map((point) => (
                <li
                  key={point}
                  className="flex items-start gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex-shrink-0 w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
                    <CheckCircle
                      className="w-5 h-5 text-primary-600 dark:text-primary-400"
                      aria-hidden="true"
                    />
                  </div>
                  <p className="text-gray-700 dark:text-gray-300">{point}</p>
                </li>
              ))}
            </ul>
          </section>

          {/* 4. Delivery options */}
          <section aria-labelledby="delivery-title">
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center mb-4">
              <Truck
                className="w-6 h-6 text-primary-600 dark:text-primary-400"
                aria-hidden="true"
              />
            </div>
            <h2
              id="delivery-title"
              className="font-heading font-bold text-3xl sm:text-4xl text-gray-900 dark:text-white mb-4"
            >
              Delivery Options
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Prefer not to travel to us? Request delivery instead.
            </p>
            <ul className="space-y-4" role="list">
              {DELIVERY_POINTS.map((point) => (
                <li
                  key={point}
                  className="flex items-start gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex-shrink-0 w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
                    <CheckCircle
                      className="w-5 h-5 text-primary-600 dark:text-primary-400"
                      aria-hidden="true"
                    />
                  </div>
                  <p className="text-gray-700 dark:text-gray-300">{point}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      {/* 5. Rental requirements */}
      <section
        className="py-16 sm:py-24 bg-gray-50 dark:bg-gray-900/50"
        aria-labelledby="requirements-title"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-start">
          <div>
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center mb-4">
              <ClipboardCheck
                className="w-6 h-6 text-primary-600 dark:text-primary-400"
                aria-hidden="true"
              />
            </div>
            <h2
              id="requirements-title"
              className="font-heading font-bold text-3xl sm:text-4xl text-gray-900 dark:text-white mb-4"
            >
              Rental Requirements
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Have these ready before your pickup so the handover goes smoothly.
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-8 border border-gray-200 dark:border-gray-700">
            {requirements.length > 0 ? (
              <ul className="space-y-4" role="list">
                {requirements.map((requirement) => (
                  <li key={requirement} className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
                      <CheckCircle
                        className="w-5 h-5 text-primary-600 dark:text-primary-400"
                        aria-hidden="true"
                      />
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 pt-2">{requirement}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600 dark:text-gray-400">
                Requirements vary by vehicle.
              </p>
            )}
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              Some vehicles have additional requirements — check each vehicle&apos;s page for its
              full rental requirements.
            </p>
          </div>
        </div>
      </section>

      {/* 6. Booking process */}
      <section className="py-16 sm:py-24" aria-labelledby="process-title">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2
              id="process-title"
              className="font-heading font-bold text-3xl sm:text-4xl text-gray-900 dark:text-white mb-4"
            >
              Booking Process
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Four steps from browsing to driving.
            </p>
          </div>
          <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {BOOKING_STEPS.map((step, index) => (
              <li
                key={step.title}
                className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 h-full"
              >
                <div className="w-10 h-10 rounded-xl bg-primary-600 text-white flex items-center justify-center font-heading font-bold mb-4">
                  {index + 1}
                </div>
                <h3 className="font-heading font-semibold text-lg text-gray-900 dark:text-white mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {step.description}
                </p>
              </li>
            ))}
          </ol>
          <div className="text-center mt-10">
            <Button size="lg" asChild>
              <Link href="/booking">Start Your Booking</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 7. FAQ */}
      {faqs.length > 0 && (
        <section
          className="py-16 sm:py-24 bg-gray-50 dark:bg-gray-900/50"
          aria-labelledby="faq-title"
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                <HelpCircle
                  className="w-6 h-6 text-primary-600 dark:text-primary-400"
                  aria-hidden="true"
                />
              </div>
              <h2
                id="faq-title"
                className="font-heading font-bold text-3xl sm:text-4xl text-gray-900 dark:text-white mb-4"
              >
                Frequently Asked Questions
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Answers to the questions we hear most often about renting a car.
              </p>
            </div>
            <div className="space-y-4">
              {faqs.map((faq) => (
                <details
                  key={faq.id}
                  className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                  <summary className="flex items-center justify-between gap-4 p-5 cursor-pointer list-none font-medium text-gray-900 dark:text-white [&::-webkit-details-marker]:hidden">
                    {faq.question}
                    <ChevronDown
                      className="w-5 h-5 flex-shrink-0 text-primary-600 dark:text-primary-400 transition-transform group-open:rotate-180"
                      aria-hidden="true"
                    />
                  </summary>
                  <div className="px-5 pb-5 text-gray-600 dark:text-gray-400">{faq.answer}</div>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 8. CTA */}
      <section
        className="py-16 sm:py-24 bg-gradient-to-r from-primary-700 to-primary-900 text-white"
        aria-labelledby="cta-title"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2
            id="cta-title"
            className="font-heading font-bold text-3xl sm:text-4xl mb-4"
          >
            Ready to Drive Your Own Way?
          </h2>
          <p className="text-lg text-primary-100 mb-8 max-w-2xl mx-auto">
            Explore the vehicles available for self-drive, request a quote tailored to your trip,
            or book directly with our team on WhatsApp.
          </p>
          <div className="flex flex-col sm:flex-row flex-wrap gap-4 justify-center">
            <Button size="xl" variant="secondary" asChild className="group">
              <Link href="/vehicles">
                Explore Vehicles
                <ChevronRight
                  className="w-5 h-5 ml-1 transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </Link>
            </Button>
            <WhatsAppButton
              message={QUOTE_MESSAGE}
              size="xl"
              variant="outline"
              className="border-white text-white hover:bg-white/10 focus:ring-white"
              label="Request a Quote"
            />
            <WhatsAppButton
              message={BOOK_MESSAGE}
              size="xl"
              label="Book on WhatsApp"
            />
          </div>
        </div>
      </section>

      <WhatsAppFloat serviceName={SERVICE_NAME} />
    </Layout>
  );
}
