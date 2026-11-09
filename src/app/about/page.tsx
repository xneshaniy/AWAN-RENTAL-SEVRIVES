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
import Image from 'next/image';

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
      'Cars and rides planned around how you actually travel — simple and hassle-free.',
  },
  {
    icon: Repeat,
    title: 'Flexible Rental Options',
    description:
      'Rent for a day, a week or a month — short city trips or long drives, your choice.',
  },
  {
    icon: Route,
    title: 'Ground Transportation',
    description:
      'Rent a car and move around Pakistan easily. That is what we do.',
  },
  {
    icon: Headphones,
    title: 'Friendly Support',
    description:
      'Got a question? Call or WhatsApp us any time, anywhere in Pakistan.',
  },
  {
    icon: Car,
    title: 'Vehicle Variety',
    description:
      'Cars, mini-vans, pickups and commercial vehicles — the right ride for your trip.',
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
        className="relative py-20 sm:py-32 bg-gradient-to-b from-primary via-primary/90 to-secondary-900 text-white overflow-hidden"
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
              <div className="max-w-lg text-lg">
                <p className="text-secondary-200 mb-6 leading-relaxed">
                  Awan Rental Service is a car-rental and transport company serving all of
                  Pakistan. We help executives, tourists, families and businesses get the
                  car they need — simply and quickly.
                </p>
                <p className="text-secondary-200 mb-6 leading-relaxed">
                  Cars, mini-vans, pickups and commercial vehicles — all available for rent,
                  and we fit the car to your trip. Book online or just call us, anytime.
                </p>
                <p className="text-secondary-200 leading-relaxed">
                  Awan Rental provides unique opportunities with innovative technology in car
                  rental services for executives and corporate travelers in Islamabad, Pakistan.
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-secondary-800">
                <Image
                  src="/hero.jpg"
                  alt="Awan Rental Service vehicle ready for a journey in Pakistan"
                  fill
                  priority
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover opacity-90"
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
              className="font-heading font-bold text-3xl sm:text-4xl text-foreground mb-4"
            >
              What We Stand For
            </h2>
            <p className="text-lg text-muted-foreground">
              The way we work, described in plain terms.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PILLARS.map((pillar) => (
              <Card key={pillar.title} variant="default" padding="lg" hover className="h-full">
                <CardHeader>
                  <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                    <pillar.icon
                      className="w-7 h-7 text-primary group-hover:text-accent-foreground"
                      aria-hidden="true"
                    />
                  </div>
                  <CardTitle>{pillar.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{pillar.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Primary calls to action. */}
      <section
        className="py-16 sm:py-24 bg-gradient-to-r from-primary to-accent text-white"
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
              className="inline-flex items-center justify-center rounded-xl bg-white px-8 py-3.5 text-lg font-semibold text-primary transition-colors hover:bg-primary/90"
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
