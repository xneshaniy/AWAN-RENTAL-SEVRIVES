import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface ServiceCtaAction {
  label: string;
  /** `null` (e.g. an unconfigured WhatsApp number) renders a disabled
   *  configuration state instead of a fake link. */
  href: string | null;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'whatsapp';
  /** Extra classes merged into the button (e.g. a white outline on gradients). */
  className?: string;
  /** Open as an external link (used for WhatsApp). */
  external?: boolean;
  /** Optional decorative icon shown before the label. */
  icon?: LucideIcon;
}

interface ServiceCtaBandProps {
  /** Unique id — builds the heading id and the section's aria-labelledby. */
  id?: string;
  title: string;
  description?: string;
  actions: ServiceCtaAction[];
}

/**
 * Reusable closing call-to-action band for service pages. Actions are plain
 * string hrefs (internal Links or external anchors), so the component stays a
 * server component and never relies on onClick handlers.
 */
export function ServiceCtaBand({
  id = 'service-cta',
  title,
  description,
  actions,
}: ServiceCtaBandProps) {
  return (
    <section
      aria-labelledby={`${id}-title`}
      className="py-16 sm:py-24 bg-gradient-to-r from-primary-700 to-primary-900 text-white"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2
          id={`${id}-title`}
          className="font-heading font-bold text-3xl sm:text-4xl mb-4"
        >
          {title}
        </h2>
        {description && (
          <p className="text-lg text-primary-100 mb-8 max-w-2xl mx-auto">{description}</p>
        )}
        <div className="flex flex-col sm:flex-row flex-wrap gap-4 justify-center">
          {actions.map((action) => {
            const Icon = action.icon;
            const content = (
              <>
                {Icon && <Icon className="w-5 h-5" aria-hidden="true" />}
                {action.label}
              </>
            );

            // Missing link (external only ever goes missing for WhatsApp) —
            // show a clear configuration state instead of a fake link.
            if (!action.href) {
              return (
                <Button
                  key={action.label}
                  size="xl"
                  variant={action.variant}
                  className={action.className}
                  disabled
                  title="WhatsApp number is not configured. Set NEXT_PUBLIC_WHATSAPP_NUMBER to enable WhatsApp chat links."
                >
                  {Icon && <Icon className="w-5 h-5" aria-hidden="true" />}
                  WhatsApp Not Configured
                </Button>
              );
            }

            if (action.external) {
              return (
                <Button
                  key={action.label}
                  size="xl"
                  variant={action.variant}
                  className={action.className}
                  asChild
                >
                  <a href={action.href} target="_blank" rel="noopener noreferrer">
                    {content}
                  </a>
                </Button>
              );
            }

            return (
              <Button
                key={action.label}
                size="xl"
                variant={action.variant}
                className={action.className}
                asChild
              >
                <Link href={action.href}>{content}</Link>
              </Button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
