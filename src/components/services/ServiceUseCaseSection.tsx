import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { CheckCircle, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ServiceUseCaseLink {
  href: string;
  label: string;
}

interface ServiceUseCaseSectionProps {
  /** Unique id — builds both the heading id and the section's aria-labelledby. */
  id: string;
  /** Decorative icon shown in the heading tile. */
  icon: LucideIcon;
  /** Section heading (rendered as the <h2>). */
  title: string;
  description: string;
  /** Key points rendered as a checklist alongside the heading. */
  points: string[];
  /** Optional "learn more" link to a related page. */
  link?: ServiceUseCaseLink;
  /** Swaps the column order on large screens for visual rhythm. */
  reversed?: boolean;
  /** Background tone so consecutive sections can alternate. */
  tone?: 'default' | 'muted';
}

/**
 * Reusable content section for individual service use cases: a heading block
 * (icon, title, description, optional link) paired with a checklist. Used
 * server-side so every instance stays static and accessible.
 */
export function ServiceUseCaseSection({
  id,
  icon: Icon,
  title,
  description,
  points,
  link,
  reversed = false,
  tone = 'default',
}: ServiceUseCaseSectionProps) {
  return (
    <section
      aria-labelledby={`${id}-title`}
      className={cn('py-16 sm:py-24', tone === 'muted' && 'bg-gray-50 dark:bg-gray-900/50')}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div className={reversed ? 'lg:order-2' : undefined}>
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center mb-4">
              <Icon
                className="w-6 h-6 text-primary-600 dark:text-primary-400"
                aria-hidden="true"
              />
            </div>
            <h2
              id={`${id}-title`}
              className="font-heading font-bold text-3xl sm:text-4xl text-gray-900 dark:text-white mb-4"
            >
              {title}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">{description}</p>
            {link && (
              <Link
                href={link.href}
                className="group inline-flex items-center gap-1 font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
              >
                {link.label}
                <ChevronRight
                  className="w-4 h-4 transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </Link>
            )}
          </div>

          {points.length > 0 && (
            <ul role="list" className={cn('space-y-4', reversed && 'lg:order-1')}>
              {points.map((point) => (
                <li
                  key={point}
                  className="flex items-start gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex-shrink-0 w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
                    <CheckCircle
                      className="w-5 h-5 text-primary-600 dark:text-primary-400"
                      aria-hidden="true"
                    />
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 pt-2">{point}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
