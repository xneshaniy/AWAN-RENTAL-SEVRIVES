import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Car } from 'lucide-react';
import { getBusinessInfo } from '@/lib/settings';
import { getFeaturedVehicles } from '@/actions/vehicle';
import { Hero } from '@/components/common/Hero';
import { VehicleCarousel } from '@/components/vehicles/VehicleCard';
import { WhatsAppFloat } from '@/components/common/WhatsAppFloat';
import { GoogleReviews } from '@/components/common/GoogleReviews';
import { Layout } from '@/components/layout/Layout';
import { getSiteMedia } from '@/lib/site-media';
import { SectionTrust, SectionShowcase, SectionServices, SectionHowItWorks, SectionPakistanVisitor, SectionCTA, SectionTestimonials } from './_components/HomeSections';

export const metadata: Metadata = {
  title: 'Car Rental & Transportation in Pakistan',
  description:
    'Professional car rental and ground transportation services in Islamabad, Rawalpindi, Lahore and nationwide Pakistan. Self-drive, chauffeur, airport transfers, and corporate travel.',
  alternates: { canonical: '/' },
};

function FeaturedVehiclesFallback() {
  return (
    <section className="py-16 sm:py-24" aria-labelledby="featured-title">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Car className="w-4 h-4" aria-hidden="true" />
            Featured Vehicles
          </span>
          <h2 id="featured-title" className="font-heading font-bold text-3xl sm:text-4xl text-foreground mb-4">
            Explore Our Fleet
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Browse the full range of vehicles available for self-drive, chauffeur service, airport transfers, and corporate travel.
          </p>
          <Link
            href="/vehicles"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-medium transition-colors group"
          >
            View All Vehicles
            <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default async function HomePage() {
  const [businessInfo, featuredVehicles, showcaseMedia] = await Promise.all([
    getBusinessInfo(),
    getFeaturedVehicles(8),
    getSiteMedia('homepage_showcase'),
  ]);

  return (
    <Layout businessInfo={businessInfo}>
      <Hero businessInfo={businessInfo} />

      {/* 1. Auto-play showcase (admin-managed media, above the trust section) */}
      <SectionShowcase media={showcaseMedia} />

      {/* 2. Trust */}
      <SectionTrust />

      {/* 2. Featured vehicles (from database) */}
      {featuredVehicles.length > 0 ? (
        <VehicleCarousel
          vehicles={featuredVehicles}
          title="Featured Vehicles"
          subtitle="Handpicked for Your Journey"
          viewAllHref="/vehicles"
        />
      ) : (
        <FeaturedVehiclesFallback />
      )}

      {/* 3. Services */}
      <SectionServices />

      {/* 4. Visiting Pakistan */}
      <SectionPakistanVisitor businessInfo={businessInfo} />

      {/* 5. How it works */}
      <SectionHowItWorks />

      {/* 6. Testimonials */}
      <SectionTestimonials />

      {/* 7. Live Google reviews (server-fetched; hides itself when unconfigured) */}
      <GoogleReviews fallbackMapsUrl={businessInfo.googleMapsUrl} />

      {/* 7. Final CTA */}
      <SectionCTA businessInfo={businessInfo} />

      <WhatsAppFloat />
    </Layout>
  );
}
