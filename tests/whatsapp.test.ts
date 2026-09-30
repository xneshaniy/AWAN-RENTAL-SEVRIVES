import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  WHATSAPP_CONFIG_HINT,
  generateBookingWhatsAppMessage,
  generateGeneralWhatsAppMessage,
  generateServiceInquiryWhatsAppMessage,
  generateVehicleInquiryWhatsAppMessage,
  getWhatsAppUrl,
  isWhatsAppConfigured,
  openWhatsApp,
} from '@/lib/whatsapp';

/**
 * Unit tests for the WhatsApp utility (`@/lib/whatsapp`).
 *
 * The business number comes from NEXT_PUBLIC_WHATSAPP_NUMBER only - no
 * hardcoded number - so these tests assert on the link *shape* (digits-only
 * wa.me links with a properly URL-encoded message) rather than a specific
 * number, plus the unconfigured behaviour that must never produce a fake link.
 */

/** Splits `https://wa.me/<digits>?text=<encoded>` into its parts. */
function parseWaMe(url: string): { number: string; text: string | null } {
  const match = /^https:\/\/wa\.me\/([0-9]+)(?:\?text=(.*))?$/.exec(url);
  assert.ok(match, `not a valid wa.me link: ${url}`);
  return { number: match[1], text: match[2] ?? null };
}

describe('link generation', () => {
  test('builds a digits-only wa.me link with a URL-encoded message', () => {
    const message = 'Awan Rental Service Booking Request & Pickup: F-8 -> Airport?';
    const url = getWhatsAppUrl(message);
    assert.ok(url, 'expected a link while NEXT_PUBLIC_WHATSAPP_NUMBER is set');
    assert.equal(isWhatsAppConfigured(), true);

    const { number, text } = parseWaMe(url);
    assert.match(number, /^[0-9]+$/, 'wa.me numbers must be digits only');
    assert.ok(text, 'message must be encoded into the link');
    assert.equal(decodeURIComponent(text), message, 'encoding must round-trip');
    // encodeURIComponent leaves neither raw spaces, "+", nor "&" in the query.
    assert.ok(!text.includes(' '), 'spaces must be percent-encoded');
    assert.ok(!text.includes('+'), '"+" must be percent-encoded');
    assert.ok(!text.includes('&'), '"&" must be percent-encoded');
  });

  test('omits the text parameter when no message is given', () => {
    const url = getWhatsAppUrl();
    assert.ok(url);
    const { text } = parseWaMe(url);
    assert.equal(text, null);
  });

  test('returns a null link and reports unconfigured when the env var is removed', () => {
    const original = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
    try {
      delete process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
      assert.equal(isWhatsAppConfigured(), false);
      assert.equal(getWhatsAppUrl('Hello'), null, 'must not generate a fake link');
      assert.equal(openWhatsApp('Hello'), false, 'must not open anything');
      assert.ok(
        WHATSAPP_CONFIG_HINT.includes('NEXT_PUBLIC_WHATSAPP_NUMBER'),
        'configuration hint must name the env var'
      );
    } finally {
      if (original !== undefined) process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = original;
    }
  });
});

describe('booking message', () => {
  const booking = {
    bookingNumber: 'ARS-ABC123',
    customerName: 'Jane Doe',
    customerPhone: '+92 300 1234567',
    vehicleName: 'Toyota Corolla',
    rentalType: 'SELF_DRIVE',
    pickupLocation: 'Islamabad Airport',
    dropoffLocation: 'Lahore',
    pickupDate: '10 September 2026',
    returnDate: '15 September 2026',
    passengers: 3,
    specialRequests: 'Child seat & extra driver',
  };

  test('includes every required field with the required header', () => {
    const message = generateBookingWhatsAppMessage(booking);
    const lines = message.split('\n');

    assert.equal(lines[0], 'Awan Rental Service Booking Request');
    for (const field of [
      'Booking Reference:',
      'Customer:',
      'Phone:',
      'Vehicle:',
      'Rental Type:',
      'Pickup:',
      'Drop-off:',
      'Pickup Date:',
      'Return Date:',
      'Passengers:',
      'Special Requests:',
    ]) {
      assert.ok(message.includes(field), `missing field label: ${field}`);
    }
    assert.ok(message.includes('ARS-ABC123'));
    assert.ok(message.includes('Jane Doe'));
    assert.ok(message.includes('+92 300 1234567'));
    assert.ok(message.includes('Toyota Corolla'));
    assert.ok(message.includes('Islamabad Airport'));
    assert.ok(message.includes('Lahore'));
    assert.ok(message.includes('10 September 2026'));
    assert.ok(message.includes('15 September 2026'));
    assert.ok(message.includes('Child seat & extra driver'));
  });

  test('humanises the rental type enum', () => {
    assert.ok(generateBookingWhatsAppMessage(booking).includes('Rental Type: Self Drive'));
    assert.ok(
      generateBookingWhatsAppMessage({ ...booking, rentalType: 'AIRPORT_TRANSFER' }).includes(
        'Rental Type: Airport Transfer'
      )
    );
    assert.ok(
      generateBookingWhatsAppMessage({ ...booking, rentalType: 'OTHER' }).includes(
        'Rental Type: Other'
      )
    );
  });

  test('omits special requests when none were provided', () => {
    const message = generateBookingWhatsAppMessage({ ...booking, specialRequests: undefined });
    assert.ok(!message.includes('Special Requests:'));
    assert.ok(message.includes('Passengers: 3'));
  });

  test('the booking message URL-encodes into a working wa.me link', () => {
    const message = generateBookingWhatsAppMessage(booking);
    const url = getWhatsAppUrl(message);
    assert.ok(url);
    const { text } = parseWaMe(url);
    assert.equal(decodeURIComponent(text!), message);
  });
});

describe('contextual messages', () => {
  test('vehicle messages include the vehicle name', () => {
    const message = generateVehicleInquiryWhatsAppMessage('Kia Sportage');
    assert.ok(message.includes('Vehicle: Kia Sportage'));
    assert.ok(generateVehicleInquiryWhatsAppMessage('Kia Sportage', 'Ali Khan').includes('Customer: Ali Khan'));
  });

  test('service messages include the service name and support custom questions', () => {
    const message = generateServiceInquiryWhatsAppMessage('Family Travel', {
      question: 'Do you provide child seats?',
    });
    assert.ok(message.includes('Service: Family Travel'));
    assert.ok(message.includes('Do you provide child seats?'));
    assert.ok(
      generateServiceInquiryWhatsAppMessage('Airport Transfer', { customerName: 'Sara' }).includes(
        'Customer: Sara'
      )
    );
  });

  test('general messages fall back to a default greeting', () => {
    assert.ok(generateGeneralWhatsAppMessage().includes('Hello, I would like to inquire'));
    assert.ok(generateGeneralWhatsAppMessage('I need a car rental in Lahore.').includes('I need a car rental in Lahore.'));
  });
});
