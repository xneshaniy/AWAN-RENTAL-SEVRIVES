import { HelpCircle, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

interface FaqSectionProps {
  faqs: FaqItem[];
  title?: string;
  subtitle?: string;
  /**
   * The FAQ list is the main heading on /faq and a sub-heading when embedded
   * in a service page, so the level has to be supplied by the caller to keep
   * every page to exactly one h1.
   */
  headingLevel?: 'h1' | 'h2';
  /** Neutral background for pages that are already alternating section colours. */
  variant?: 'muted' | 'plain';
}

/**
 * Server-rendered accordion. `<details>` is natively keyboard operable and
 * announces its expanded state, so no client JS is needed here.
 *
 * Every page using this component is responsible for emitting the matching
 * FAQPage JSON-LD via `buildFaqJsonLd`.
 */
export function FaqSection({
  faqs,
  title = 'Frequently Asked Questions',
  subtitle = 'Answers to the questions we hear most often about renting a car.',
  headingLevel = 'h2',
  variant = 'muted',
}: FaqSectionProps) {
  if (faqs.length === 0) return null;

  const Heading = headingLevel;

  return (
    <section
      className={cn(
        'py-16 sm:py-24',
        variant === 'muted' && 'bg-gray-50 dark:bg-gray-900/50'
      )}
      aria-labelledby="faq-title"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
            <HelpCircle
              className="w-6 h-6 text-primary-600 dark:text-primary-400"
              aria-hidden="true"
            />
          </div>
          <Heading
            id="faq-title"
            className="font-heading font-bold text-3xl sm:text-4xl text-gray-900 dark:text-white mb-4"
          >
            {title}
          </Heading>
          <p className="text-lg text-gray-600 dark:text-gray-400">{subtitle}</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq) => (
            <details
              key={faq.id}
              className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <summary className="flex items-center justify-between gap-4 p-5 cursor-pointer list-none font-medium text-gray-900 dark:text-white [&::-webkit-details-marker]:hidden">
                {faq.question}
                <ChevronDown
                  className="w-5 h-5 flex-shrink-0 text-primary-600 dark:text-primary-400 transition-transform group-open:rotate-180"
                  aria-hidden="true"
                />
              </summary>
              <div className="px-5 pb-5 text-gray-600 dark:text-gray-400">{faq.answer}</div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/** FAQPage structured data for the block above. */
export function buildFaqJsonLd(faqs: FaqItem[]) {
  if (faqs.length === 0) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}
