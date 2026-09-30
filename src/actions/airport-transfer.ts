'use server';

import { prisma } from '@/lib/prisma';
import { airportTransferSchema, AirportTransferInput } from '@/lib/validations';
import { sendEmail, generateContactEmailHtml } from '@/lib/email';
import { getSetting } from '@/lib/settings';
import {
  AIRPORT_OPTIONS,
  OTHER_AIRPORT_ID,
  VEHICLE_PREFERENCE_OPTIONS,
} from '@/config/airports';

interface AirportTransferActionResult {
  success: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

/**
 * Composes the structured request details. Every line maps onto an existing
 * `bookingSchema` field (direction → rentalType, date/time → pickupDate/
 * pickupTime, location → pickupLocation, passengers, luggage, flightNumber),
 * so moving this request onto the Booking system later is a straight hand-off
 * of `data` to `createBooking(...)` — no reshaping required.
 */
function composeRequestDetails(data: AirportTransferInput): string {
  const airportLabel =
    AIRPORT_OPTIONS.find((airport) => airport.id === data.airport)?.label ??
    (data.airport === OTHER_AIRPORT_ID ? 'Other airport' : data.airport);
  const vehicleLabel =
    VEHICLE_PREFERENCE_OPTIONS.find((option) => option.value === data.vehiclePreference)
      ?.label ?? data.vehiclePreference;

  return [
    `Airport: ${airportLabel}`,
    `Type: ${data.direction === 'ARRIVAL' ? 'Arrival (airport pickup)' : 'Departure (airport drop-off)'}`,
    `Date: ${data.date}`,
    `Time: ${data.time}`,
    `Flight Number: ${data.flightNumber || 'Not provided'}`,
    `Pickup / Drop-off: ${data.location}`,
    `Passengers: ${data.passengers}`,
    `Luggage: ${data.luggage}`,
    `Vehicle Preference: ${vehicleLabel}`,
    `WhatsApp: ${data.whatsapp}`,
  ].join('\n');
}

/**
 * Validates an airport-transfer request and records it as an inquiry.
 *
 * This deliberately does NOT call `createBooking` yet — the airport form
 * stays independent of the Booking system until it is connected (the validated
 * payload already mirrors the booking fields, see `composeRequestDetails`).
 */
export async function submitAirportTransferRequest(
  data: AirportTransferInput
): Promise<AirportTransferActionResult> {
  const validated = airportTransferSchema.safeParse(data);

  if (!validated.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const error of validated.error.errors) {
      const path = error.path.join('.');
      if (!fieldErrors[path]) fieldErrors[path] = [];
      fieldErrors[path].push(error.message);
    }
    return { success: false, error: 'Validation failed', fieldErrors };
  }

  const { honeypot: _honeypot, ...request } = validated.data;
  const details = composeRequestDetails(request);

  try {
    await prisma.contactMessage.create({
      data: {
        name: request.customerName,
        // The form collects a WhatsApp number instead of an email address;
        // stored empty so the shared ContactMessage record stays valid.
        email: '',
        phone: request.whatsapp,
        subject: 'Airport Transfer Request',
        message: details,
      },
    });

    // Best-effort admin notification — persistence above already succeeded,
    // so an SMTP failure must not turn this into an error response.
    try {
      const adminEmail = (await getSetting('admin_email')) || process.env.ADMIN_EMAIL;
      if (adminEmail) {
        await sendEmail({
          to: adminEmail,
          subject: 'New Airport Transfer Request',
          html: generateContactEmailHtml({
            name: request.customerName,
            email: 'Not provided — customer contacts via WhatsApp',
            phone: request.whatsapp,
            subject: 'Airport Transfer Request',
            message: details,
          }),
        });
      }
    } catch (emailError) {
      console.error('Airport transfer email notification failed:', emailError);
    }

    return {
      success: true,
      message:
        'Your airport transfer request has been received. We will contact you on WhatsApp to confirm the details.',
    };
  } catch (error) {
    console.error('Airport transfer request error:', error);
    return {
      success: false,
      error: 'Failed to submit your airport transfer request. Please try again.',
    };
  }
}
