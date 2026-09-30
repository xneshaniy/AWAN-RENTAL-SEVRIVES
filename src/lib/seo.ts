import { SITE_NAME, SITE_URL, WHATSAPP_NUMBER } from '@/config/site';

/**
 * True when the city is listed in the `service_areas` business setting.
 * Landing pages must not claim to serve a city that is not enabled there —
 * call this before rendering any "areas we serve" style copy.
 */
export function servesCity(serviceAreas: string[], city: string): boolean {
  const needle = city.trim().toLowerCase();
  return serviceAreas.some((area) => area.trim().toLowerCase() === needle);
}

/** Shape returned by `getBusinessInfo()` — only real SiteSettings values. */
export interface StructuredDataBusiness {
  companyName: string;
  companyPhone: string;
  companyWhatsApp: string;
  companyEmail: string;
  companyAddress: string;
  googleMapsUrl: string;
  businessHours: string;
  serviceAreas: string[];
  social: { facebook: string; instagram: string; linkedin: string };
}

/**
 * Site-wide JSON-LD graph: Organization, WebSite and a combined
 * LocalBusiness + AutoRental node.
 *
 * Every field comes from real SiteSettings / environment configuration.
 * Ratings, reviews, prices, founding dates, awards and other unverifiable
 * claims are deliberately never emitted.
 */
export function buildStructuredDataGraph(business: StructuredDataBusiness) {
  const sameAs = [
    SITE_URL,
    business.social.facebook,
    business.social.instagram,
    business.social.linkedin,
  ].filter(Boolean);

  const contactFields = {
    ...(business.companyPhone ? { telephone: business.companyPhone } : {}),
    ...(business.companyEmail ? { email: business.companyEmail } : {}),
  };

  const organization = {
    '@type': 'Organization',
    name: business.companyName || SITE_NAME,
    url: SITE_URL,
    ...contactFields,
    sameAs,
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer service',
        ...contactFields,
        availableLanguage: ['English'],
      },
      // Only present when NEXT_PUBLIC_WHATSAPP_NUMBER is configured.
      ...(WHATSAPP_NUMBER
        ? [
            {
              '@type': 'ContactPoint',
              contactType: 'customer service',
              contactOption: 'WhatsApp',
              url: `https://wa.me/${WHATSAPP_NUMBER}`,
            },
          ]
        : []),
    ],
  };

  const website = {
    '@type': 'WebSite',
    name: business.companyName || SITE_NAME,
    url: SITE_URL,
  };

  // One node carrying both types: a car rental business IS a LocalBusiness
  // of type AutoRental.
  const businessNode = {
    '@type': ['LocalBusiness', 'AutoRental'],
    name: business.companyName || SITE_NAME,
    url: SITE_URL,
    ...contactFields,
    ...(business.companyAddress
      ? { address: { '@type': 'PostalAddress', streetAddress: business.companyAddress } }
      : {}),
    ...(business.googleMapsUrl ? { hasMap: business.googleMapsUrl } : {}),
    ...(business.serviceAreas.length > 0
      ? { areaServed: business.serviceAreas.map((area) => ({ '@type': 'City', name: area })) }
      : {}),
  };

  return {
    '@context': 'https://schema.org',
    '@graph': [organization, website, businessNode],
  };
}
