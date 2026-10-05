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
  title: 'Rental Terms',
  description:
    'The conditions that apply to a vehicle rental with Awan Rental Service: eligibility and documents, mileage, fuel, delivery, chauffeur option, extensions, cancellation and vehicle return.',
  alternates: { canonical: '/rental-terms' },
  openGraph: {
    title: 'Rental Terms',
    description:
      'Mileage, fuel, delivery, chauffeur, extensions, cancellation and return conditions for an Awan Rental Service rental.',
    url: '/rental-terms',
    type: 'article',
  },
};

/**
 * Rental-specific conditions only. Anything covered by the general website
 * terms (liability, insurance wording, governing law) is cross-linked from
 * the final section rather than restated, so the two documents cannot drift
 * apart. Every statement below restates content already published elsewhere
 * on this site - no rates, distances or periods have been invented here.
 */
const SECTIONS = [
  { id: 'scope', heading: 'What these terms cover' },
  { id: 'eligibility', heading: 'Who can drive' },
  { id: 'confirming', heading: 'Confirming a rental' },
  { id: 'mileage', heading: 'Mileage' },
  { id: 'fuel', heading: 'Fuel' },
  { id: 'delivery', heading: 'Delivery and pickup' },
  { id: 'chauffeur', heading: 'Chauffeur-driven rentals' },
  { id: 'changes', heading: 'Changes and extensions' },
  { id: 'cancellation', heading: 'Cancellation' },
  { id: 'return', heading: 'Returning the vehicle' },
  { id: 'other-terms', heading: 'Other terms that apply' },
  { id: 'contact', heading: 'Contact us' },
] as const;

export default function RentalTermsPage() {
  return (
    <LegalLayout
      title="Rental Terms"
      summary="These terms cover the rental itself: who can drive, what is included in the price, mileage and fuel, delivery, the chauffeur option, extensions, cancellation and returning the vehicle. They apply alongside our general website terms."
      lastUpdated={LEGAL_LAST_UPDATED}
      sections={SECTIONS}
    >
      <LegalH2 id="scope">What these terms cover</LegalH2>
      <LegalP>
        This page explains the conditions that apply when you rent a vehicle
        from Awan Rental Service. It should be read together with our{' '}
        <Link href="/terms-and-conditions" className={LEGAL_LINK}>
          Terms and Conditions
        </Link>
        , which cover the website itself and the general terms of doing business
        with us.
      </LegalP>
      <LegalNote>
        <p>
          Nothing on this page is a confirmed offer. The vehicle, the dates, the
          price and any conditions specific to your rental are only agreed once
          we have contacted you and confirmed them.
        </p>
      </LegalNote>

      <LegalH2 id="eligibility">Who can drive</LegalH2>
      <LegalP>
        For a self-drive rental you will need a valid driving licence and a
        CNIC or Passport. We accept Pakistani and international licences.
      </LegalP>
      <LegalP>
        The driver must be the person named on the booking and must meet any
        licence or age condition we confirm to you for the vehicle you have
        chosen. Only drivers we have confirmed may drive the vehicle.
      </LegalP>

      <LegalH2 id="confirming">Confirming a rental</LegalH2>
      <LegalP>
        Sending a request through this website does not on its own reserve a
        vehicle. We confirm availability, the vehicle, the price and any
        conditions with you directly, using the phone number, email address or
        WhatsApp number you gave us.
      </LegalP>
      <LegalP>
        A rental exists only once you have received that confirmation from us.
        Please wait for it before making travel arrangements that depend on the
        vehicle.
      </LegalP>

      <LegalH2 id="mileage">Mileage</LegalH2>
      <LegalP>
        Most rentals include a generous daily mileage limit. Unlimited mileage
        options are available for selected vehicles and rental plans.
      </LegalP>
      <LegalP>
        The mileage terms that apply to your rental are confirmed with your
        booking, so please check them before you accept. Rates shown on a
        vehicle page are indicative and are confirmed when we agree the booking
        with you.
      </LegalP>

      <LegalH2 id="fuel">Fuel</LegalH2>
      <LegalP>
        Fuel is not included in the rental price and is charged separately.
        Toll taxes, fines, waiting time and any additional services you ask for
        are also charged separately.
      </LegalP>
      <LegalP>
        Every charge that will apply to your rental is explained to you before
        you agree to the booking. No payment of any kind is taken through this
        website.
      </LegalP>

      <LegalH2 id="delivery">Delivery and pickup</LegalH2>
      <LegalP>
        We offer vehicle delivery and pickup within Islamabad, Rawalpindi and
        Lahore for an additional fee. Request this when you book so we can
        confirm it for your dates and location.
      </LegalP>
      <LegalP>
        Airport pickup and drop-off can also be arranged for Islamabad
        International Airport, Lahore Allama Iqbal International Airport and
        other major airports in Pakistan.
      </LegalP>

      <LegalH2 id="chauffeur">Chauffeur-driven rentals</LegalH2>
      <LegalP>
        A chauffeur is available for all vehicle categories if you would rather
        not drive. Chauffeur-driven arrangements are confirmed with your
        booking, including the driver&apos;s allowance and any waiting time.
      </LegalP>
      <LegalP>
        Ask for this when you enquire, or use the{' '}
        <Link href="/chauffeur-service" className={LEGAL_LINK}>
          chauffeur service
        </Link>{' '}
        pages to see how the service works.
      </LegalP>

      <LegalH2 id="changes">Changes and extensions</LegalH2>
      <LegalP>
        If you want to extend your rental, contact us at least 24 hours before
        your scheduled return. Extensions depend on the vehicle being available
        for the extra dates.
      </LegalP>
      <LegalP>
        Changes to the dates, times, vehicle or route are agreed only once we
        have confirmed that the new arrangement is available. Please do not
        assume a change has taken effect until you hear back from us.
      </LegalP>

      <LegalH2 id="cancellation">Cancellation</LegalH2>
      <LegalP>
        Cancellations are free up to 24 hours before pickup. A cancellation
        made within 24 hours of the scheduled pickup may incur a fee.
      </LegalP>
      <LegalP>
        The full rules, including how to cancel and how refunds of any payment
        made directly to us are handled, are set out in our{' '}
        <Link href="/cancellation-policy" className={LEGAL_LINK}>
          Cancellation and Refund Policy
        </Link>
        .
      </LegalP>

      <LegalH2 id="return">Returning the vehicle</LegalH2>
      <LegalP>
        Return the vehicle at the place and by the time agreed in your booking,
        in the condition it was handed to you, fair wear and tear excepted.
      </LegalP>
      <LegalP>
        Tell us as soon as possible if anything goes wrong with the vehicle, or
        if it is damaged or involved in an incident. Report any issue promptly
        so we can help you resolve it.
      </LegalP>
      <LegalP>
        You agree to use the vehicle only as it is intended to be used, to obey
        all applicable traffic laws, and not to use it for illegal purposes,
        racing, hire-and-reward or any activity we have not agreed to.
      </LegalP>

      <LegalH2 id="other-terms">Other terms that apply</LegalH2>
      <LegalP>
        The following documents form part of the terms of your rental and are
        available here on the website:
      </LegalP>
      <LegalUl>
        <li>
          <Link href="/terms-and-conditions" className={LEGAL_LINK}>
            Terms and Conditions
          </Link>{' '}
          - the general terms, including prices, insurance and liability
        </li>
        <li>
          <Link href="/cancellation-policy" className={LEGAL_LINK}>
            Cancellation and Refund Policy
          </Link>{' '}
          - cancellation, changes and refunds
        </li>
        <li>
          <Link href="/privacy-policy" className={LEGAL_LINK}>
            Privacy Policy
          </Link>{' '}
          - how we handle the information you send us
        </li>
        <li>
          <Link href="/cookie-policy" className={LEGAL_LINK}>
            Cookie Policy
          </Link>{' '}
          - how this website uses cookies
        </li>
      </LegalUl>
      <LegalP>
        Where we confirm something specific to your booking that differs from a
        general statement on this page, what we confirmed for your booking takes
        priority.
      </LegalP>

      <LegalH2 id="contact">Contact us</LegalH2>
      <LegalP>
        If anything here is unclear, ask us before you accept a booking. You can
        reach us by WhatsApp, phone or email:
      </LegalP>
      <LegalUl>
        <li>Email: {CONTACT_EMAIL}</li>
        <li>
          <Link href="/contact" className={LEGAL_LINK}>
            Contact page
          </Link>{' '}
          - WhatsApp button, phone number and the enquiry form
        </li>
        <li>
          <Link href="/faq" className={LEGAL_LINK}>
            Frequently Asked Questions
          </Link>{' '}
          - quick answers to the questions we hear most often
        </li>
      </LegalUl>
    </LegalLayout>
  );
}
