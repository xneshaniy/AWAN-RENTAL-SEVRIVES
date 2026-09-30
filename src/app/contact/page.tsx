import { getBusinessInfo } from '@/lib/settings';
import { Layout } from '@/components/layout/Layout';
import { WhatsAppFloat } from '@/components/common/WhatsAppFloat';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ContactForm } from '@/components/forms/ContactForm';
import { Phone, Mail, Clock, MessageCircle, MapPin as MapPinIcon, Globe, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { WhatsAppButton } from '@/components/common/WhatsAppButton';
import { CONTACT_PHONE, CONTACT_EMAIL, WHATSAPP_NUMBER, SITE_NAME } from '@/config/site';

export default async function ContactPage() {
  const businessInfo = await getBusinessInfo();
  // Prefer SiteSettings; fall back to the configured business number.
  const displayPhone = businessInfo.companyPhone || CONTACT_PHONE;
  const displayWhatsApp = businessInfo.companyWhatsApp || WHATSAPP_NUMBER;
  const displayEmail = businessInfo.companyEmail || CONTACT_EMAIL;

  return (
    <Layout businessInfo={businessInfo}>
      <section className="py-16 sm:py-24 bg-gray-50 dark:bg-gray-900/50" aria-labelledby="contact-title">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h1 id="contact-title" className="font-heading font-bold text-3xl sm:text-4xl lg:text-5xl text-gray-900 dark:text-white mb-4">
              Contact Us
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              We&apos;d love to hear from you. Reach out for bookings, inquiries, or partnerships.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            <div className="space-y-8">
              <Card variant="default" padding="lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="w-6 h-6 text-green-600" />
                    WhatsApp Us
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600 dark:text-gray-400">
                    The quickest way to reach us. Send a message and we&apos;ll get back to you
                    during business hours.
                  </p>
                  <WhatsAppButton
                    size="lg"
                    fullWidth
                    label="Chat on WhatsApp"
                    ariaLabel="Chat with Awan Rental Service on WhatsApp"
                  />
                  {(displayWhatsApp || businessInfo.businessHours) && (
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-1">
                      {displayWhatsApp && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">WhatsApp: {displayWhatsApp}</p>
                      )}
                      {businessInfo.businessHours && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 whitespace-pre-line">{businessInfo.businessHours}</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card variant="default" padding="lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="w-6 h-6 text-primary-600" />
                    Call Us
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <a href={`tel:${displayPhone.replace(/[^+\d]/g, '')}`} className="flex items-center gap-3 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                      <Phone className="w-5 h-5 text-primary-600 flex-shrink-0" />
                      <span className="font-medium">{displayPhone}</span>
                    </a>
                    <WhatsAppButton
                      variant="ghost"
                      size="sm"
                      className="justify-start p-0 rounded-none font-normal hover:bg-transparent text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
                      icon={<MessageCircle className="w-5 h-5 text-green-600 flex-shrink-0" aria-hidden="true" />}
                      label={`${displayWhatsApp} (WhatsApp)`}
                      ariaLabel={`Chat on WhatsApp at ${displayWhatsApp}`}
                    />
                  </div>
                  {businessInfo.businessHours && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 whitespace-pre-line">
                      Business Hours: {businessInfo.businessHours}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card variant="default" padding="lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="w-6 h-6 text-secondary-600" />
                    Email Us
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <a href={`mailto:${displayEmail}`} className="flex items-center gap-3 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                    <Mail className="w-5 h-5 text-secondary-600 flex-shrink-0" />
                    <span>{displayEmail}</span>
                  </a>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card variant="default" padding="lg">
                <CardHeader>
                  <CardTitle>Send Us a Message</CardTitle>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">Fill out the form and we&apos;ll get back to you as soon as we can.</p>
                </CardHeader>
                <CardContent>
                  <ContactForm />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {(businessInfo.companyAddress || businessInfo.businessHours) && (
        <section className="py-16 sm:py-24" aria-labelledby="locations-title">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 id="locations-title" className="font-heading font-bold text-3xl sm:text-4xl text-gray-900 dark:text-white mb-4">
                Visit Us
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Reach out or visit us during business hours.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {businessInfo.companyAddress && (
                <Card variant="default" padding="lg" hover>
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                        <MapPinIcon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div>
                        <h3 className="font-heading font-semibold text-lg text-gray-900 dark:text-white">{SITE_NAME}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 whitespace-pre-line">{businessInfo.companyAddress}</p>
                        {businessInfo.googleMapsUrl && (
                          <a
                            href={businessInfo.googleMapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                          >
                            View on Google Maps
                            <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                          </a>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              )}
              {businessInfo.businessHours && (
                <Card variant="default" padding="lg" hover>
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Clock className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div>
                        <h3 className="font-heading font-semibold text-lg text-gray-900 dark:text-white">Business Hours</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 whitespace-pre-line">{businessInfo.businessHours}</p>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              )}
              {businessInfo.serviceAreas.length > 0 && (
                <Card variant="default" padding="lg" hover>
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Globe className="w-6 h-6 text-primary-600" />
                      </div>
                      <div>
                        <h3 className="font-heading font-semibold text-lg text-gray-900 dark:text-white">Service Areas</h3>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {businessInfo.serviceAreas.map((area) => (
                            <span
                              key={area}
                              className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                            >
                              {area}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              )}
            </div>
          </div>
        </section>
      )}

      <section className="py-16 sm:py-24 bg-primary-600 text-white" aria-labelledby="cta-title">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 id="cta-title" className="font-heading font-bold text-3xl sm:text-4xl mb-4">
            Ready to Book Your Ride?
          </h2>
          <p className="text-lg text-primary-100 mb-8 max-w-2xl mx-auto">
            Contact us today for the best car rental and transportation experience in Pakistan.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <WhatsAppButton
              size="lg"
              variant="secondary"
              className="group"
              label="Book on WhatsApp"
              ariaLabel="Book a ride on WhatsApp"
            />
            <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10" asChild>
              <Link href="/booking">Book Online</Link>
            </Button>
          </div>
        </div>
      </section>

      <WhatsAppFloat />
    </Layout>
  );
}
