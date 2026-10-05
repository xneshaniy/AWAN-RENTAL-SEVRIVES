import { Metadata } from 'next';
import Link from 'next/link';
import { CONTACT_EMAIL, LEGAL_LAST_UPDATED } from '@/config/site';
import {
  LegalLayout,
  LegalH2,
  LegalP,
  LegalUl,
  LegalNote,
  LEGAL_LINK,
} from '@/components/layout/LegalLayout';

export const metadata: Metadata = {
  title: 'Cancellation and Refunds',
  description:
    'How to cancel or change an Awan Rental Service booking, how refunds are handled, and what happens if we cannot fulfil your booking.',
  alternates: { canonical: '/cancellation-policy' },
  openGraph: {
    title: 'Cancellation and Refunds',
    description:
      'How to cancel or change a booking with Awan Rental Service, and how refunds are handled.',
    url: '/cancellation-policy',
    type: 'article',
  },
};

const SECTIONS = [
  { id: 'in-short', heading: 'In short' },
  { id: 'how-to-cancel', heading: 'How to cancel or change' },
  { id: 'when-it-takes-effect', heading: 'When it takes effect' },
  { id: 'no-online-payment', heading: 'No online payment' },
  { id: 'refunds', heading: 'Refunds' },
  { id: 'changes-and-no-shows', heading: 'Changes and no-shows' },
  { id: 'if-we-cannot-provide', heading: 'If we cannot provide' },
  { id: 'ask-before-you-book', heading: 'Ask us before you book' },
  { id: 'contact', heading: 'Contact us' },
] as const;

export default function CancellationPolicyPage() {
  return (
    <LegalLayout
      title="Cancellation and Refunds"
      summary="Plans change. This page explains how to cancel or change an Awan Rental Service booking, when a cancellation takes effect, and how refunds are handled."
      lastUpdated={LEGAL_LAST_UPDATED}
      sections={SECTIONS}
    >
      <LegalH2 id="in-short">In short</LegalH2>
      <LegalNote>
        <p>
          To cancel or change a booking, contact us on WhatsApp or by phone and
          we will help you. No payment is taken through this website, so there is
          nothing to refund through the site. Any terms that apply to your
          specific booking are the ones we confirmed with you when the booking
          was agreed.
        </p>
      </LegalNote>

      <LegalH2 id="how-to-cancel">How to cancel or change a booking</LegalH2>
      <LegalP>The quickest ways to cancel or amend a booking are:</LegalP>
      <LegalUl>
        <li>
          <strong className="text-gray-900 dark:text-white">WhatsApp</strong> —
          tap the WhatsApp button on any page and tell us your booking reference
          or the name and date of the booking
        </li>
        <li>
          <strong className="text-gray-900 dark:text-white">Phone</strong> —
          call us using the number on our{' '}
          <Link href="/contact" className={LEGAL_LINK}>
            contact page
          </Link>
        </li>
        <li>
          <strong className="text-gray-900 dark:text-white">Contact form</strong>{' '}
          — send a message through the same page if you prefer to put it in
          writing
        </li>
      </LegalUl>
      <LegalP>
        Please include your booking reference if you have one. It helps us find
        your booking immediately and avoid any doubt about when you contacted us.
      </LegalP>

      <LegalH2 id="when-it-takes-effect">When a cancellation takes effect</LegalH2>
      <LegalP>
        A cancellation is only confirmed once we tell you that it has been
        processed. If you send a request and do not hear back from us, please
        follow up by WhatsApp or phone so that we can confirm it.
      </LegalP>
      <LegalP>
        We will confirm any change to dates, times, vehicle or route in the same
        way, and a change is only agreed once we have confirmed that the new
        arrangement is available.
      </LegalP>

      <LegalH2 id="no-online-payment">No payment is taken on this website</LegalH2>
      <LegalP>
        This website does not take payments. There is no checkout, no card form
        and no deposit collected online. Payment terms are agreed with you
        directly once we have contacted you about your request.
      </LegalP>

      <LegalH2 id="refunds">Refunds</LegalH2>
      <LegalP>
        Because no money is collected through this website, there is no online
        refund process here and no refund can be issued through the site.
      </LegalP>
      <LegalP>
        If you have paid us directly, any refund is handled under the payment and
        cancellation terms confirmed to you for your booking. We will tell you
        what applies, how much is refundable and how long the refund will take
        before we process it.
      </LegalP>
      <LegalP>
        Refunds are returned by the same method you paid with wherever that is
        possible. The time it takes to reach you also depends on your bank or
        payment provider.
      </LegalP>

      <LegalH2 id="changes-and-no-shows">Changes, late arrivals and no-shows</LegalH2>
      <LegalP>
        Changing a booking is subject to availability. If your new dates or
        vehicle are not available, we will offer you the closest alternative we
        can, or cancel the booking, and we will explain what that means for any
        amount you have paid.
      </LegalP>
      <LegalP>
        If you do not take collection of the vehicle at the agreed time and do
        not tell us, that is treated as a no-show. Please contact us as early as
        you can if you are delayed, so that we can hold the vehicle for you.
      </LegalP>
      <LegalP>
        One-way rentals and out-of-town arrangements depend on availability, so a
        change to the route or drop-off point may not always be possible.
      </LegalP>

      <LegalH2 id="if-we-cannot-provide">If we cannot provide the vehicle</LegalH2>
      <LegalP>
        If, for reasons beyond our control, we cannot supply the vehicle you
        booked, we will contact you as soon as we can. We will either offer you a
        suitable alternative vehicle, rearrange the booking, or cancel it and
        refund anything you have paid us for the part of the booking we could not
        provide.
      </LegalP>

      <LegalH2 id="ask-before-you-book">Ask us before you book</LegalH2>
      <LegalP>
        Cancellation terms can differ between bookings, for example because of
        the rental type, the length of the rental, the season or the route.
        Rather than guess, ask us before you confirm and we will tell you exactly
        what applies to your booking.
      </LegalP>
      <LegalP>
        Our{' '}
        <Link href="/terms-and-conditions" className={LEGAL_LINK}>
          Terms and Conditions
        </Link>{' '}
        also apply to every booking.
      </LegalP>

      <LegalH2 id="contact">Contact us</LegalH2>
      <LegalP>To cancel, change or ask about a booking:</LegalP>
      <LegalUl>
        <li>
          Email:{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className={LEGAL_LINK}>
            {CONTACT_EMAIL}
          </a>
        </li>
        <li>
          Use our{' '}
          <Link href="/contact" className={LEGAL_LINK}>
            contact page
          </Link>
        </li>
        <li>Tap the WhatsApp button on any page to message us directly</li>
      </LegalUl>
      <LegalNote>
        <p>
          Also see our{' '}
          <Link href="/privacy-policy" className={LEGAL_LINK}>
            Privacy Policy
          </Link>
          , our{' '}
          <Link href="/terms-and-conditions" className={LEGAL_LINK}>
            Terms and Conditions
          </Link>{' '}
          and our{' '}
          <Link href="/cookie-policy" className={LEGAL_LINK}>
            Cookie Policy
          </Link>
          .
        </p>
      </LegalNote>
    </LegalLayout>
  );
}
