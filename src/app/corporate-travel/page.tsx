import { getBusinessInfo } from '@/lib/settings';
import { Layout } from '@/components/layout/Layout';
import { WhatsAppFloat } from '@/components/common/WhatsAppFloat';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CorporateInquiryForm } from '@/components/forms/CorporateInquiryForm';
import { SERVICE_TYPES } from '@/config/corporate';
import { Building2, User, Plane, MapPin, Clock, Shield, CheckCircle, Users, Briefcase, FileText, Calendar } from 'lucide-react';
import Link from 'next/link';
import { WhatsAppButton } from '@/components/common/WhatsAppButton';

/** Service name used for WhatsApp enquiry messages on this page. */
const SERVICE_NAME = 'Corporate Transportation';

const CORPORATE_BENEFITS = [
  { icon: Shield, title: 'Dedicated Reservations', description: 'One booking channel - online, WhatsApp or email - for all your trips.' },
  { icon: FileText, title: 'Booking Coordination', description: 'Every request gets a reference you can track and share with your team.' },
  { icon: Users, title: 'Flexible Fleet Options', description: 'Sedans, SUVs, vans, and coasters for teams of any size.' },
  { icon: Clock, title: 'Direct Communication', description: 'Reach us by phone, WhatsApp, or email for itinerary questions and changes.' },
  { icon: Briefcase, title: 'Travel Options', description: 'Self-drive and chauffeur-driven arrangements depending on the assignment.' },
  { icon: MapPin, title: 'Coverage Across Pakistan', description: 'Car rental and transportation solutions for customers across Pakistan.' },
];

export default async function CorporateTravelPage() {
  const businessInfo = await getBusinessInfo();

  return (
    <Layout businessInfo={businessInfo}>
      <section className="relative py-20 sm:py-32 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden" aria-labelledby="corporate-title">
        <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-50" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white text-sm font-medium mb-6">
                <Building2 className="w-4 h-4" />
                Corporate Transportation
              </span>
              <h1 id="corporate-title" className="font-heading font-bold text-4xl sm:text-5xl lg:text-6xl mb-6 leading-tight">
                Corporate Transportation<br />Solutions for Pakistan
              </h1>
              <p className="text-lg sm:text-xl text-gray-300 mb-8 max-w-xl leading-relaxed">
                Tailored transportation solutions for companies, executives, business travelers, corporate events, employee transportation, and airport transfers across Pakistan.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <WhatsAppButton
                  serviceName={SERVICE_NAME}
                  size="lg"
                  label="Discuss Corporate Needs"
                  ariaLabel="Discuss corporate transportation needs on WhatsApp"
                />
                <Button variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10" asChild>
                  <Link href="/vehicles">View Fleet</Link>
                </Button>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20">
              <h3 className="font-heading font-semibold text-xl mb-6 text-center">Corporate Inquiry Form</h3>
              <CorporateInquiryForm />
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24" aria-labelledby="services-title">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 id="services-title" className="font-heading font-bold text-3xl sm:text-4xl text-gray-900 dark:text-white mb-4">
              Our Corporate Services
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Comprehensive transportation solutions designed for businesses.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICE_TYPES.map((service, index) => (
              <Card key={index} variant="default" padding="lg" hover className="h-full">
                <CardHeader>
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center mb-4">
                    {index === 0 && <Users className="w-6 h-6 text-gray-600" />}
                    {index === 1 && <User className="w-6 h-6 text-gray-600" />}
                    {index === 2 && <Plane className="w-6 h-6 text-gray-600" />}
                    {index === 3 && <Calendar className="w-6 h-6 text-gray-600" />}
                    {index === 4 && <MapPin className="w-6 h-6 text-gray-600" />}
                    {index === 5 && <FileText className="w-6 h-6 text-gray-600" />}
                  </div>
                  <CardTitle>{service.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-400">{service.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24 bg-gray-50 dark:bg-gray-900/50" aria-labelledby="benefits-title">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 id="benefits-title" className="font-heading font-bold text-3xl sm:text-4xl text-gray-900 dark:text-white mb-4">
              Why Partner with Awan Rental Service?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Trusted by leading companies across Pakistan for reliable corporate transportation.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {CORPORATE_BENEFITS.map((benefit, index) => (
              <Card key={index} variant="default" padding="lg" hover className="h-full">
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center mb-4">
                  <benefit.icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="font-heading font-semibold text-lg text-gray-900 dark:text-white mb-2">{benefit.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{benefit.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24" aria-labelledby="fleet-title">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 id="fleet-title" className="font-heading font-bold text-3xl sm:text-4xl text-gray-900 dark:text-white mb-6">
                Corporate Fleet Options
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                Choose from our diverse fleet to match your corporate transportation requirements.
              </p>
              <ul className="space-y-4" role="list">
                {[
                  'Executive Sedans (Honda Civic, Toyota Corolla, Toyota Camry)',
                  'Premium SUVs (Toyota Fortuner, Kia Sportage, Hyundai Tucson)',
                  'Executive Vans (Toyota Hiace, 13-seater for team transport)',
                  'Minibuses & Coasters (23-29 seater for large groups)',
                  'Luxury Vehicles (Mercedes, BMW, Audi for VIP transport)',
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-4">
                    <CheckCircle className="w-5 h-5 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 dark:text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-3xl p-8 sm:p-12 text-white">
              <h3 className="font-heading font-bold text-2xl sm:text-3xl mb-4">
                Ready to Partner?
              </h3>
              <p className="text-primary-100 mb-8">
                Let us design a customized transportation solution for your organization.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <WhatsAppButton
                  serviceName={SERVICE_NAME}
                  size="lg"
                  variant="secondary"
                  className="group"
                  label="Contact on WhatsApp"
                  ariaLabel="Contact the corporate travel team on WhatsApp"
                />
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10" asChild>
                  <Link href="/contact">Email Us</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <WhatsAppFloat serviceName={SERVICE_NAME} />
    </Layout>
  );
}
