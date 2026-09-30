'use client';

import type { MouseEvent, ReactNode } from 'react';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  WHATSAPP_CONFIG_HINT,
  generateGeneralWhatsAppMessage,
  generateServiceInquiryWhatsAppMessage,
  generateVehicleInquiryWhatsAppMessage,
  getWhatsAppUrl,
} from '@/lib/whatsapp';

type WhatsAppVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'whatsapp';
type WhatsAppSize = 'sm' | 'md' | 'lg' | 'xl';

export interface WhatsAppButtonProps {
  /** Pre-built wa.me URL (e.g. the booking-success deep link). `null` forces the unconfigured state. */
  url?: string | null;
  /** Pre-built message pre-filled into the chat. Ignored when `url` is provided. */
  message?: string;
  /** Convenience: vehicle inquiry message that includes this vehicle's name. */
  vehicleName?: string;
  /** Convenience: service inquiry message that includes this service's name. */
  serviceName?: string;
  /** Convenience: general inquiry message with custom opening text. */
  customMessage?: string;
  /** Button text (ignored when `iconOnly`). Defaults to "Chat on WhatsApp". */
  label?: ReactNode;
  /** Replaces the default chat icon; pass `null` to hide the icon. */
  icon?: ReactNode;
  /** Renders the icon without a visible label (announce via `ariaLabel`). */
  iconOnly?: boolean;
  ariaLabel?: string;
  variant?: WhatsAppVariant;
  size?: WhatsAppSize;
  fullWidth?: boolean;
  className?: string;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
}

/**
 * Reusable WhatsApp call-to-action.
 *
 * When NEXT_PUBLIC_WHATSAPP_NUMBER is configured it renders an anchor with a
 * properly URL-encoded `wa.me` link; otherwise it renders a disabled button
 * that clearly states the configuration problem instead of generating a fake
 * link.
 */
export function WhatsAppButton({
  url,
  message,
  vehicleName,
  serviceName,
  customMessage,
  label,
  icon,
  iconOnly,
  ariaLabel,
  variant = 'whatsapp',
  size = 'md',
  fullWidth,
  className,
  onClick,
}: WhatsAppButtonProps) {
  const resolvedMessage =
    message ??
    (vehicleName
      ? generateVehicleInquiryWhatsAppMessage(vehicleName)
      : serviceName
        ? generateServiceInquiryWhatsAppMessage(serviceName)
        : generateGeneralWhatsAppMessage(customMessage));

  const resolvedUrl = url ?? getWhatsAppUrl(resolvedMessage);

  if (!resolvedUrl) {
    return (
      <Button
        variant={variant}
        size={size}
        fullWidth={fullWidth}
        className={className}
        disabled
        title={WHATSAPP_CONFIG_HINT}
        aria-label="WhatsApp is not configured"
      >
        <MessageCircle className="w-5 h-5" aria-hidden="true" />
        <span className={iconOnly ? 'sr-only' : undefined}>WhatsApp Not Configured</span>
      </Button>
    );
  }

  const iconNode =
    icon === null ? null : (icon ?? <MessageCircle className="w-5 h-5" aria-hidden="true" />);

  return (
    <Button variant={variant} size={size} fullWidth={fullWidth} className={className} asChild>
      <a
        href={resolvedUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClick}
        aria-label={ariaLabel}
      >
        {iconNode}
        {!iconOnly && (label ?? 'Chat on WhatsApp')}
      </a>
    </Button>
  );
}
