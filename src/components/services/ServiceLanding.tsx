import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CheckCircle, ChevronRight } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { WhatsAppFloat } from '@/components/common/WhatsAppFloat';
import { WhatsAppButton } from '@/components/common/WhatsAppButton';
import { VehicleCarousel } from '@/components/vehicles/VehicleCard';
import { Button } from '@/components/ui/Button';
import { getBusinessInfo } from '@/lib/settings';
import { getServiceBySlug } from '@/actions/settings';
import { getVehicles } from '@/actions/vehicle';
import { getServiceIcon } from '@/lib/services';
import { SITE_NAME, SITE_URL } from '@/config/site';
import type { VehicleDTO } from '@/types';

interface ServiceLandingProps {
  /** Slug of the Service record (`service_<slug>` in the database). */
  slug: string;
  /** Page headline. */
  headline: string;
  /** Label used in WhatsApp enquiry messages. */
  whatsappLabel: string;
  /** Heading for the service's feature list (rendered from the database record). */
  featuresTitle: string;
  featuresIntro: string;
  /** Heading for the "what to share when booking" checklist. */
  checklistTitle: string;
  checklistIntro: string;
  checklist: string[];
  /** Closing call-to-action card. */
  ctaTitle: string;
  ctaText: string;
  /** Vehicle categories to feature; omit to show every available vehicle. */
  vehicleCategories?: string[];
  vehicleTitle: string;
}

/**
 * Shared landing-page layout for individual services. The service's own
 * content (name, description, icon, features) is read from the database, so
 * it stays editable through the admin later. Page-specific copy is passed in
 * by each route.
 */
export async function ServiceLanding({
  slug,
  headline,
  whatsappLabel,
  featuresTitle,
  featuresIntro,
  checklistTitle,
  checklistIntro,
  checklist,
  ctaTitle,
  ctaText,
  vehicleCategories,
  vehicleTitle,
}: ServiceLandingProps) {
  // Renders even if the service is deactivated — only the /services listing
  // filters on `active`, so existing links keep working.
  const service = await getServiceBySlug(slug);
  if (!service) notFound();

  const [businessInfo, vehiclesData] = await Promise.all([
    getBusinessInfo(),
    getVehicles({ isAvailable: true, limit: 12 }),
  ]);

  const vehicles: VehicleDTO[] = vehicleCategories
    ? vehiclesData.data.filter((vehicle: VehicleDTO) => vehicleCategories.includes(vehicle.category))
    : vehiclesData.data;

  const Icon = getServiceIcon(service.icon);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: headline,
    serviceType: service.name,
    description: service.description || undefined,
    url: `${SITE_URL}/${slug}`,
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

      <section
        className="relative py-16 sm:py-24 lg:py-32 bg-gradient-to-b from-primary-600 via-primary-700 to-primary-900 text-white overflow-hidden"
        aria-labelledby="service-title"
      >
        <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-50" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white text-sm font-medium mb-6">
            <Icon className="w-4 h-4" aria-hidden="true" />
            {service.name}
          </span>
          <h1
            id="service-title"
            className="font-heading font-bold text-4xl sm:text-5xl lg:text-6xl mb-6 leading-tight"
          >
            {headline}
          </h1>
          {service.description && (
            <p className="text-lg sm:text-xl text-primary-100 mb-8 max-w-3xl mx-auto leading-relaxed">
              {service.description}
            </p>
          )}
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
              serviceName={whatsappLabel}
              size="xl"
              label="Enquire on WhatsApp"
              ariaLabel={`Enquire about ${whatsappLabel} on WhatsApp`}
            />
          </div>
        </div>
      </section>

      {service.features.length > 0 && (
        <section className="py-16 sm:py-24" aria-labelledby="features-title">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2
                id="features-title"
                className="font-heading font-bold text-3xl sm:text-4xl text-gray-900 dark:text-white mb-4"
              >
                {featuresTitle}
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">{featuresIntro}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {service.features.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 h-full"
                >
                  <div className="w-11 h-11 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center mb-4">
                    <CheckCircle className="w-6 h-6 text-primary-600 dark:text-primary-400" aria-hidden="true" />
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

      <section
        className="py-16 sm:py-24 bg-gray-50 dark:bg-gray-900/50"
        aria-labelledby="checklist-title"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <h2
                id="checklist-title"
                className="font-heading font-bold text-3xl sm:text-4xl text-gray-900 dark:text-white mb-6"
              >
                {checklistTitle}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8">{checklistIntro}</p>
              <ul className="space-y-4" role="list">
                {checklist.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex-shrink-0 w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-primary-600 dark:text-primary-400" aria-hidden="true" />
                    </div>
                    <p className="text-gray-700 dark:text-gray-300">{item}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 lg:sticky lg:top-28">
              <h3 className="font-heading font-semibold text-xl text-gray-900 dark:text-white mb-4">
                {ctaTitle}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">{ctaText}</p>
              <div className="space-y-3">
                <Button size="lg" fullWidth asChild>
                  <Link href="/vehicles">Browse Available Vehicles</Link>
                </Button>
                <WhatsAppButton
                  serviceName={whatsappLabel}
                  size="lg"
                  fullWidth
                  label="Enquire on WhatsApp"
                  ariaLabel={`Enquire about ${whatsappLabel} on WhatsApp`}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <VehicleCarousel
        vehicles={vehicles}
        title={vehicleTitle}
        viewAllHref="/vehicles"
      />

      <WhatsAppFloat serviceName={whatsappLabel} />
    </Layout>
  );
}
