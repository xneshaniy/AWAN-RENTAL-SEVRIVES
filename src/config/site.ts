/**
 * Central site / business configuration.
 *
 * Values come from environment variables (see .env.example). The fallbacks
 * below are the verified production values for Awan Rental Service — they are
 * defined in exactly ONE place so no fake or placeholder contact details can
 * leak into components, emails, sitemap, robots.txt or metadata.
 *
 * NOTE: Contact information that should be editable at runtime lives in
 * SiteSettings (see prisma/seed.ts and Admin > Settings). The constants here
 * are the server-side fallbacks used for SEO, email templates and link
 * generation.
 */

const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://awanrentalservice.org';

/** Production origin without a trailing slash (used for canonical/OG/sitemap/robots). */
export const SITE_URL = rawSiteUrl.replace(/\/+$/, '');

/** Verified legal / brand name of the company. */
export const SITE_NAME = 'AWAN RENTAL SERVICE';

/** Verified public contact details (fallbacks — SiteSettings take precedence where available). */
export const CONTACT_EMAIL = process.env.ADMIN_EMAIL || 'info@awanrentalservice.org';
export const CONTACT_PHONE = '+92 305 6846811';

/** Reads NEXT_PUBLIC_WHATSAPP_NUMBER and normalises it to digits only
 *  (no "+", spaces or dashes), as required by wa.me links.
 *  Returns an empty string when the variable is not configured — a real
 *  phone number is never hardcoded here. */
function readWhatsAppNumber(): string {
  return (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '').replace(/[^0-9]/g, '');
}

/** WhatsApp number in digits-only form at build time ('' when not configured). */
export const WHATSAPP_NUMBER = readWhatsAppNumber();

/** WhatsApp number in digits-only form, read at call time ('' when not configured). */
export function getWhatsAppNumber(): string {
  return readWhatsAppNumber();
}

/** Build a correctly encoded wa.me deep link, or null when WhatsApp is not configured. */
export function getWhatsAppLink(message?: string): string | null {
  if (!WHATSAPP_NUMBER) return null;
  const base = `https://wa.me/${WHATSAPP_NUMBER}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
