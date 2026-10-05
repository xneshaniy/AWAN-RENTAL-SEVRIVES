import Link from 'next/link';
import type { ReactNode } from 'react';
import { Scale } from 'lucide-react';
import { getBusinessInfo } from '@/lib/settings';
import { Layout } from '@/components/layout/Layout';
import { WhatsAppFloat } from '@/components/common/WhatsAppFloat';
import { LEGAL_LINKS } from '@/config/site';

/**
 * Shared chrome for the legal documents (privacy, terms, cancellation, cookies).
 *
 * Each legal page supplies only its own copy; the hero, the sticky table of
 * contents, the cross-links and the footer/header come from here so all four
 * pages stay visually identical and can never drift apart.
 *
 * NOTE: Tailwind Typography is NOT installed (tailwind.config.ts -> plugins: []),
 * so body text is styled through the exported helpers below rather than `prose`.
 */

/** Body copy used by every legal page. */
export const LEGAL_TEXT = 'text-gray-600 dark:text-gray-400 leading-relaxed';

/** Link style for links inside legal body copy. */
export const LEGAL_LINK =
  'text-primary-600 dark:text-primary-400 underline underline-offset-2 transition-colors hover:text-primary-700 dark:hover:text-primary-300';

export function LegalH2({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2
      id={id}
      className="font-heading font-semibold text-xl sm:text-2xl text-gray-900 dark:text-white mt-10 mb-4 scroll-mt-28 first:mt-0"
    >
      {children}
    </h2>
  );
}

export function LegalP({ children }: { children: ReactNode }) {
  return <p className={`${LEGAL_TEXT} mb-4`}>{children}</p>;
}

export function LegalUl({ children }: { children: ReactNode }) {
  return <ul className={`list-disc pl-6 space-y-2 mb-6 ${LEGAL_TEXT}`}>{children}</ul>;
}

/** A highlighted callout inside a legal document. */
export function LegalNote({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-primary-100 dark:border-primary-900/40 bg-primary-50 dark:bg-primary-900/20 p-5 mb-6">
      <div className={LEGAL_TEXT}>{children}</div>
    </div>
  );
}

interface LegalLayoutProps {
  title: string;
  summary: string;
  lastUpdated: string;
  /** Anchor targets, in page order. Drives the sticky "On this page" list. */
  sections: readonly { id: string; heading: string }[];
  children: ReactNode;
}

export async function LegalLayout({
  title,
  summary,
  lastUpdated,
  sections,
  children,
}: LegalLayoutProps) {
  const businessInfo = await getBusinessInfo();

  return (
    <Layout businessInfo={businessInfo}>
      <section
        className="py-16 sm:py-24 bg-gray-50 dark:bg-gray-900/50"
        aria-labelledby="legal-title"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 text-sm font-medium mb-6 shadow-sm">
            <Scale className="w-4 h-4" aria-hidden="true" />
            Legal
          </span>
          <h1
            id="legal-title"
            className="font-heading font-bold text-3xl sm:text-4xl lg:text-5xl text-gray-900 dark:text-white mb-4"
          >
            {title}
          </h1>
          <p className={`text-lg max-w-3xl ${LEGAL_TEXT}`}>{summary}</p>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Last updated: {lastUpdated}
          </p>
        </div>
      </section>

      <section className="py-12 sm:py-16" aria-label={title}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)]">
          <nav
            aria-label="Sections on this page"
            className="lg:sticky lg:top-28 lg:self-start"
          >
            <h2 className="font-heading font-semibold text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
              On this page
            </h2>
            <ul className="space-y-2 border-l border-gray-200 dark:border-gray-700">
              {sections.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="-ml-px block border-l border-transparent pl-4 text-sm text-gray-600 dark:text-gray-400 transition-colors hover:border-primary-500 hover:text-primary-600 dark:hover:text-primary-400"
                  >
                    {section.heading}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="min-w-0">{children}</div>
        </div>
      </section>

      <section
        className="py-12 sm:py-16 bg-gray-50 dark:bg-gray-900/50"
        aria-labelledby="legal-related-title"
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2
            id="legal-related-title"
            className="font-heading font-semibold text-lg text-gray-900 dark:text-white mb-4"
          >
            All legal pages
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {LEGAL_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors hover:border-primary-300 hover:text-primary-600 dark:hover:text-primary-400"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <WhatsAppFloat />
    </Layout>
  );
}
