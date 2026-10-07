import { Metadata } from 'next';
import Link from 'next/link';
import { Layout } from '@/components/layout/Layout';
import { WhatsAppFloat } from '@/components/common/WhatsAppFloat';
import { WhatsAppButton } from '@/components/common/WhatsAppButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Phone, Mail, MessageCircle, ArrowRight } from 'lucide-react';
import { getBusinessInfo } from '@/lib/settings';
import { getFAQs } from '@/actions/settings';
import { FaqSection, buildFaqJsonLd } from '@/components/sections/FaqSection';
import { getWhatsAppUrl, generateGeneralWhatsAppMessage } from '@/lib/whatsapp';
import { CONTACT_PHONE, CONTACT_EMAIL } from '@/config/site';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions',
  description:
    'Answers to common questions about renting a car with Awan Rental Service: deposits, required documents, drivers, airport pickup, nationwide rental and cancellations.',
  alternates: { canonical: '/faq' },
  openGraph: {
    title: 'Frequently Asked Questions',
    description:
      'Deposits, documents, drivers, airport pickup, nationwide rental and cancellations — answered.',
    url: '/faq',
    type: 'article',
  },
};

const CONTACT_OPTIONS = [
  {
    key: 'whatsapp',
    icon: MessageCircle,
    title: 'WhatsApp',
    display: 'Chat with us',
    external: true,
    note: 'Fastest reply during business hours.',
  },
  {
    key: 'phone',
    icon: Phone,
    title: 'Call us',
    display: CONTACT_PHONE,
    href: `tel:${CONTACT_PHONE.replace(/\s+/g, '')}`,
    external: false,
    note: 'Speak to the team directly.',
  },
  {
    key: 'email',
    icon: Mail,
    title: 'Email',
    display: CONTACT_EMAIL,
    href: `mailto:${CONTACT_EMAIL}`,
    external: false,
    note: 'For detailed or written enquiries.',
  },
] as const;

export default async function FaqPage() {
  const [businessInfo, faqs] = await Promise.all([getBusinessInfo(), getFAQs()]);
  const faqLd = buildFaqJsonLd(faqs);
  const whatsappUrl = getWhatsAppUrl(generateGeneralWhatsAppMessage());

  return (
    <Layout businessInfo={businessInfo}>
      {faqLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
        />
      )}

      <FaqSection
        faqs={faqs}
        headingLevel="h1"
        title="Frequently Asked Questions"
        subtitle="Everything you need to know before booking a car with Awan Rental Service."
      />

      <section className="py-16 sm:py-24" aria-labelledby="faq-contact-title">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card variant="default" padding="lg">
            <CardHeader>
              <CardTitle id="faq-contact-title" level={2} className="text-2xl">
                Still have a question?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-gray-600 dark:text-gray-400">
                If your question is not answered above, get in touch. We reply during
                business hours and can confirm availability, pricing and documents for
                your trip.
              </p>

              <div className="grid gap-4 sm:grid-cols-3">
                {CONTACT_OPTIONS.map((option) => {
                  // getWhatsAppUrl returns null until a number is configured;
                  // fall back to the contact page so the tile stays usable.
                  const href = 'href' in option ? option.href : whatsappUrl ?? '/contact';

                  return (
                    <a
                      key={option.key}
                      href={href}
                      target={option.external ? '_blank' : undefined}
                      rel={option.external ? 'noopener noreferrer' : undefined}
                      className="group flex flex-col gap-1 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
                    >
                      <span className="flex items-center gap-2 font-medium text-gray-900 dark:text-white">
                        <option.icon
                          className="w-4 h-4 text-primary-600 dark:text-primary-400"
                          aria-hidden="true"
                        />
                        {option.title}
                      </span>
                      <span className="text-sm text-primary-700 dark:text-primary-400 break-words">
                        {option.display}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {option.note}
                      </span>
                    </a>
                  );
                })}
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <WhatsAppButton
                  size="lg"
                  label="Ask on WhatsApp"
                  ariaLabel="Ask a question on WhatsApp"
                />
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-medium px-6 py-3 transition-colors"
                >
                  Send a message
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <WhatsAppFloat />
    </Layout>
  );
}
