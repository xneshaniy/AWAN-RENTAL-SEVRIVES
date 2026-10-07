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
  title: 'Terms and Conditions',
  description:
    'The terms that apply when you use the Awan Rental Service website and when you request a vehicle rental from us.',
  alternates: { canonical: '/terms-and-conditions' },
  openGraph: {
    title: 'Terms and Conditions',
    description:
      'The terms that apply when you use the Awan Rental Service website and request a rental.',
    url: '/terms-and-conditions',
    type: 'article',
  },
};

const SECTIONS = [
  { id: 'acceptance', heading: 'Acceptance of these terms' },
  { id: 'who-we-are', heading: 'Who we are' },
  { id: 'what-the-site-is-for', heading: 'What this website is for' },
  { id: 'booking-requests', heading: 'Booking requests' },
  { id: 'no-online-payment', heading: 'Online payments' },
  { id: 'documents', heading: 'Driver eligibility and documents' },
  { id: 'prices', heading: 'Prices and charges' },
  { id: 'your-responsibilities', heading: 'Your responsibilities' },
  { id: 'insurance', heading: 'Insurance' },
  { id: 'third-party-services', heading: 'Third-party services' },
  { id: 'website-content', heading: 'Website content' },
  { id: 'liability', heading: 'Limitation of liability' },
  { id: 'governing-law', heading: 'Governing law' },
  { id: 'changes', heading: 'Changes to these terms' },
  { id: 'contact', heading: 'Contact us' },
] as const;

export default function TermsAndConditionsPage() {
  return (
    <LegalLayout
      title="Terms and Conditions"
      summary="These terms apply when you use this website and when you request a vehicle rental from Awan Rental Service. Please read them before you send a booking request."
      lastUpdated={LEGAL_LAST_UPDATED}
      sections={SECTIONS}
    >
      <LegalH2 id="acceptance">Acceptance of these terms</LegalH2>
      <LegalP>
        By using this website you agree to these terms. If you do not agree,
        please do not use the website.
      </LegalP>
      <LegalP>
        When you send us a booking request, these terms apply alongside whatever
        we confirm with you directly for that booking. If we confirm something
        specific with you that differs from a general statement here, what we
        confirmed for your booking takes priority.
      </LegalP>

      <LegalH2 id="who-we-are">Who we are</LegalH2>
      <LegalP>
        This website is operated by Awan Rental Service, a car rental and ground
        transportation service in Pakistan. In these terms, &quot;we&quot;,
        &quot;us&quot; and &quot;our&quot; mean Awan Rental Service.
      </LegalP>

      <LegalH2 id="what-the-site-is-for">What this website is for</LegalH2>
      <LegalP>
        This website is an information and enquiry channel. You can browse our
        vehicles and services, read about what we offer and send us a booking
        request or a message.
      </LegalP>
      <LegalP>
        The website is not a self-service checkout. Everything you send through
        it reaches our team, who will come back to you to confirm what is
        possible.
      </LegalP>

      <LegalH2 id="booking-requests">Booking requests are not confirmed bookings</LegalH2>
      <LegalNote>
        <p>
          Sending a booking request does not by itself confirm a reservation.
          Availability, the vehicle, the price and any conditions are only
          confirmed when we contact you and agree them with you.
        </p>
      </LegalNote>
      <LegalP>
        We will confirm your booking using the email address, phone number or
        WhatsApp number you gave us. A booking exists only once you have received
        that confirmation from us.
      </LegalP>
      <LegalP>
        We may be unable to accept a request if the vehicle is not available for
        your dates, if the route or requirements are outside what we can provide,
        or if we cannot reach you to confirm the details.
      </LegalP>

      <LegalH2 id="no-online-payment">Online payments</LegalH2>
      <LegalP>
        A deposit may be offered on your booking receipt page so you can secure
        your request online. That deposit is paid on SafePay&apos;s own hosted
        checkout pages: your card details are entered there and never on this
        website, so we never see or store them.
      </LegalP>
      <LegalP>
        Paying a deposit does not by itself confirm a rental. We still check
        availability and contact you first, and the balance of any rental price
        is agreed with you and paid offline. If you would rather not pay online,
        simply leave the deposit unpaid and everything can be settled when we
        speak to you.
      </LegalP>
      <LegalP>
        Payment terms are explained and agreed with you when we contact you after
        your request. Never send money to anyone claiming to accept payment on
        behalf of Awan Rental Service through a link you were not expecting.
      </LegalP>

      <LegalH2 id="documents">Driver eligibility and documents</LegalH2>
      <LegalP>
        Document requirements are confirmed with your booking. For self drive
        rentals you should keep a valid driving licence and a CNIC ready.
      </LegalP>
      <LegalP>
        The driver named on the booking must hold the documents we confirm to you
        before the rental starts, and must meet any age or licence condition we
        tell you about for the vehicle in question.
      </LegalP>

      <LegalH2 id="prices">Prices and charges</LegalH2>
      <LegalP>
        Any prices or rates shown on this website are indicative and are subject
        to confirmation with your booking. The final price depends on the vehicle,
        the dates, the route, the rental type and any options you ask for.
      </LegalP>
      <LegalP>
        Charges that apply to your rental, including any deposit, fuel, tolls,
        fines, waiting time or additional services, will be explained to you
        before you agree to the booking.
      </LegalP>

      <LegalH2 id="your-responsibilities">Your responsibilities</LegalH2>
      <LegalP>When you take a vehicle from us, you agree that you will:</LegalP>
      <LegalUl>
        <li>use the vehicle only in the way it is intended to be used</li>
        <li>obey all traffic laws and road rules that apply to you</li>
        <li>
          drive only if you hold a valid licence for that vehicle and are named
          as the driver on the booking
        </li>
        <li>
          return the vehicle at the agreed place and time, in the condition it
          was handed to you, fair wear and tear excepted
        </li>
        <li>
          tell us as soon as possible if anything goes wrong with the vehicle, or
          if it is damaged or involved in an incident
        </li>
        <li>
          not use the vehicle for illegal purposes, racing, hire-and-reward or
          any activity we have not agreed to
        </li>
      </LegalUl>
      <LegalP>
        Any specific conditions for your rental, such as mileage, fuel,
        geography or additional drivers, are confirmed with your booking.
      </LegalP>

      <LegalH2 id="insurance">Insurance</LegalH2>
      <LegalP>
        Insurance terms are confirmed with your booking. Please ask our team
        what is covered, what is excluded and what excess applies before you
        accept the rental. Nothing on this website should be read as a promise of
        cover.
      </LegalP>

      <LegalH2 id="third-party-services">Third-party services and links</LegalH2>
      <LegalP>
        This website links to third-party services, including WhatsApp, Google
        Maps and our social media pages. Those services are operated by their own
        providers under their own terms and privacy policies. We do not control
        them and are not responsible for them.
      </LegalP>
      <LegalP>
        When you tap a WhatsApp button, your message goes to WhatsApp and is
        handled by WhatsApp from that point on.
      </LegalP>

      <LegalH2 id="website-content">Website content</LegalH2>
      <LegalP>
        We take care to keep the information on this website accurate, including
        vehicle descriptions, images, availability and service details. However,
        vehicles and availability change, and details may be updated or removed
        without notice.
      </LegalP>
      <LegalP>
        Vehicle photographs are illustrative. The specific vehicle you are
        offered may differ in colour, model or specification from the one pictured
        unless we confirm otherwise with you.
      </LegalP>
      <LegalP>
        The content, design, text and logos on this website belong to us or are
        used with permission. You may view and print pages for your own personal
        use, but you may not reproduce or commercialise them without our written
        permission.
      </LegalP>

      <LegalH2 id="liability">Limitation of liability</LegalH2>
      <LegalP>
        We provide this website on an &quot;as is&quot; basis. We work to keep it
        available, accurate and secure, but we do not guarantee that it will
        always be free of errors, downtime or interruptions.
      </LegalP>
      <LegalP>
        To the extent the law allows, we are not responsible for losses that are
        indirect or consequential, or for losses caused by circumstances beyond
        our reasonable control, including technical faults, third-party services
        or events that prevent us from fulfilling a booking.
      </LegalP>
      <LegalP>
        Nothing in these terms limits any right or remedy you have under
        applicable consumer law, and nothing here limits our responsibility for
        death or personal injury caused by our negligence, or for fraud.
      </LegalP>

      <LegalH2 id="governing-law">Governing law</LegalH2>
      <LegalP>
        These terms are governed by the laws of Pakistan, and the courts of
        Pakistan have jurisdiction over any dispute arising from them or from your
        use of this website, unless applicable consumer law requires otherwise.
      </LegalP>

      <LegalH2 id="changes">Changes to these terms</LegalH2>
      <LegalP>
        We may update these terms from time to time. The date at the top of this
        page shows when they last changed. Changes apply from the moment they are
        published and do not affect bookings we have already confirmed with you.
      </LegalP>

      <LegalH2 id="contact">Contact us</LegalH2>
      <LegalP>If you have a question about these terms, contact us:</LegalP>
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
        <li>Or tap the WhatsApp button on any page to message us directly</li>
      </LegalUl>
      <LegalNote>
        <p>
          Also see our{' '}
          <Link href="/privacy-policy" className={LEGAL_LINK}>
            Privacy Policy
          </Link>
          , our{' '}
          <Link href="/cancellation-policy" className={LEGAL_LINK}>
            Cancellation and Refunds policy
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
