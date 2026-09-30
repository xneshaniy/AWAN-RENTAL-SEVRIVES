import { getWhatsAppNumber } from '@/config/site';

/**
 * Single source of truth for WhatsApp links.
 *
 * The business number comes exclusively from NEXT_PUBLIC_WHATSAPP_NUMBER —
 * it is never hardcoded. When the variable is missing every link builder
 * returns `null`, so callers can render a clear configuration state instead
 * of a fake `wa.me` link.
 */

/** Shown wherever a WhatsApp link cannot be built (number not configured). */
export const WHATSAPP_CONFIG_HINT =
  'WhatsApp number is not configured. Set NEXT_PUBLIC_WHATSAPP_NUMBER to enable WhatsApp chat links.';

/** True when NEXT_PUBLIC_WHATSAPP_NUMBER provides a usable number. */
export function isWhatsAppConfigured(): boolean {
  return getWhatsAppNumber().length > 0;
}

/**
 * Builds a properly URL-encoded wa.me deep link for the configured number.
 * Returns `null` when WhatsApp is not configured.
 */
export function getWhatsAppUrl(message?: string): string | null {
  const number = getWhatsAppNumber();
  if (!number) return null;
  const base = `https://wa.me/${number}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}

/** Opens a WhatsApp chat in a new tab. Returns false when not configured. */
export function openWhatsApp(message: string): boolean {
  const url = getWhatsAppUrl(message);
  if (typeof window === 'undefined' || !url) return false;
  window.open(url, '_blank', 'noopener,noreferrer');
  return true;
}

/** Human-readable label for a booking rental type enum value (SELF_DRIVE -> Self Drive). */
export function rentalTypeLabel(value: string): string {
  const labels: Record<string, string> = {
    SELF_DRIVE: 'Self Drive',
    CHAUFFEUR: 'Chauffeur',
    AIRPORT_TRANSFER: 'Airport Transfer',
    CORPORATE: 'Corporate',
    OTHER: 'Other',
  };
  return labels[value] ?? value.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function generateBookingWhatsAppMessage(booking: {
  bookingNumber: string;
  customerName: string | null;
  customerPhone: string | null;
  vehicleName: string;
  rentalType: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupDate: string;
  returnDate: string;
  passengers: number | null;
  specialRequests?: string | null;
}): string {
  const lines = [
    'Awan Rental Service Booking Request',
    '',
    `Booking Reference: ${booking.bookingNumber}`,
    `Customer: ${booking.customerName ?? 'Not provided'}`,
    `Phone: ${booking.customerPhone ?? 'Not provided'}`,
    '',
    `Vehicle: ${booking.vehicleName}`,
    `Rental Type: ${rentalTypeLabel(booking.rentalType)}`,
    '',
    `Pickup: ${booking.pickupLocation}`,
    `Drop-off: ${booking.dropoffLocation}`,
    '',
    `Pickup Date: ${booking.pickupDate}`,
    `Return Date: ${booking.returnDate}`,
    '',
    `Passengers: ${booking.passengers ?? 'Not specified'}`,
  ];

  if (booking.specialRequests) {
    lines.push('');
    lines.push(`Special Requests: ${booking.specialRequests}`);
  }

  lines.push('');
  lines.push('Please confirm this booking.');

  return lines.join('\n');
}

export function generateVehicleInquiryWhatsAppMessage(vehicleName: string, customerName?: string): string {
  const lines = [
    'Awan Rental Service - Vehicle Inquiry',
    '',
    `Vehicle: ${vehicleName}`,
  ];

  if (customerName) {
    lines.push(`Customer: ${customerName}`);
  }

  lines.push('');
  lines.push('I would like to inquire about this vehicle. Please provide details and availability.');

  return lines.join('\n');
}

export function generateServiceInquiryWhatsAppMessage(
  serviceName: string,
  options?: { customerName?: string; question?: string }
): string {
  const lines = [
    'Awan Rental Service - Service Inquiry',
    '',
    `Service: ${serviceName}`,
  ];

  if (options?.customerName) {
    lines.push(`Customer: ${options.customerName}`);
  }

  lines.push('');
  lines.push(
    options?.question ?? 'I would like to know more about this service. Please provide details.'
  );

  return lines.join('\n');
}

export function generateGeneralWhatsAppMessage(customMessage?: string): string {
  const lines = [
    'Awan Rental Service - Inquiry',
    '',
  ];

  if (customMessage) {
    lines.push(customMessage);
  } else {
    lines.push('Hello, I would like to inquire about your services.');
  }

  return lines.join('\n');
}

/**
 * Booking message, honouring the admin-configured template stored in Site
 * Settings under `whatsapp_booking_template`. When that setting is empty the
 * default message from `generateBookingWhatsAppMessage` is used, so the sync
 * default always remains the fallback.
 *
 * Template variables (any unknown `{token}` is left untouched):
 * {bookingNumber} {customerName} {customerPhone} {vehicleName} {rentalType}
 * {pickupLocation} {dropoffLocation} {pickupDate} {returnDate} {passengers}
 * {specialRequests}
 *
 * The settings lookup uses a dynamic import so this module keeps no
 * server-only imports (tests import the sync generator directly).
 */
export async function getBookingWhatsAppMessage(
  booking: Parameters<typeof generateBookingWhatsAppMessage>[0]
): Promise<string> {
  let template: string | null = null;
  try {
    const { getSetting } = await import('@/lib/settings');
    template = await getSetting('whatsapp_booking_template');
  } catch {
    template = null;
  }

  if (!template || !template.trim()) {
    return generateBookingWhatsAppMessage(booking);
  }

  const values: Record<string, string> = {
    bookingNumber: booking.bookingNumber,
    customerName: booking.customerName ?? 'Not provided',
    customerPhone: booking.customerPhone ?? 'Not provided',
    vehicleName: booking.vehicleName,
    rentalType: rentalTypeLabel(booking.rentalType),
    pickupLocation: booking.pickupLocation,
    dropoffLocation: booking.dropoffLocation,
    pickupDate: booking.pickupDate,
    returnDate: booking.returnDate,
    passengers: booking.passengers != null ? String(booking.passengers) : 'Not specified',
    specialRequests: booking.specialRequests || '',
  };

  return template.replace(/\{([a-zA-Z]+)\}/g, (match, key: string) =>
    key in values ? values[key] : match
  );
}
