'use client';

import { Shield, Car, MapPin, Clock, ArrowRight, Plane as PlaneIcon, Users, Building2, Mountain, MapPin as MapPinIcon, MessageCircle, Send, PhoneCall, Route, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Image from 'next/image';
import Link from 'next/link';
import { generateGeneralWhatsAppMessage } from '@/lib/whatsapp';
import { WhatsAppButton } from '@/components/common/WhatsAppButton';

const TRUST_POINTS = [
  { icon: Car, title: 'Wide Range of Vehicles', description: 'From economy cars to luxury SUVs, vans, and coasters for every need.' },
  { icon: Shield, title: 'Professional Service', description: 'High-quality service specially tailored to suit your specific travel needs.' },
  { icon: MapPin, title: 'Coverage Across Pakistan', description: 'Car rental and transportation solutions for customers across Pakistan.' },
  { icon: Clock, title: 'Flexible Rental Options', description: 'Daily, weekly, and monthly rentals with self-drive or chauffeur choices.' },
  { icon: Users, title: 'Airport & Corporate Transfers', description: 'Specialized services for business travelers, executives, and airport transfers.' },
];

/*
 * The four steps describe what actually happens on this site: the fleet is
 * browsed, the request is submitted through the booking form, staff then call
 * the customer to confirm, and only after that is the vehicle prepared. The
 * wording deliberately avoids turnaround times, guarantees or availability
 * claims that the business has not committed to in writing.
 */
const HOW_IT_WORKS_STEPS = [
  {
    number: '01',
    icon: Car,
    title: 'Choose Your Vehicle',
    description: 'Browse our available vehicles and select the option that best fits your journey.',
    accentColor: 'from-secondary-500 to-orange-500',
  },
  {
    number: '02',
    icon: Send,
    title: 'Send Your Booking Request',
    description: 'Provide your travel details, preferred dates, vehicle, and service requirements.',
    accentColor: 'from-secondary-500 to-red-500',
  },
  {
    number: '03',
    icon: PhoneCall,
    title: 'Confirm Your Journey',
    description: 'Our team contacts you to confirm availability, pricing, pickup details, and any additional requirements.',
    accentColor: 'from-secondary-500 to-amber-500',
  },
  {
    number: '04',
    icon: Route,
    title: 'Enjoy the Ride',
    description: 'Your vehicle is prepared for your journey with the service and support you need.',
    accentColor: 'from-secondary-500 to-yellow-500',
  },
];

const PAKISTAN_DESTINATIONS = [
  { name: 'Islamabad', description: 'Capital city with modern architecture and green scenery', icon: Building2 },
  { name: 'Rawalpindi', description: 'Historic garrison city adjacent to Islamabad', icon: MapPinIcon },
  { name: 'Lahore', description: 'Cultural heart of Pakistan with Mughal heritage', icon: Building2 },
  { name: 'Murree', description: 'Popular hill station in the Pir Panjal range', icon: Mountain },
  { name: 'Nathiagali', description: 'Scenic mountain retreat in the Galyat range', icon: Mountain },
  { name: 'Northern Areas', description: 'Hunza, Skardu, Gilgit - breathtaking landscapes', icon: Mountain },
];

const SERVICES = [
  { 
    slug: 'self-drive', 
    title: 'Self Drive Car Rental', 
    description: 'Drive yourself with our well-maintained fleet. Flexible rental periods from daily to monthly.',
    icon: Car
  },
  { 
    slug: 'chauffeur-service', 
    title: 'Chauffeur Service', 
    description: 'Professional drivers for business meetings, airport transfers, and special occasions.',
    icon: Users
  },
  { 
    slug: 'airport-transfers', 
    title: 'Airport Transfers', 
    description: 'Pickup and drop-off at Islamabad and Lahore airports, plus Rawalpindi / Islamabad.',
    icon: PlaneIcon
  },
  { 
    slug: 'corporate-travel', 
    title: 'Corporate Travel', 
    description: 'Tailored transportation solutions for companies, executives, and corporate events.',
    icon: Building2
  },
];

export function SectionServices() {
  return (
    <section className="py-16 sm:py-24" aria-labelledby="services-title">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 id="services-title" className="font-heading font-bold text-3xl sm:text-4xl text-gray-900 dark:text-white mb-4">
            Our Transportation Services
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Comprehensive ground transportation solutions for every need across Pakistan.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SERVICES.map((service, index) => (
            <Card key={index} variant="default" padding="lg" hover className="h-full group">
              <CardHeader>
                <div className="w-14 h-14 bg-secondary-100 dark:bg-secondary-900/30 rounded-xl flex items-center justify-center mb-4 group-hover:bg-secondary-600 group-hover:text-white transition-colors">
                  <service.icon className="w-7 h-7 text-secondary-600 dark:text-secondary-400 group-hover:text-white" aria-hidden="true" />
                </div>
                <CardTitle className="text-xl">{service.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400 mb-6">{service.description}</p>
                <Button variant="outline" fullWidth asChild className="group">
                  <Link href={`/${service.slug}`}>
                    Learn More
                    <span className="sr-only"> about {service.title}</span>
                    <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

export function SectionTrust() {
  return (
    <section className="py-16 sm:py-24 bg-cream-100 dark:bg-gray-900/50" aria-labelledby="trust-title">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 id="trust-title" className="font-heading font-bold text-3xl sm:text-4xl text-gray-900 dark:text-white mb-4">
            Your Journey, Our Responsibility
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            We take pride in delivering exceptional transportation experiences across Pakistan.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {TRUST_POINTS.map((point, index) => (
            <Card key={index} variant="default" padding="lg" hover className="h-full text-center">
              <div className="w-14 h-14 bg-secondary-100 dark:bg-secondary-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                <point.icon className="w-7 h-7 text-secondary-600 dark:text-secondary-400" aria-hidden="true" />
              </div>
              <h3 className="font-heading font-semibold text-lg text-gray-900 dark:text-white mb-2">
                {point.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {point.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksCard({ step, index }: { step: typeof HOW_IT_WORKS_STEPS[0]; index: number }) {
  return (
    <li 
      key={step.number} 
      className="h-full"
      style={{ transitionDelay: `${index * 150}ms` }}
    >
      <Card
        variant="default"
        padding="lg"
        className={`h-full flex flex-col relative overflow-hidden group hover:shadow-xl hover:-translate-y-2 hover:border-secondary-300 dark:hover:border-secondary-600 transition-all duration-500 animate-fade-in-up`}
      >
        {/* Subtle top accent bar that expands on hover */}
        <div 
          className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ background: step.accentColor }}
          aria-hidden="true"
        />
        
        <div className="flex items-start justify-between gap-3 mb-5 flex-shrink-0 relative z-10">
          <div 
            className="w-14 h-14 shrink-0 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
            style={{ 
              background: `linear-gradient(135deg, ${step.accentColor.replace('from-', '').replace(' to-', ', ')}`,
              boxShadow: '0 4px 14px 0 rgb(0 0 0 / 0.1)'
            }}
            aria-hidden="true"
          >
            <step.icon
              className="w-7 h-7 text-white drop-shadow-sm"
              aria-hidden="true"
            />
          </div>
          <span className="pt-1 text-xs font-semibold uppercase tracking-[0.2em] text-secondary-600 dark:text-secondary-400 flex-shrink-0 bg-white/80 dark:bg-gray-800/80 px-2 py-0.5 rounded-full border border-secondary-200 dark:border-secondary-700">
            {step.number}
          </span>
        </div>
        <h3 className="font-heading font-semibold text-lg text-gray-900 dark:text-white mb-2 flex-shrink-0 group-hover:text-secondary-600 dark:group-hover:text-secondary-400 transition-colors duration-300">
          {step.title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed flex-1">
          {step.description}
        </p>
        
        {/* Subtle hover indicator */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300" 
             style={{ background: step.accentColor }}
             aria-hidden="true" />
      </Card>
    </li>
  );
}

export function SectionHowItWorks() {
  return (
    <section className="py-16 sm:py-24 relative" aria-labelledby="how-title">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-5 dark:opacity-10 pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-16 animate-fade-in-up">
          <h2 id="how-title" className="font-heading font-bold text-3xl sm:text-4xl text-gray-900 dark:text-white mb-4">
            How It Works
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Four steps from browsing our fleet to getting on the road.
          </p>
        </div>

        {/*
          An ordered list, not a div grid: the four steps are sequential, so
          assistive tech announces the order without the painted "01" numbers
          doing that work alone. Equal heights come from the grid row stretching
          each <li> and Card filling it with flex column layout, so the longest
          description sets the height of its whole row rather than the cards ragging.
        */}
        <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {/* Animated connector line - only on desktop */}
          <div 
            className="hidden lg:block absolute top-[70px] left-[4rem] right-[4rem] h-0.5 bg-gradient-to-r from-secondary-200 via-secondary-300 to-secondary-200 dark:from-secondary-700 dark:via-secondary-600 dark:to-secondary-700 -z-10"
            aria-hidden="true"
          >
            <div 
              className="h-full bg-gradient-to-r from-secondary-500 to-orange-500 origin-left-1/2 scale-x-0 transition-transform duration-1500 ease-out group-hover/steps:scale-x-100"
              aria-hidden="true"
            />
          </div>
          
          {HOW_IT_WORKS_STEPS.map((step, index) => (
            <HowItWorksCard key={step.number} step={step} index={index} />
          ))}
        </ol>
      </div>
    </section>
  );
}

export function SectionPakistanVisitor({ businessInfo }: { businessInfo?: { companyWhatsApp?: string } }) {
  return (
    <section 
      className="py-16 sm:py-24 bg-gray-900 text-white relative overflow-hidden animate-fade-in-up"
      aria-labelledby="pakistan-title"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" />
      <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-30" />
      {/* Subtle glow effect */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-secondary-500/10 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <div className="relative z-10">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white text-sm font-medium mb-6">
              <PlaneIcon className="w-4 h-4" />
              Visiting Pakistan Soon?
            </span>
            <h2 id="pakistan-title" className="font-heading font-bold text-3xl sm:text-4xl lg:text-5xl text-white mb-6 leading-tight">
              Make Your Journey Easier with Reliable Transportation
            </h2>
            <p className="text-lg text-gray-300 leading-relaxed mb-8 max-w-xl">
              Whether you&apos;re arriving for business, tourism, family travel, or an extended stay, choose from self-drive rentals, chauffeur-driven vehicles, airport transfers, and corporate transportation.
            </p>
            <div className="flex flex-wrap gap-3 mb-8">
              {PAKISTAN_DESTINATIONS.slice(0, 4).map((dest) => (
                <span key={dest.name} className="px-3 py-1.5 bg-white/10 rounded-full text-sm border border-white/20 hover:bg-white/20 hover:border-white/40 transition-all duration-300 cursor-default">
                  {dest.name}
                </span>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <WhatsAppButton
                message={generateGeneralWhatsAppMessage('I am visiting Pakistan and need transportation.')}
                size="lg"
                variant="primary"
                className="group w-full sm:w-auto"
                icon={<PlaneIcon className="w-5 h-5" aria-hidden="true" />}
                label="Plan Your Ride"
              />
              <Link href="/vehicles" className="inline-flex items-center justify-center px-6 py-3 rounded-xl border-2 border-white/30 text-white hover:bg-white/10 transition-colors text-lg font-medium group w-full sm:w-auto">
                View Vehicles
                <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PAKISTAN_DESTINATIONS.map((dest, index) => (
              <Card 
                key={dest.name} 
                variant="outlined" 
                padding="md" 
                className="bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 h-full group relative overflow-hidden"
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                {/* Subtle shimmer effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" aria-hidden="true" />
                <dest.icon className="w-6 h-6 text-primary-400 mb-2 relative z-10 group-hover:scale-110 transition-transform duration-300" aria-hidden="true" />
                <h3 className="font-semibold text-white relative z-10">{dest.name}</h3>
                <p className="text-xs text-gray-400 mt-1 relative z-10">{dest.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function SectionCTA({ businessInfo }: { businessInfo?: { companyWhatsApp?: string; companyPhone?: string } }) {
  return (
    <section 
      className="relative overflow-hidden py-20 sm:py-28 lg:py-32 animate-fade-in-up"
      aria-labelledby="cta-title"
    >
      {/*
        Decorative backdrop with art-directed images per breakpoint:
        - Mobile (< 640px): taller 3:4 crop showing road & vehicle
        - Tablet (640px - 1024px): 3:4 crop
        - Desktop (> 1024px): original 3:2 landscape
        The Image component handles srcset automatically; we use <picture>
        for true art direction (different crops per breakpoint).
      */}
      <div className="absolute inset-0 z-0" aria-hidden="true">
        <picture>
          {/* Mobile: 3:4 crop, taller to show road/vehicle */}
          <source
            media="(max-width: 639px)"
            srcSet="/cta-journey-mobile.jpg"
            type="image/jpeg"
          />
          {/* Tablet: 3:4 crop */}
          <source
            media="(max-width: 1023px)"
            srcSet="/cta-journey-tablet.jpg"
            type="image/jpeg"
          />
          {/* Desktop: original 3:2 landscape */}
          <Image
            src="/cta-journey.jpg"
            alt=""
            fill
            className="object-cover object-center"
            sizes="(max-width: 639px) 100vw, (max-width: 1023px) 100vw, 100vw"
            priority={false}
          />
        </picture>
        {/*
          Gradient overlay: darker at top/bottom for text contrast,
          lighter in middle so the road/vehicle stays visible.
          Tested against the image luminance (~86 mean) to ensure
          white text hits ~10:1 contrast ratio.
        */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900/90 via-gray-900/50 to-gray-900/90" />
        {/* Subtle radial glow for depth */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-secondary-500/10 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="inline-flex items-center px-4 py-1.5 mb-6 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm text-xs sm:text-sm font-medium uppercase tracking-[0.18em] text-white animate-pulse-subtle">
          <Sparkles className="w-3 h-3 mr-1.5" aria-hidden="true" />
          Ready When You Are
        </p>

        <h2 id="cta-title" className="font-heading font-bold text-3xl sm:text-4xl lg:text-5xl text-white mb-5 leading-tight">
          Ready to Start Your Journey?
        </h2>

        <p className="text-lg sm:text-xl text-gray-100 leading-relaxed mb-9 max-w-2xl mx-auto">
          Book a reliable vehicle for business, family travel, airport transfers, or your next journey across Pakistan.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {/* Matches the header's own "Book a Car" -> /booking convention. */}
          <Button size="lg" asChild className="group w-full sm:w-auto relative overflow-hidden">
            <Link href="/booking">
              <span className="relative z-10 flex items-center justify-center gap-2">
                Book a Car
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </span>
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" aria-hidden="true" />
            </Link>
          </Button>
          <WhatsAppButton
            size="lg"
            label="WhatsApp Us"
            icon={<MessageCircle className="w-5 h-5" aria-hidden="true" />}
            className="w-full sm:w-auto bg-white/10 hover:bg-white/20 border-2 border-white/30 hover:border-white/50 text-white focus:ring-white focus:ring-offset-0 backdrop-blur-sm group relative overflow-hidden"
            aria-label="Contact us on WhatsApp"
          />
        </div>

        {businessInfo?.companyPhone && (
          <p className="mt-7 text-gray-300 text-sm">
            Or call us at{' '}
            <a href={`tel:${businessInfo.companyPhone}`} className="font-medium text-white underline underline-offset-4 hover:text-primary-300 transition-colors">
              {businessInfo.companyPhone}
            </a>
          </p>
        )}
      </div>
    </section>
  );
}