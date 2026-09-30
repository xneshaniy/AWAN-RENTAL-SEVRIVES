import { Metadata } from 'next';
import { getBusinessInfo } from '@/lib/settings';
import { Layout } from '@/components/layout/Layout';
import { WhatsAppFloat } from '@/components/common/WhatsAppFloat';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import {
  Users,
  Repeat,
  Route,
  Headphones,
  Car,
  Plane,
  Building2,
} from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About Us',
  description:
    "Awan Rental Service is a rent-a-car service company and a proven leader in Pakistan's ground transportation industry, providing car rental and transportation solutions for executives, corporate travelers, tourists and families across Pakistan.",
  alternates: { canonical: '/about' },
  openGraph: {
    title: 'About Awan Rental Service',
    description:
      "A rent-a-car service company and proven leader in Pakistan's ground transportation industry.",
    url: '/about',
    type: 'article',
  },
};

/**
 * The six pillars below each restate facts from the approved company
 * description only. No awards, certifications, years in business, fleet
 * sizes, client counts or other invented claims may be added here.
 */
const PILLARS = [
  {
    icon: Users,
    title: 'Customer-Focused Service',
    description:
      'Our high-quality service is specially tailored to suit your specific travel needs, so every journey is planned around the way you actually travel.',
  },
  {
    icon: Repeat,
    title: 'Flexible Rental Options',
    description:
      'Dedicated reservations offer convenient service for the trip you have in mind - whether that is a short city run or a longer engagement across Pakistan.',
  },
  {
    icon: Route,
    title: 'Ground Transportation',
    description:
      "Awan Rental Service is a rent-a-car service company and a proven leader in Pakistan's ground transportation industry, moving people and plans forward on the ground.",
  },
  {
    icon: Headphones,
    title: 'Professional Support',
    description:
      'Reservations and questions are handled by a professional team, offering convenient service anytime and anywhere in Pakistan.',
  },
  {
    icon: Car,
    title: 'Vehicle Variety',
    description:
      'We offer a wide range of vehicles including cars, mini-vans, pickups, and commercial vehicles for rent, so the vehicle fits the purpose of your trip.',
  },
  {
    icon: Plane,
    title: 'Travel Convenience',
    description:
      'Car rental and transportation solutions for executives, corporate travelers, tourists, families, and customers across Pakistan - arranged before you travel and ready when you arrive.',
  },
];

export default async function AboutPage() {
  const businessInfo = await getBusinessInfo();

  return (
    <Layout businessInfo={businessInfo}>
      {/* Hero: the approved company description, verbatim. */}
      <section
        className="relative py-20 sm:py-32 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden"
        aria-labelledby="about-title"
      >
        <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-50" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white text-sm font-medium mb-6">
                <Building2 className="w-4 h-4" aria-hidden="true" />
                About Us
              </span>
              <h1
                id="about-title"
                className="font-heading font-bold text-4xl sm:text-5xl lg:text-6xl mb-6 leading-tight"
              >
                About Awan Rental Service
              </h1>
              <div className="prose prose-invert max-w-none text-lg">
                <p className="text-gray-300 mb-6 leading-relaxed">
                  Awan Rental Service is a rent-a-car service company and a proven leader in
                  Pakistan&apos;s ground transportation industry. Awan Rental provides car rental
                  and transportation solutions for executives, corporate travelers, tourists,
                  families, and customers across Pakistan.
                </p>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  We offer a wide range of vehicles including cars, mini-vans, pickups, and
                  commercial vehicles for rent. Our high-quality service is specially tailored to
                  suit your specific travel needs, with dedicated reservations offering convenient
                  service anytime, anywhere in Pakistan.
                </p>
                <p className="text-gray-300 leading-relaxed">
                  Awan Rental provides unique opportunities with innovative technology in car
                  rental services for executives and corporate travelers in Islamabad, Pakistan.
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-gray-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/hero.jpg"
                  alt="Awan Rental Service vehicle ready for a journey in Pakistan"
                  className="w-full h-full object-cover opacity-90"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The six required sections, each restating the approved description. */}
      <section className="py-16 sm:py-24" aria-labelledby="pillars-title">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2
              id="pillars-title"
              className="font-heading font-bold text-3xl sm:text-4xl text-gray-900 dark:text-white mb-4"
            >
              What We Stand For
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              The way we work, described in plain terms.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PILLARS.map((pillar) => (
              <Card key={pillar.title} variant="default" padding="lg" hover className="h-full">
                <CardHeader>
                  <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center mb-4">
                    <pillar.icon
                      className="w-7 h-7 text-primary-600 dark:text-primary-400"
                      aria-hidden="true"
                    />
                  </div>
                  <CardTitle>{pillar.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-400">{pillar.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Primary calls to action. */}
      <section
        className="py-16 sm:py-24 bg-primary-600 text-white"
        aria-labelledby="about-cta-title"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2
            id="about-cta-title"
            className="font-heading font-bold text-3xl sm:text-4xl mb-4"
          >
            Ready When You Are
          </h2>
          <p className="text-lg text-primary-100 mb-8 max-w-2xl mx-auto">
            Book your vehicle online, or get in touch and we will help you plan the trip.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/booking"
              className="inline-flex items-center justify-center rounded-xl bg-white px-8 py-3.5 text-lg font-semibold text-primary-700 transition-colors hover:bg-gray-100"
            >
              Book a Car
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-xl border-2 border-white/60 px-8 py-3.5 text-lg font-semibold text-white transition-colors hover:bg-white/10"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      <WhatsAppFloat />
    </Layout>
  );
}
