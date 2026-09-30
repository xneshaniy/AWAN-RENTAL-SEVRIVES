import { Metadata } from 'next';
import Link from 'next/link';
import { getBusinessInfo } from '@/lib/settings';
import { getVehicles } from '@/actions/vehicle';
import { Layout } from '@/components/layout/Layout';
import { BookingForm } from '@/components/booking/BookingForm';
import { WhatsAppFloat } from '@/components/common/WhatsAppFloat';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MapPin, Calendar, Clock, Shield, CheckCircle, Car, User, MessageCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Book a Car',
  description: 'Book your vehicle rental online. Self-drive, chauffeur service, airport transfers, and corporate transportation. Simple booking process with WhatsApp confirmation.',
  alternates: { canonical: '/booking' },
};

const BOOKING_STEPS = [
  { icon: Car, title: 'Choose Vehicle', description: 'Browse our fleet and select the perfect vehicle for your needs.' },
  { icon: MapPin, title: 'Set Locations', description: 'Enter pickup and drop-off locations with date and time.' },
  { icon: User, title: 'Your Details', description: 'Provide your contact information for confirmation.' },
  { icon: MessageCircle, title: 'Confirm via WhatsApp', description: 'Receive booking details and confirm via WhatsApp.' },
];

export default async function BookingPage() {
  const [businessInfo, vehiclesData] = await Promise.all([
    getBusinessInfo(),
    // Bookable vehicles only: available and with configured pricing (quote-only
    // vehicles are excluded so they can never be booked at Rs. 0).
    getVehicles({ isAvailable: true, minPrice: 0.01, limit: 100 }),
  ]);

  const bookableVehicles = vehiclesData.data.map((vehicle) => ({
    id: vehicle.id,
    name: vehicle.name,
  }));
  const featuredVehicles = vehiclesData.data.slice(0, 6);

  return (
    <Layout businessInfo={businessInfo}>
      <section className="relative py-16 sm:py-24 bg-gradient-to-b from-primary-600 via-primary-700 to-primary-900 text-white overflow-hidden" aria-labelledby="booking-title">
        <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-50" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white text-sm font-medium mb-6">
                <Car className="w-4 h-4" />
                Book Your Ride
              </span>
              <h1 id="booking-title" className="font-heading font-bold text-4xl sm:text-5xl lg:text-6xl mb-6 leading-tight">
                Book Your Vehicle<br />in Minutes
              </h1>
              <p className="text-lg sm:text-xl text-primary-100 mb-8 max-w-xl leading-relaxed">
                Simple, secure booking process. Choose your vehicle, set your dates, and confirm via WhatsApp. No hidden fees, no surprises.
              </p>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-3 p-3 bg-white/10 rounded-xl">
                  <Shield className="w-5 h-5" />
                  <span className="text-sm">No Hidden Fees</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white/10 rounded-xl">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-sm">Personal Follow-Up</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white/10 rounded-xl">
                  <MessageCircle className="w-5 h-5" />
                  <span className="text-sm">WhatsApp Updates</span>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
              <h3 className="font-heading font-semibold text-xl mb-4 text-center">Quick Booking</h3>
              <BookingForm vehicles={bookableVehicles} />
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24" aria-labelledby="steps-title">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 id="steps-title" className="font-heading font-bold text-3xl sm:text-4xl text-gray-900 dark:text-white mb-4">
              How to Book
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Four simple steps to get you on the road.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {BOOKING_STEPS.map((step, index) => (
              <Card key={index} variant="default" padding="lg" className="text-center h-full relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-xl z-10">
                  {index + 1}
                </div>
                <CardHeader className="pt-8">
                  <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <step.icon className="w-7 h-7 text-primary-600 dark:text-primary-400" aria-hidden="true" />
                  </div>
                  <CardTitle>{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-400">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24 bg-gray-50 dark:bg-gray-900/50" aria-labelledby="featured-title">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
            <div>
              <h2 id="featured-title" className="font-heading font-bold text-3xl sm:text-4xl text-gray-900 dark:text-white">
                Popular Vehicles to Book
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Available for immediate booking
              </p>
            </div>
            <Button variant="outline" size="md" asChild>
              <Link href="/vehicles">View All Vehicles</Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredVehicles.map((vehicle) => (
              <Card key={vehicle.id} variant="default" padding="md" hover>
                <div className="relative aspect-video rounded-xl overflow-hidden mb-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={vehicle.thumbnail || vehicle.images[0] || '/placeholder-vehicle.jpg'}
                    alt={`${vehicle.brand} ${vehicle.model}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-primary-600 dark:text-primary-400">{vehicle.category}</span>
                  <span className="font-heading font-bold text-lg text-gray-900 dark:text-white">{formatCurrency(Number(vehicle.dailyRate))}/day</span>
                </div>
                <h3 className="font-heading font-semibold text-base text-gray-900 dark:text-white mb-2">{vehicle.name}</h3>
                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <span className="flex items-center gap-1"><User className="w-4 h-4" /> {vehicle.seats} seats</span>
                  <span className="flex items-center gap-1"><Car className="w-4 h-4" /> {vehicle.transmission}</span>
                </div>
                <Button variant="primary" fullWidth asChild className="group">
                  <Link href={`/vehicles/${vehicle.slug}`}>Book This Vehicle <MessageCircle className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" /></Link>
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24" aria-labelledby="faq-title">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h2 id="faq-title" className="font-heading font-bold text-3xl sm:text-4xl text-gray-900 dark:text-white mb-8 text-center">
              Booking FAQs
            </h2>
            <div className="space-y-4">
              {[
                { q: 'Do I need to pay upfront to book?', a: 'No payment is taken through this website. Payment terms are confirmed when we contact you after your request.' },
                { q: 'Can I modify or cancel my booking?', a: 'Contact us via WhatsApp or phone and we will help with changes or cancellation. Terms are confirmed with your booking.' },
                { q: 'What documents do I need for self-drive?', a: 'Document requirements are confirmed with your booking - keep a valid driving licence and CNIC ready.' },
                { q: 'Is insurance included?', a: 'Insurance terms are confirmed with your booking - ask our team when you make your request.' },
                { q: 'Do you offer one-way rentals?', a: 'One-way arrangements depend on availability. Contact us with your route and we will confirm what is possible.' },
              ].map((faq, index) => (
                <Card key={index} variant="outlined" padding="md">
                  <div className="font-medium text-gray-900 dark:text-white">{faq.q}</div>
                  <div className="text-gray-600 dark:text-gray-400 text-sm mt-1">{faq.a}</div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      <WhatsAppFloat />
    </Layout>
  );
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}