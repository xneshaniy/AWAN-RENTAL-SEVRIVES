'use client';

import { Shield, Car, MapPin, Clock, ArrowRight, Plane as PlaneIcon, Users, Building2, Mountain, MapPin as MapPinIcon, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
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

const HOW_IT_WORKS_STEPS = [
  { number: '01', title: 'Choose Your Vehicle', description: 'Browse our fleet and select the perfect vehicle for your journey.' },
  { number: '02', title: 'Select Your Rental', description: 'Choose self-drive, chauffeur, airport transfer, or corporate service.' },
  { number: '03', title: 'Submit Your Details', description: 'Provide your travel dates, locations, and contact information.' },
  { number: '04', title: 'Confirm Your Booking', description: 'Receive confirmation on WhatsApp and start your journey.' },
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
                <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary-600 group-hover:text-white transition-colors">
                  <service.icon className="w-7 h-7 text-primary-600 dark:text-primary-400 group-hover:text-white" aria-hidden="true" />
                </div>
                <CardTitle className="text-xl">{service.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400 mb-6">{service.description}</p>
                <Button variant="outline" fullWidth asChild className="group">
                  <Link href={`/${service.slug}`}>
                    Learn More
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
    <section className="py-16 sm:py-24 bg-gray-50 dark:bg-gray-900/50" aria-labelledby="trust-title">
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
              <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                <point.icon className="w-7 h-7 text-primary-600 dark:text-primary-400" aria-hidden="true" />
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

export function SectionHowItWorks() {
  return (
    <section className="py-16 sm:py-24" aria-labelledby="how-title">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 id="how-title" className="font-heading font-bold text-3xl sm:text-4xl text-gray-900 dark:text-white mb-4">
            How It Works
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Simple steps to get you on the road quickly and hassle-free.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {HOW_IT_WORKS_STEPS.map((step, index) => (
            <div key={index} className="relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-2xl z-10">
                {step.number}
              </div>
              <Card variant="outlined" padding="lg" className="pt-12 h-full text-center">
                <h3 className="font-heading font-semibold text-lg text-gray-900 dark:text-white mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {step.description}
                </p>
              </Card>
              {index < HOW_IT_WORKS_STEPS.length - 1 && (
                <div className="hidden lg:block absolute top-3 left-[50%] w-full h-0.5 bg-gray-200 dark:bg-gray-700 -z-10" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function SectionPakistanVisitor({ businessInfo }: { businessInfo?: { companyWhatsApp?: string } }) {
  return (
    <section className="py-16 sm:py-24 bg-gray-900 text-white relative overflow-hidden" aria-labelledby="pakistan-title">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" />
      <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-30" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white text-sm font-medium mb-6">
              <PlaneIcon className="w-4 h-4" />
              Visiting Pakistan Soon?
            </span>
            <h2 id="pakistan-title" className="font-heading font-bold text-3xl sm:text-4xl lg:text-5xl text-white mb-6">
              Make Your Journey Easier with Reliable Transportation
            </h2>
            <p className="text-lg text-gray-300 leading-relaxed mb-8 max-w-xl">
              Whether you&apos;re arriving for business, tourism, family travel, or an extended stay, choose from self-drive rentals, chauffeur-driven vehicles, airport transfers, and corporate transportation.
            </p>
            <div className="flex flex-wrap gap-3 mb-8">
              {PAKISTAN_DESTINATIONS.slice(0, 4).map((dest) => (
                <span key={dest.name} className="px-3 py-1.5 bg-white/10 rounded-full text-sm border border-white/20">
                  {dest.name}
                </span>
              ))}
            </div>
            <div className="flex gap-4">
              <WhatsAppButton
                message={generateGeneralWhatsAppMessage('I am visiting Pakistan and need transportation.')}
                size="lg"
                variant="primary"
                className="group"
                icon={<PlaneIcon className="w-5 h-5" aria-hidden="true" />}
                label="Plan Your Ride"
              />
              <Link href="/vehicles" className="inline-flex items-center justify-center px-6 py-3 rounded-xl border-2 border-white/30 text-white hover:bg-white/10 transition-colors text-lg font-medium group">
                View Vehicles
                <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {PAKISTAN_DESTINATIONS.map((dest, index) => (
              <Card key={dest.name} variant="outlined" padding="md" className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
                <dest.icon className="w-6 h-6 text-primary-400 mb-2" aria-hidden="true" />
                <h3 className="font-semibold text-white">{dest.name}</h3>
                <p className="text-xs text-gray-400 mt-1">{dest.description}</p>
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
    <section className="py-16 sm:py-24 bg-primary-600 text-white" aria-labelledby="cta-title">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 id="cta-title" className="font-heading font-bold text-3xl sm:text-4xl mb-4">
          Ready to Start Your Journey?
        </h2>
        <p className="text-lg text-primary-100 mb-8 max-w-2xl mx-auto">
          Book your vehicle today and experience the comfort and reliability of Awan Rental Service.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <WhatsAppButton
            size="lg"
            variant="secondary"
            className="group"
            label="Book on WhatsApp"
            icon={<MessageCircle className="w-5 h-5" aria-hidden="true" />}
          />
          <Link href="/vehicles" className="inline-flex items-center justify-center px-6 py-3 rounded-xl border-2 border-white/30 text-white hover:bg-white/10 transition-colors text-lg font-medium group">
            Explore Vehicles
            <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
        {businessInfo?.companyPhone && (
          <p className="mt-6 text-primary-200 text-sm">
            Or call us at{' '}
            <a href={`tel:${businessInfo.companyPhone}`} className="font-medium underline hover:text-white">
              {businessInfo.companyPhone}
            </a>
          </p>
        )}
      </div>
    </section>
  );
}