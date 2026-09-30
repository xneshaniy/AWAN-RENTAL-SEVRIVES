import { Metadata } from 'next';
import Link from 'next/link';
import { Layout } from '@/components/layout/Layout';
import { BreadcrumbJsonLd } from '@/components/seo/BreadcrumbJsonLd';
import { WhatsAppFloat } from '@/components/common/WhatsAppFloat';
import { ServiceCard } from '@/components/services/ServiceCard';
import { Button } from '@/components/ui/Button';
import { getBusinessInfo } from '@/lib/settings';
import { getActiveServices } from '@/actions/settings';
import { WhatsAppButton } from '@/components/common/WhatsAppButton';
import { SITE_NAME, SITE_URL } from '@/config/site';
import {
  Car,
  ChevronRight,
  Clock,
  ListChecks,
  MapPin,
  Shield,
} from 'lucide-react';

const PAGE_DESCRIPTION =
  'Browse our transportation services: self-drive car rental, chauffeur service, airport transfers, corporate transportation, intercity travel, family travel, event transportation, and commercial vehicle rental across Pakistan.';

export const metadata: Metadata = {
  title: 'Our Services',
  description: PAGE_DESCRIPTION,
  alternates: { canonical: '/services' },
};

const WHY_CHOOSE = [
  {
    icon: Shield,
    title: 'Quality Service',
    description: 'High-quality service specially tailored to suit your specific travel needs.',
  },
  {
    icon: Clock,
    title: 'Dedicated Reservations',
    description: 'Dedicated reservations offering convenient service for your trips.',
  },
  {
    icon: MapPin,
    title: 'Coverage Across Pakistan',
    description: 'Car rental and transportation solutions for customers across Pakistan.',
  },
];

export default async function ServicesPage() {
  const [businessInfo, services] = await Promise.all([
    getBusinessInfo(),
    getActiveServices(),
  ]);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Our Transportation Services',
    url: `${SITE_URL}/services`,
    description: PAGE_DESCRIPTION,
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: services.length,
      itemListElement: services.map((service, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Service',
          name: service.name,
          description: service.description,
          url: `${SITE_URL}${service.href}`,
          provider: {
            '@type': 'Organization',
            name: SITE_NAME,
            url: SITE_URL,
          },
        },
      })),
    },
  };

  return (
    <Layout businessInfo={businessInfo}>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', path: '/' },
          { name: 'Services' },
        ]}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section
        className="relative py-16 sm:py-24 bg-gradient-to-b from-primary-600 via-primary-700 to-primary-900 text-white overflow-hidden"
        aria-labelledby="services-title"
      >
        <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-50" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white text-sm font-medium mb-6">
            <Car className="w-4 h-4" aria-hidden="true" />
            Our Services
          </span>
          <h1
            id="services-title"
            className="font-heading font-bold text-4xl sm:text-5xl lg:text-6xl mb-6 leading-tight"
          >
            Our Transportation Services
          </h1>
          <p className="text-lg sm:text-xl text-primary-100 mb-8 max-w-3xl mx-auto leading-relaxed">
            Choose from self-drive car rental, chauffeur service, airport transfers,
            corporate transportation, intercity travel, family travel, event
            transportation, and commercial vehicle rental — book online or contact
            our team to plan your trip.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
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
              serviceName="General Services"
              size="xl"
              label="Discuss on WhatsApp"
              ariaLabel="Discuss our transportation services on WhatsApp"
            />
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24" aria-labelledby="services-grid-title">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2
              id="services-grid-title"
              className="font-heading font-bold text-3xl sm:text-4xl text-gray-900 dark:text-white mb-4"
            >
              Services We Offer
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Select a service to see the full details, vehicle options, and how to
              book it.
            </p>
          </div>

          {services.length === 0 ? (
            <div
              className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-10 sm:p-14 text-center"
              role="status"
            >
              <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center mx-auto mb-5">
                <ListChecks className="w-7 h-7 text-primary-600 dark:text-primary-400" aria-hidden="true" />
              </div>
              <h3 className="font-heading font-semibold text-xl text-gray-900 dark:text-white mb-3">
                Our service list is being updated
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-lg mx-auto">
                Services are not listed right now. You can still browse the vehicles
                available for rent, or contact our team directly to discuss your
                transportation needs.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild>
                  <Link href="/vehicles">Browse Vehicles</Link>
                </Button>
                <WhatsAppButton
                  serviceName="General Services"
                  label="Contact on WhatsApp"
                  ariaLabel="Contact us on WhatsApp"
                />
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.map((service) => (
                  <ServiceCard key={service.slug} service={service} />
                ))}
              </div>

              <div className="mt-16 text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Need a custom transportation solution? Our team can tailor services
                  to your specific requirements.
                </p>
                <WhatsAppButton
                  serviceName="Custom Transportation"
                  size="lg"
                  label="Discuss on WhatsApp"
                  ariaLabel="Discuss a custom transportation solution on WhatsApp"
                />
              </div>
            </>
          )}
        </div>
      </section>

      <section
        className="py-16 sm:py-24 bg-gray-50 dark:bg-gray-900/50"
        aria-labelledby="why-choose-title"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2
              id="why-choose-title"
              className="font-heading font-bold text-3xl sm:text-4xl text-gray-900 dark:text-white mb-4"
            >
              Why Choose Awan Rental Service?
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {WHY_CHOOSE.map((item) => (
              <div key={item.title} className="text-center p-6">
                <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-8 h-8 text-primary-600 dark:text-primary-400" aria-hidden="true" />
                </div>
                <h3 className="font-heading font-semibold text-xl text-gray-900 dark:text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <WhatsAppFloat serviceName="General Services" />
    </Layout>
  );
}
