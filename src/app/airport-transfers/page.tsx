import { Metadata } from 'next';
import Link from 'next/link';
import { Layout } from '@/components/layout/Layout';
import { WhatsAppFloat } from '@/components/common/WhatsAppFloat';
import { Button } from '@/components/ui/Button';
import { ServiceCtaBand } from '@/components/services/ServiceCtaBand';
import { AirportTransferForm } from '@/components/forms/AirportTransferForm';
import { getBusinessInfo } from '@/lib/settings';
import { getServiceBySlug } from '@/actions/settings';
import { getEnabledAirports } from '@/config/airports';
import {
  getWhatsAppUrl,
  generateServiceInquiryWhatsAppMessage,
} from '@/lib/whatsapp';
import { WhatsAppButton } from '@/components/common/WhatsAppButton';
import { SITE_NAME, SITE_URL } from '@/config/site';
import {
  Plane,
  CheckCircle,
  ChevronRight,
  MessageCircle,
  Mail,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Airport Transfers in Pakistan',
  description:
    'Airport transfers to and from Islamabad International Airport and Lahore Airport, with pickups and drop-offs in Rawalpindi and Islamabad. Share your flight, date, and passenger details to request a transfer, or contact us on WhatsApp.',
  alternates: { canonical: '/airport-transfers' },
};

const WHATSAPP_MESSAGE = generateServiceInquiryWhatsAppMessage('Airport Transfer');

export default async function AirportTransfersPage() {
  const [businessInfo, service] = await Promise.all([
    getBusinessInfo(),
    getServiceBySlug('airport-transfers'),
  ]);

  const airports = getEnabledAirports();
  const features = service?.features ?? [];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Airport Transfers in Pakistan',
    serviceType: 'Airport Transfers',
    description:
      'Airport transfers to and from configured airports, with flight details, door-to-door pickup and drop-off, and vehicles matched to passengers and luggage.',
    url: `${SITE_URL}/airport-transfers`,
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
        aria-labelledby="airport-title"
      >
        <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-50" aria-hidden="true" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white text-sm font-medium mb-6">
            <Plane className="w-4 h-4" aria-hidden="true" />
            Airport Transfers
          </span>
          <h1
            id="airport-title"
            className="font-heading font-bold text-4xl sm:text-5xl lg:text-6xl mb-6 leading-tight"
          >
            Airport Transfers in Pakistan
          </h1>
          <p className="text-lg sm:text-xl text-primary-100 mb-8 max-w-3xl mx-auto leading-relaxed">
            Book transfers to and from Islamabad International Airport and Lahore Allama Iqbal
            International Airport, with pickups and drop-offs across Rawalpindi and Islamabad.
            Share your flight number, date, and passenger details below — or message us on
            WhatsApp to arrange your transfer.
          </p>
          <div className="flex flex-col sm:flex-row flex-wrap gap-4 justify-center">
            <Button size="xl" variant="secondary" asChild className="group">
              <Link href="#book-transfer">
                Book Airport Transfer
                <ChevronRight
                  className="w-5 h-5 ml-1 transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </Link>
            </Button>
            <WhatsAppButton
              message={WHATSAPP_MESSAGE}
              size="xl"
              label="Book on WhatsApp"
              ariaLabel="Book an airport transfer on WhatsApp"
            />
            <Button
              size="xl"
              variant="outline"
              asChild
              className="border-white text-white hover:bg-white/10 focus:ring-white"
            >
              <Link href="/contact">
                <Mail className="w-5 h-5" aria-hidden="true" />
                Contact Us
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Airports we cover — driven by the enabled entries in config/airports */}
      <section className="py-16 sm:py-24" aria-labelledby="airports-title">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2
              id="airports-title"
              className="font-heading font-bold text-3xl sm:text-4xl text-gray-900 dark:text-white mb-4"
            >
              Airports We Cover
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Select your airport when booking — only the airports we currently serve are listed.
            </p>
          </div>

          {airports.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {airports.map((airport) => (
                <div
                  key={airport.id}
                  className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 text-center h-full"
                >
                  <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Plane
                      className="w-7 h-7 text-primary-600 dark:text-primary-400"
                      aria-hidden="true"
                    />
                  </div>
                  <h3 className="font-heading font-semibold text-lg text-gray-900 dark:text-white mb-2">
                    {airport.label}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {airport.note ?? `Serving ${airport.city}.`}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-600 dark:text-gray-400">
              Airport coverage is being updated. Please contact us for the latest destinations.
            </p>
          )}
        </div>
      </section>

      {/* Transfer details — from the service's database record */}
      {features.length > 0 && (
        <section
          className="py-16 sm:py-24 bg-gray-50 dark:bg-gray-900/50"
          aria-labelledby="details-title"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2
                id="details-title"
                className="font-heading font-bold text-3xl sm:text-4xl text-gray-900 dark:text-white mb-4"
              >
                What to Know Before Booking
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                A few details shape your transfer — share them when you send your request.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 h-full"
                >
                  <div className="w-11 h-11 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center mb-4">
                    <CheckCircle
                      className="w-6 h-6 text-primary-600 dark:text-primary-400"
                      aria-hidden="true"
                    />
                  </div>
                  <h3 className="font-heading font-semibold text-lg text-gray-900 dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Booking / inquiry form */}
      <section
        id="book-transfer"
        className="py-16 sm:py-24"
        aria-labelledby="booking-title"
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2
              id="booking-title"
              className="font-heading font-bold text-3xl sm:text-4xl text-gray-900 dark:text-white mb-4"
            >
              Book an Airport Transfer
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Fill in your trip details and we will contact you on WhatsApp to confirm the
              transfer.
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 sm:p-8">
            <AirportTransferForm />
          </div>
        </div>
      </section>

      {/* WhatsApp + Contact CTAs */}
      <ServiceCtaBand
        id="airport-cta"
        title="Prefer to Talk First?"
        description="Message us on WhatsApp with your flight details, or reach our team through the contact page."
        actions={[
          {
            label: 'Book on WhatsApp',
            href: getWhatsAppUrl(WHATSAPP_MESSAGE),
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

      <WhatsAppFloat serviceName="Airport Transfer" />
    </Layout>
  );
}
