import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  generateBookingConfirmedEmailHtml,
  generateBookingEmailHtml,
} from '@/lib/email';
import { SITE_NAME, SITE_URL } from '@/config/site';

/**
 * Unit tests for `generateBookingConfirmedEmailHtml`.
 *
 * This template is sent to a real customer the moment an admin confirms a
 * booking, so it is tested as a document rather than as "some non-empty
 * string": the confirmation wording, every required booking fact, the HTML
 * escaping of user-controlled fields and the behaviour of the optional
 * fields are all asserted.
 *
 * NOTE ON "DRIVER / CHAUFFEUR": `BookingEmailData` has no driver-name field -
 * the booking record does not store one, so the template must not invent a
 * person's name. What *is* applicable is the rental type, which is how a
 * chauffeur booking differs from a self-drive booking, and that is covered
 * below.
 */

const BASE = {
  bookingNumber: 'ARS-123456',
  customerName: 'Ahmed Khan',
  vehicleName: 'Toyota Corolla',
  rentalType: 'Self Drive',
  pickupLocation: 'Islamabad Airport',
  dropoffLocation: 'Lahore City',
  pickupDate: '12 Oct 2026, 10:00',
  returnDate: '15 Oct 2026, 10:00',
  passengers: 4,
  totalAmount: 45000,
};

describe('valid booking data', () => {
  const html = generateBookingConfirmedEmailHtml(BASE);

  test('renders a complete HTML document', () => {
    // `renderEmailLayout` opens with a newline before the doctype.
    assert.ok(html.trimStart().startsWith('<!DOCTYPE html>'), 'must start with a doctype');
    assert.ok(html.includes('<html lang="en">'));
    assert.ok(html.trimEnd().endsWith('</html>'));
    assert.ok(html.includes('</body>'));
  });

  test('uses the branded layout with a confirmation banner', () => {
    assert.ok(html.includes(SITE_NAME), 'site name must appear in the header');
    assert.ok(html.includes('Booking Confirmed'), 'banner heading must say Booking Confirmed');
    assert.ok(html.includes('<title>Booking Confirmed - ARS-123456</title>'));
  });

  test('uses the green confirmation accent, not the red request accent', () => {
    assert.ok(html.includes('#15803d'), 'confirmation banner must be green');
    assert.ok(
      !html.includes('heading: \'Booking Request Received\''),
      'must not reuse the request banner'
    );
  });

  test('renders every booking fact', () => {
    for (const value of [
      'Ahmed Khan',
      'Toyota Corolla',
      'Self Drive',
      'Islamabad Airport',
      'Lahore City',
      '12 Oct 2026, 10:00',
      '15 Oct 2026, 10:00',
    ]) {
      const occurrences = html.split(value).length - 1;
      assert.equal(occurrences, 1, `"${value}" should appear exactly once, saw ${occurrences}`);
    }
  });

  test('shows the booking reference in the title, the table and the CTA', () => {
    const occurrences = html.split('ARS-123456').length - 1;
    assert.equal(occurrences, 3, `expected reference in <title>, table row and href; saw ${occurrences}`);
  });

  test('formats the total as PKR currency with a label', () => {
    // Compared against the same runtime's toLocaleString so the assertion is
    // locale-agnostic (',' vs '.' separators differ by machine locale).
    assert.ok(
      html.includes(`Rs. ${BASE.totalAmount.toLocaleString()}`),
      `expected "Rs. ${BASE.totalAmount.toLocaleString()}"`
    );
    assert.ok(html.includes('Estimated Total:'));
  });

  test('includes a working call to action linking to the booking', () => {
    assert.ok(html.includes('View Booking Status'));
    assert.ok(
      html.includes(`${SITE_URL}/booking/success/ARS-123456`),
      'CTA must deep-link to the booking success page'
    );
  });
});

describe('customer name', () => {
  test('greets the customer by name in the salutation', () => {
    const html = generateBookingConfirmedEmailHtml(BASE);
    assert.ok(html.includes('Dear <strong>Ahmed Khan</strong>'));
  });

  test('a name with markup is escaped in the salutation', () => {
    const html = generateBookingConfirmedEmailHtml({
      ...BASE,
      customerName: '<b>Evil</b> & "Co"',
    });
    assert.ok(html.includes('Dear <strong>&lt;b&gt;Evil&lt;/b&gt; &amp; &quot;Co&quot;</strong>'));
    assert.ok(!html.includes('<b>Evil</b>'));
  });
});

describe('booking reference', () => {
  test('shows the reference as a labelled row', () => {
    const html = generateBookingConfirmedEmailHtml(BASE);
    assert.ok(html.includes('Booking Reference:'));
    assert.ok(html.includes('>ARS-123456</td>'), 'reference must be the row value');
  });

  test('a reference needing URL encoding is encoded in the CTA only', () => {
    const html = generateBookingConfirmedEmailHtml({
      ...BASE,
      bookingNumber: 'ARS 123&456',
    });
    assert.ok(
      html.includes(`${SITE_URL}/booking/success/ARS%20123%26456`),
      'href must be URL-encoded'
    );
    assert.ok(
      html.includes('<title>Booking Confirmed - ARS 123&amp;456</title>'),
      'displayed title must be HTML-escaped'
    );
    assert.ok(!html.includes('/booking/success/ARS 123&456'), 'raw reference must not leak');
  });
});

describe('vehicle information', () => {
  test('shows the vehicle and its rental type', () => {
    const html = generateBookingConfirmedEmailHtml(BASE);
    assert.ok(html.includes('Vehicle:'));
    assert.ok(html.includes('>Toyota Corolla</td>'));
    assert.ok(html.includes('Rental Type:'));
    assert.ok(html.includes('>Self Drive</td>'));
  });

  test('a vehicle name with markup is escaped', () => {
    const html = generateBookingConfirmedEmailHtml({
      ...BASE,
      vehicleName: 'Toyota <script>corolla</script>',
    });
    assert.ok(html.includes('Toyota &lt;script&gt;corolla&lt;/script&gt;'));
    assert.ok(!html.includes('<script>corolla</script>'));
  });
});

describe('booking dates and times', () => {
  test('shows pickup and return dates', () => {
    const html = generateBookingConfirmedEmailHtml(BASE);
    assert.ok(html.includes('Pickup Date:'));
    assert.ok(html.includes('>12 Oct 2026, 10:00</td>'));
    assert.ok(html.includes('Return Date:'));
    assert.ok(html.includes('>15 Oct 2026, 10:00</td>'));
  });

  test('a date containing markup is escaped', () => {
    const html = generateBookingConfirmedEmailHtml({
      ...BASE,
      pickupDate: '<img src=x>',
    });
    assert.ok(html.includes('&lt;img src=x&gt;'));
    assert.ok(!html.includes('<img src=x>'));
  });
});

describe('driver / chauffeur information where applicable', () => {
  test('a chauffeur booking states the chauffeur rental type', () => {
    const html = generateBookingConfirmedEmailHtml({ ...BASE, rentalType: 'Chauffeur' });
    assert.ok(html.includes('>Chauffeur</td>'));
    assert.ok(!html.includes('>Self Drive</td>'));
  });

  test('a self-drive booking states the self-drive rental type', () => {
    const html = generateBookingConfirmedEmailHtml({ ...BASE, rentalType: 'Self Drive' });
    assert.ok(html.includes('>Self Drive</td>'));
    assert.ok(!html.includes('>Chauffeur</td>'));
  });

  test('no driver name is invented when the data model has none', () => {
    const html = generateBookingConfirmedEmailHtml(BASE);
    // BookingEmailData carries no driver field; the template must not present
    // one, because a made-up driver name is worse than no driver name.
    assert.ok(!html.includes('Driver:'), 'must not render an empty/fabricated driver row');
    assert.ok(!html.includes('Chauffeur Name'));
  });
});

describe('pickup information', () => {
  test('shows pickup and drop-off locations', () => {
    const html = generateBookingConfirmedEmailHtml(BASE);
    assert.ok(html.includes('Pickup Location:'));
    assert.ok(html.includes('>Islamabad Airport</td>'));
    assert.ok(html.includes('Drop-off Location:'));
    assert.ok(html.includes('>Lahore City</td>'));
  });

  test('a location with markup and an ampersand is escaped', () => {
    const html = generateBookingConfirmedEmailHtml({
      ...BASE,
      pickupLocation: 'Islamabad & <Leh terminal>',
    });
    assert.ok(html.includes('>Islamabad &amp; &lt;Leh terminal&gt;</td>'));
    assert.ok(!html.includes('<Leh terminal>'));
  });
});

describe('expected confirmation wording', () => {
  const html = generateBookingConfirmedEmailHtml(BASE);

  test('states that the booking has been confirmed', () => {
    assert.ok(html.includes('has been <strong>confirmed</strong>'));
    assert.ok(html.includes('What happens next?'));
    assert.ok(html.includes('Please have your booking reference ready when you arrive.'));
  });

  test('never uses the booking-REQUEST wording', () => {
    // Regression: this template must not be a re-send of generateBookingEmailHtml,
    // whose copy says the request is still awaiting review.
    assert.ok(!html.includes('Booking Request Received'));
    assert.ok(!html.includes('We have received your booking request'));
    assert.ok(!html.includes('will review it shortly'));
    assert.ok(!html.includes('Booking Request - '));
  });

  test('the request template still says request, not confirmed', () => {
    const request = generateBookingEmailHtml(BASE);
    assert.ok(request.includes('Booking Request Received'));
    assert.ok(!request.includes('has been <strong>confirmed</strong>'));
  });

  test('the two templates are genuinely different documents', () => {
    const request = generateBookingEmailHtml(BASE);
    assert.notEqual(request, html);
    assert.ok(request.includes('Booking Request - ARS-123456'));
    assert.ok(html.includes('Booking Confirmed - ARS-123456'));
  });

  test('does not promise payment, refund or cancellation policy terms', () => {
    // The template must not state business policies it cannot verify.
    for (const banned of ['refund', 'Refund', 'no deposit', 'cancel free', 'payment received']) {
      assert.ok(!html.includes(banned), `must not claim "${banned}"`);
    }
  });
});

describe('missing optional fields', () => {
  test('omits the passengers row when passengers is null', () => {
    const html = generateBookingConfirmedEmailHtml({ ...BASE, passengers: null });
    assert.ok(!html.includes('Passengers:'), 'null passengers must not render a row');
    assert.ok(html.includes('Vehicle:'), 'the rest of the table must still render');
  });

  test('renders the passengers row when passengers is present', () => {
    const html = generateBookingConfirmedEmailHtml({ ...BASE, passengers: 4 });
    assert.ok(html.includes('Passengers:'));
    assert.ok(html.includes('>4</td>'));
  });

  test('omits the special-requests block when there are none', () => {
    const html = generateBookingConfirmedEmailHtml(BASE);
    assert.ok(!html.includes('Special Requests:'));
  });

  test('renders special requests when supplied, escaped, with line breaks', () => {
    const html = generateBookingConfirmedEmailHtml({
      ...BASE,
      specialRequests: 'Child seat please.\nSecond line <b>bold</b> & "quoted"',
    });
    assert.ok(html.includes('Special Requests:'));
    assert.ok(html.includes('Child seat please.<br>Second line &lt;b&gt;bold&lt;/b&gt; &amp; &quot;quoted&quot;'));
    assert.ok(!html.includes('<b>bold</b>'));
  });

  test('renders a zero total honestly instead of blanking the row', () => {
    const html = generateBookingConfirmedEmailHtml({ ...BASE, totalAmount: 0 });
    assert.ok(html.includes('Estimated Total:'));
    assert.ok(html.includes(`Rs. ${(0).toLocaleString()}`));
  });

  test('renders a fractional total', () => {
    const fractional = 45500.75;
    const html = generateBookingConfirmedEmailHtml({ ...BASE, totalAmount: fractional });
    assert.ok(
      html.includes(`Rs. ${fractional.toLocaleString()}`),
      `expected "Rs. ${fractional.toLocaleString()}" to survive intact`
    );
  });

  test('all optional-field combinations still produce a valid document', () => {
    const html = generateBookingConfirmedEmailHtml({
      bookingNumber: 'ARS-1',
      customerName: 'A',
      vehicleName: 'V',
      rentalType: 'Self Drive',
      pickupLocation: 'P',
      dropoffLocation: 'D',
      pickupDate: 'd1',
      returnDate: 'd2',
      passengers: null,
      totalAmount: 1,
    });
    assert.ok(html.trimStart().startsWith('<!DOCTYPE html>'));
    assert.ok(html.trimEnd().endsWith('</html>'));
    assert.ok(html.includes('Booking Confirmed'));
  });
});
