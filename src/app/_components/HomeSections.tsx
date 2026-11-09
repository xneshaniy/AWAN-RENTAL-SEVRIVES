'use client';

import { useEffect, useState } from 'react';
import { Shield, Car, MapPin, Clock, ArrowRight, Plane as PlaneIcon, Users, Building2, Mountain, MapPin as MapPinIcon, MessageCircle, Send, PhoneCall, Route, Check, Sparkles, Star } from 'lucide-react';
import type { SiteMediaItem } from '@/lib/site-media';
import { displayImageUrl, videoPosterUrl } from '@/lib/site-media';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Image from 'next/image';
import Link from 'next/link';
import { generateGeneralWhatsAppMessage } from '@/lib/whatsapp';
import { WhatsAppButton } from '@/components/common/WhatsAppButton';

const TRUST_POINTS = [
  { icon: Car, title: 'Many Cars to Choose', description: 'Economy cars, SUVs, vans, coasters — we have what you need.' },
  { icon: Shield, title: 'Good Service, Every Time', description: 'Clean cars, polite staff, on time. Simple and stress-free.' },
  { icon: MapPin, title: 'All Across Pakistan', description: 'Islamabad, Rawalpindi, Lahore and beyond — anywhere you need.' },
  { icon: Clock, title: 'Rent for a Day or a Month', description: 'Daily, weekly or monthly — as long as your trip needs.' },
  { icon: Users, title: 'Airport & Business Rides', description: 'Airport pick-ups and company travel, handled smoothly.' },
];

const HOW_IT_WORKS_STEPS = [
  { number: '01', icon: Car, title: 'Pick a Car', description: 'Look through our cars and choose the one you like.', accentColor: 'bg-primary' },
  { number: '02', icon: Send, title: 'Send a Request', description: 'Tell us your dates and pick your ride — a few simple fields.', accentColor: 'bg-accent/10 text-accent-foreground' },
  { number: '03', icon: PhoneCall, title: 'We Call You', description: 'We confirm the price, car and pickup details over the phone.', accentColor: 'bg-accent/10 text-accent-foreground' },
  { number: '04', icon: Route, title: 'Enjoy Your Ride', description: 'Get the car (or keep the driver) and enjoy the journey.', accentColor: 'bg-primary' },
];

const PAKISTAN_DESTINATIONS = [
  { name: 'Islamabad', description: 'Clean, modern, easy to drive', icon: Building2 },
  { name: 'Rawalpindi', description: 'Historic old city, 40 minutes from Islamabad', icon: MapPinIcon },
  { name: 'Lahore', description: 'Food, history and shopping', icon: Building2 },
  { name: 'Murree', description: 'Hill station — cool and beautiful', icon: Mountain },
  { name: 'Nathiagali', description: 'Scenic mountain town', icon: Mountain },
  { name: 'Northern Areas', description: 'Hunza, Skardu, Gilgit — breathtaking views', icon: Mountain },
];

const SERVICES = [
  { slug: 'self-drive', title: 'Self Drive Car Rental', description: 'Drive it yourself. Fresh cars, daily or monthly rates, and flexible pickup.', icon: Car },
  { slug: 'chauffeur-service', title: 'Chauffeur Service', description: 'We send a driver with the car. You sit back and enjoy the trip.', icon: Users },
  { slug: 'airport-transfers', title: 'Airport Transfers', description: 'Pick-up and drop at the airport. On time, every time.', icon: PlaneIcon },
  { slug: 'corporate-travel', title: 'Corporate Travel', description: 'Daily rides for companies, meetings and events — we handle the transport.', icon: Building2 },
];

const TESTIMONIALS = [
  { name: 'Ahmed Khan', role: 'Business Traveler', company: 'Lahore, Pakistan', rating: 5, content: 'Exceptional service from Awan Rental Service. The chauffeur was professional, punctual, and the vehicle was immaculate. Highly recommended for corporate travel in Pakistan.', initials: 'AK' },
  { name: 'Sarah Malik', role: 'Tourist', company: 'Islamabad, Pakistan', rating: 5, content: 'Rented a self-drive SUV for our family trip to Murree. The booking process was seamless and the car was in perfect condition. Will definitely use again.', initials: 'SM' },
  { name: 'Mohammad Ali', role: 'Executive', company: 'Rawalpindi, Pakistan', rating: 5, content: 'Airport transfer service was outstanding. Driver met us on time, helped with luggage, and drove safely. The best rental experience in Pakistan.', initials: 'MA' },
];

export function SectionServices() {
  return (
    <section className="py-16 sm:py-24" aria-labelledby="services-title">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 id="services-title" className="font-heading font-bold text-3xl sm:text-4xl text-foreground mb-4">
            What We Do
          </h2>
          <p className="text-lg text-muted-foreground">
            Simple car rental and rides for every kind of trip.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SERVICES.map((service, index) => (
            <Card key={index} variant="default" padding="lg" hover className="h-full group">
              <CardHeader>
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                  <service.icon className="w-7 h-7 text-primary group-hover:text-accent-foreground" aria-hidden="true" />
                </div>
                <CardTitle className="text-xl">{service.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6">{service.description}</p>
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

export function SectionShowcase({ media }: { media: SiteMediaItem[] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const visible = media.filter((item) => Boolean(item.url));
  const count = visible.length;
  const safeActive = count > 0 ? active % count : 0;

  useEffect(() => {
    if (paused || count < 2) return;
    const timer = setInterval(() => {
      setActive((current) => (count === 0 ? 0 : (current + 1) % count));
    }, 6000);
    return () => clearInterval(timer);
  }, [paused, count]);

  // Nothing to show yet - the admin populates this from the Homepage
  // Showcase media manager.
  if (count === 0) return null;

  return (
    <section
      className="relative overflow-hidden bg-secondary-900 text-white h-[440px] sm:h-[520px] lg:h-[620px]"
      aria-label="Awan Rental Service showcase"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {visible.map((item, index) => {
        const isCurrent = index === safeActive;
        const poster = item.type === 'video' ? videoPosterUrl(item.url, 1200) : null;
        return (
          <div
            key={item.id}
            className={`absolute inset-0 transition-opacity duration-[1200ms] ease-in-out ${
              isCurrent ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
            aria-hidden={!isCurrent}
          >
            {item.type === 'video' ? (
              <video
                src={item.url}
                poster={poster ?? undefined}
                muted
                playsInline
                loop
                autoPlay={isCurrent}
                preload="metadata"
                className="absolute inset-0 h-full w-full object-cover"
                aria-hidden="true"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={displayImageUrl(item.url, 1600)}
                alt={item.caption?.trim() || 'Awan Rental Service'}
                className={`absolute inset-0 h-full w-full object-cover transition-transform duration-[6000ms] ease-out ${
                  isCurrent ? 'scale-105' : 'scale-100'
                }`}
              />
            )}
          </div>
        );
      })}

      {/* Slide indicators */}
      <div className="absolute bottom-5 right-5 sm:bottom-8 sm:right-8 z-20 flex items-center gap-2.5">
        {visible.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActive(index)}
            aria-label={`Show slide ${index + 1}${item.caption ? `: ${item.caption}` : ''}`}
            aria-current={index === safeActive}
            className={`h-2.5 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white ${
              index === safeActive ? 'w-8 bg-accent-500' : 'w-2.5 bg-white/50 hover:bg-white/80'
            }`}
          />
        ))}
      </div>
    </section>
  );
}

export function SectionTrust() {
  return (
    <section className="py-16 sm:py-24 bg-secondary-50 dark:bg-secondary-900/30 border-y border-border" aria-labelledby="trust-title">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] text-primary-700 dark:text-primary-300 mb-4">
            <span className="h-px w-8 bg-accent-500" aria-hidden="true" />
            Why Travel With Us
            <span className="h-px w-8 bg-accent-500" aria-hidden="true" />
          </span>
          <h2 id="trust-title" className="font-heading font-bold text-3xl sm:text-4xl lg:text-5xl text-primary-900 dark:text-white mb-5 leading-tight">
            Your Journey, Our Responsibility
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Good cars and honest service — every time, every trip.
          </p>
          <div className="mx-auto mt-6 h-1 w-24 rounded-full bg-accent-500" aria-hidden="true" />
        </div>

        {/* Trust points */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 lg:gap-6">
          {TRUST_POINTS.map((point) => (
            <article
              key={point.title}
              className="group flex flex-col items-center text-center rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-accent-500/40"
            >
              <div className="relative w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 transition-colors duration-300 group-hover:bg-accent group-hover:text-accent-foreground text-primary">
                <point.icon className="w-8 h-8" aria-hidden="true" />
              </div>
              <h3 className="font-heading font-semibold text-lg text-foreground mb-2 leading-snug">
                {point.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {point.description}
              </p>
            </article>
          ))}
        </div>

        {/* Service highlights */}
        <div className="mt-12 mx-auto max-w-4xl grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border rounded-2xl border border-border bg-card overflow-hidden">
          {[
            ['8 Services', 'Self-drive to corporate travel'],
            ['Nationwide', 'Islamabad · Rawalpindi · Lahore'],
            ['24/7 Support', 'Roadside assistance & customer care'],
          ].map(([value, label]) => (
            <div key={value} className="flex flex-col items-center justify-center px-4 py-6 text-center">
              <span className="font-heading font-bold text-2xl text-primary-900 dark:text-white">{value}</span>
              <span className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksCard({ step, index }: { step: typeof HOW_IT_WORKS_STEPS[0]; index: number }) {
  return (
    <li key={step.number} className="h-full" style={{ transitionDelay: `${index * 150}ms` }}>
      <Card variant="default" padding="lg" className={`h-full flex flex-col relative overflow-hidden group hover:shadow-xl hover:-translate-y-2 transition-all duration-500 animate-fade-in-up`}>
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: step.accentColor === 'bg-primary' ? 'linear-gradient(135deg, #1e3a8a, #2563eb)' : 'linear-gradient(135deg, #d4af37, #b8860b)' }} aria-hidden="true" />
        <div className="flex items-start justify-between gap-3 mb-5 flex-shrink-0 relative z-10">
          <div className="w-14 h-14 shrink-0 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300" style={{ background: step.accentColor === 'bg-primary' ? 'linear-gradient(135deg, #1e3a8a, #2563eb)' : 'linear-gradient(135deg, #d4af37, #b8860b)', boxShadow: '0 4px 14px 0 rgb(0 0 0 / 0.1)' }} aria-hidden="true">
            <step.icon className="w-7 h-7 text-white drop-shadow-sm" aria-hidden="true" />
          </div>
          <span className="pt-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary flex-shrink-0 bg-white/80 dark:bg-gray-800/80 px-2 py-0.5 rounded-full border border-primary/20">{step.number}</span>
        </div>
        <h3 className="font-heading font-semibold text-lg text-foreground mb-2 flex-shrink-0 group-hover:text-primary transition-colors duration-300">{step.title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed flex-1">{step.description}</p>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: step.accentColor === 'bg-primary' ? 'linear-gradient(135deg, #1e3a8a, #2563eb)' : 'linear-gradient(135deg, #d4af37, #b8860b)' }} aria-hidden="true" />
      </Card>
    </li>
  );
}

export function SectionHowItWorks() {
  return (
    <section className="py-16 sm:py-24 relative" aria-labelledby="how-title">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-16 animate-fade-in-up">
          <h2 id="how-title" className="font-heading font-bold text-3xl sm:text-4xl text-foreground mb-4">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground">Four easy steps — pick a car, tell us your dates, we call you, you ride.</p>
        </div>
        <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          <div className="hidden lg:block absolute top-[70px] left-[4rem] right-[4rem] h-0.5 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20 -z-10" aria-hidden="true">
            <div className="h-full bg-gradient-to-r from-primary to-accent origin-left-1/2 scale-x-0 transition-transform duration-1500 ease-out group-hover/steps:scale-x-100" aria-hidden="true" />
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
    <section className="py-16 sm:py-24 bg-secondary-900 text-white relative overflow-hidden animate-fade-in-up" aria-labelledby="pakistan-title">
      <div className="absolute inset-0 bg-gradient-to-br from-secondary-900 via-secondary-800 to-secondary-900" />
      <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-30" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div className="relative z-10">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white text-sm font-medium mb-6">
              <PlaneIcon className="w-4 h-4" />
              Visiting Pakistan Soon?
            </span>
            <h2 id="pakistan-title" className="font-heading font-bold text-3xl sm:text-4xl lg:text-5xl text-white mb-6 leading-tight">
              Coming to Pakistan? We&apos;ll Give You a Ride
            </h2>
            <p className="text-lg text-secondary-200 leading-relaxed mb-8 max-w-xl">
              Holiday, work or visiting family — self-drive cars, drivers, airport pick-ups and company travel. Easy to arrange.
            </p>
            <div className="flex flex-wrap gap-3 mb-8">
              {PAKISTAN_DESTINATIONS.slice(0, 4).map((dest) => (
                <span key={dest.name} className="px-3 py-1.5 bg-white/10 rounded-full text-sm border border-white/20 hover:bg-white/20 hover:border-white/40 transition-all duration-300 cursor-default">{dest.name}</span>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <WhatsAppButton message={generateGeneralWhatsAppMessage('I am visiting Pakistan and need transportation.')} size="lg" variant="primary" className="group w-full sm:w-auto" icon={<PlaneIcon className="w-5 h-5" aria-hidden="true" />} label="Plan Your Ride" />
              <Link href="/vehicles" className="inline-flex items-center justify-center px-6 py-3 rounded-xl border-2 border-white/30 text-white hover:bg-white/10 transition-colors text-lg font-medium group w-full sm:w-auto">
                View Vehicles <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PAKISTAN_DESTINATIONS.map((dest, index) => (
              <Card key={dest.name} variant="outlined" padding="md" className="bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 h-full group relative overflow-hidden" style={{ transitionDelay: `${index * 100}ms` }}>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" aria-hidden="true" />
                <dest.icon className="w-6 h-6 text-primary mb-2 relative z-10 group-hover:scale-110 transition-transform duration-300" aria-hidden="true" />
                <h3 className="font-semibold text-white relative z-10">{dest.name}</h3>
                <p className="text-xs text-secondary-400 mt-1 relative z-10">{dest.description}</p>
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
    <section className="relative overflow-hidden py-20 sm:py-28 lg:py-32 animate-fade-in-up" aria-labelledby="cta-title">
      <div className="absolute inset-0 z-0" aria-hidden="true">
        <picture>
          <source media="(max-width: 639px)" srcSet="/cta-journey-mobile.jpg" type="image/jpeg" />
          <source media="(max-width: 1023px)" srcSet="/cta-journey-tablet.jpg" type="image/jpeg" />
          <Image src="/cta-journey.jpg" alt="" fill className="object-cover object-center" sizes="(max-width: 639px) 100vw, (max-width: 1023px) 100vw, 100vw" priority={false} />
        </picture>
        <div className="absolute inset-0 bg-gradient-to-b from-secondary-900/90 via-secondary-900/50 to-secondary-900/90" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
      </div>
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="inline-flex items-center px-4 py-1.5 mb-6 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm text-xs sm:text-sm font-medium uppercase tracking-[0.18em] text-white animate-pulse-subtle">
          <Sparkles className="w-3 h-3 mr-1.5" aria-hidden="true" />
          Ready When You Are
        </p>
        <h2 id="cta-title" className="font-heading font-bold text-3xl sm:text-4xl lg:text-5xl text-white mb-5 leading-tight">Ready to Ride?</h2>
        <p className="text-lg sm:text-xl text-secondary-200 leading-relaxed mb-9 max-w-2xl mx-auto">
          Book a car today — for business, family, holidays or your next trip anywhere in Pakistan.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button variant="gold" size="lg" asChild className="group w-full sm:w-auto relative overflow-hidden">
            <Link href="/booking">
              <span className="relative z-10 flex items-center justify-center gap-2">
                Book a Car
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" aria-hidden="true" />
            </Link>
          </Button>
          <WhatsAppButton size="lg" label="WhatsApp Us" icon={<MessageCircle className="w-5 h-5" aria-hidden="true" />} className="w-full sm:w-auto bg-white/10 hover:bg-white/20 border-2 border-white/30 text-white focus:ring-white focus:ring-offset-0 backdrop-blur-sm group relative overflow-hidden" aria-label="Contact us on WhatsApp" />
        </div>
        {businessInfo?.companyPhone && (
          <p className="mt-7 text-secondary-200 text-sm">
            Or call us at{' '}<a href={`tel:${businessInfo.companyPhone}`} className="font-medium text-white underline underline-offset-4 hover:text-accent transition-colors">{businessInfo.companyPhone}</a>
          </p>
        )}
      </div>
    </section>
  );
}

export function SectionTestimonials() {
  return (
    <section className="py-16 sm:py-24" aria-labelledby="testimonials-title">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 id="testimonials-title" className="font-heading font-bold text-3xl sm:text-4xl text-foreground mb-4">
            What Our Customers Say
          </h2>
          <p className="text-lg text-muted-foreground">
            From families, business travellers and tourists who rode with us.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TESTIMONIALS.map((testimonial, index) => (
            <Card key={index} variant="default" padding="lg" hover className="h-full flex flex-col group">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-accent bg-primary-100 font-semibold text-primary-700 dark:bg-primary-900/40 dark:text-primary-300" aria-hidden="true">
                  {testimonial.initials}
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-lg text-foreground">{testimonial.name}</h3>
                  <p className="text-sm text-muted-foreground">{testimonial.role}, {testimonial.company}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-accent mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="w-5 h-5 fill-current" aria-hidden="true" />
                ))}
              </div>
              <p className="text-muted-foreground leading-relaxed mb-6">"{testimonial.content}"</p>
              <div className="mt-auto pt-4 border-t border-border">
                <Badge variant="gold" className="text-xs">Verified Customer</Badge>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}