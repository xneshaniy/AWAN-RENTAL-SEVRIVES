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
  title: 'Privacy Policy',
  description:
    'How Awan Rental Service collects, uses, stores and protects the personal information you send through this website.',
  alternates: { canonical: '/privacy-policy' },
  openGraph: {
    title: 'Privacy Policy',
    description:
      'How Awan Rental Service handles the personal information you send through this website.',
    url: '/privacy-policy',
    type: 'article',
  },
};

const SECTIONS = [
  { id: 'who-we-are', heading: 'Who we are' },
  { id: 'what-we-collect', heading: 'What we collect' },
  { id: 'how-we-use-it', heading: 'How we use it' },
  { id: 'what-we-dont-do', heading: 'What we do not do' },
  { id: 'who-we-share-with', heading: 'Who we share it with' },
  { id: 'cookies', heading: 'Cookies' },
  { id: 'retention', heading: 'How long we keep it' },
  { id: 'your-rights', heading: 'Your rights' },
  { id: 'security', heading: 'How we protect it' },
  { id: 'children', heading: 'Children' },
  { id: 'changes', heading: 'Changes to this policy' },
  { id: 'contact', heading: 'Contact us' },
] as const;

export default function PrivacyPolicyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      summary="This page explains what information Awan Rental Service collects when you use this website, why we collect it, who we share it with and the choices you have."
      lastUpdated={LEGAL_LAST_UPDATED}
      sections={SECTIONS}
    >
      <LegalH2 id="who-we-are">Who we are</LegalH2>
      <LegalP>
        This website is operated by Awan Rental Service, a car rental and ground
        transportation service in Pakistan. In this policy, &quot;we&quot;,
        &quot;us&quot; and &quot;our&quot; mean Awan Rental Service.
      </LegalP>
      <LegalP>
        We are the controller of the personal information described on this page.
        If anything here is unclear, please contact us using the details at the
        bottom of this page and we will explain it.
      </LegalP>

      <LegalH2 id="what-we-collect">What we collect</LegalH2>
      <LegalP>
        We only ask for information we actually need in order to answer you and
        arrange your rental.
      </LegalP>
      <LegalP>When you send a booking request through this website, we collect:</LegalP>
      <LegalUl>
        <li>your full name</li>
        <li>your email address</li>
        <li>your phone number</li>
        <li>your WhatsApp number, if you choose to give it</li>
        <li>
          the type of rental you want (self drive, with driver, airport transfer,
          corporate or other)
        </li>
        <li>the vehicle you are interested in, if you selected one</li>
        <li>your pickup and drop-off locations</li>
        <li>your pickup and return dates and times</li>
        <li>your flight number, if you give one for an airport transfer</li>
        <li>the number of passengers and pieces of luggage</li>
        <li>anything you write in the special requests box</li>
      </LegalUl>
      <LegalP>When you send a message through our contact form, we collect:</LegalP>
      <LegalUl>
        <li>your full name, email address and phone number</li>
        <li>the subject you choose</li>
        <li>the contents of your message</li>
      </LegalUl>
      <LegalP>
        Like almost every website, our hosting provider also records standard
        server logs. These include your IP address, the time of your visit, the
        pages you requested and basic browser information. We use them for
        security and troubleshooting only.
      </LegalP>

      <LegalH2 id="how-we-use-it">How we use it</LegalH2>
      <LegalP>We use your information to:</LegalP>
      <LegalUl>
        <li>answer the question you asked</li>
        <li>
          check whether a vehicle is available for your dates, prepare your
          booking and confirm it with you
        </li>
        <li>
          send you booking-related emails, such as a confirmation of your request
          or an update about it
        </li>
        <li>
          keep a record of your booking so we can support you during and after
          the rental
        </li>
        <li>detect and prevent spam, abuse and fraudulent requests</li>
        <li>operate, maintain and improve this website</li>
      </LegalUl>
      <LegalP>
        The legal basis for this is that you have asked us to take steps before
        entering into a contract with you (your booking request), together with
        our legitimate interest in running and protecting our business.
      </LegalP>

      <LegalH2 id="what-we-dont-do">What we do not do</LegalH2>
      <LegalUl>
        <li>We do not sell, rent or trade your personal information.</li>
        <li>
          We do not collect payment card details on this website. There is no
          online checkout and no online payment.
        </li>
        <li>
          We do not run advertising trackers or advertising cookies on this
          website.
        </li>
        <li>
          We do not load Google Analytics, or any other analytics script, on this
          website.
        </li>
        <li>We do not build advertising profiles about you.</li>
      </LegalUl>

      <LegalH2 id="who-we-share-with">Who we share it with</LegalH2>
      <LegalP>
        We share your information only with the service providers needed to run
        this website and our business, and with you. Those providers are:
      </LegalP>
      <LegalUl>
        <li>
          our website hosting provider, which serves this website and stores its
          database
        </li>
        <li>
          our database provider, which stores your booking and contact records
        </li>
        <li>
          our email provider, which sends the emails we send to you
        </li>
        <li>
          WhatsApp, but only if and when you tap one of our WhatsApp buttons.
          From that moment your message is handled by WhatsApp under WhatsApp&apos;s
          own privacy policy.
        </li>
        <li>
          Google, but only for the customer reviews displayed on our homepage,
          which our server fetches from the Google Places API. Browsing this
          website does not send your details to Google.
        </li>
      </LegalUl>
      <LegalP>
        We may also disclose your information if we are legally required to do so
        by a court or a lawful authority request, or if we need to protect our
        rights, our customers or the public.
      </LegalP>

      <LegalH2 id="cookies">Cookies</LegalH2>
      <LegalP>
        This website does not use advertising or analytics cookies. The only
        cookies we set are the ones needed for an administrator to sign in to the
        back office of this website.
      </LegalP>
      <LegalP>
        For the full list, read our{' '}
        <Link href="/cookie-policy" className={LEGAL_LINK}>
          Cookie Policy
        </Link>
        .
      </LegalP>

      <LegalH2 id="retention">How long we keep it</LegalH2>
      <LegalP>
        We keep booking and contact records for as long as we need them to run
        our business, answer follow-up questions and keep our records accurate.
        When they are no longer needed, we delete them.
      </LegalP>
      <LegalP>
        Server logs are kept by our hosting provider for a short operational
        period and are then deleted automatically.
      </LegalP>

      <LegalH2 id="your-rights">Your rights</LegalH2>
      <LegalP>
        Depending on where you live, you may have the right to ask us for a copy
        of the personal information we hold about you, to correct it, to ask us
        to delete it, to restrict or object to how we use it, or to ask for it to
        be handed to another provider.
      </LegalP>
      <LegalP>
        To exercise any of those rights, email us. We may need to confirm your
        identity before we act on the request, and we will respond within the
        time the law allows.
      </LegalP>

      <LegalH2 id="security">How we protect it</LegalH2>
      <LegalUl>
        <li>This website is served over HTTPS.</li>
        <li>
          Database, API and email credentials are stored in server-side
          environment variables and are never sent to your browser.
        </li>
        <li>
          Staff and administrator passwords are stored hashed, never as readable
          text.
        </li>
        <li>
          Sign-in attempts, booking submissions and contact submissions are rate
          limited to protect against abuse and brute-force attacks.
        </li>
        <li>Only authorised staff can access the back office.</li>
      </LegalUl>
      <LegalP>
        No method of transmitting or storing information over the internet is
        completely secure. We take reasonable care to protect your information,
        but we cannot promise absolute security.
      </LegalP>

      <LegalH2 id="children">Children</LegalH2>
      <LegalP>
        This website is aimed at adults arranging vehicle rentals. It is not
        directed at anyone under 18, and we do not knowingly collect their
        information. If you believe a child has given us information, contact us
        and we will delete it.
      </LegalP>

      <LegalH2 id="changes">Changes to this policy</LegalH2>
      <LegalP>
        We may update this policy from time to time. The date shown at the top of
        this page tells you when it last changed. If a change materially affects
        how we use the information you have already given us, we will try to
        tell you.
      </LegalP>

      <LegalH2 id="contact">Contact us</LegalH2>
      <LegalP>
        For a question, a request or a complaint about your personal
        information, contact us:
      </LegalP>
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
        <li>
          Or tap the WhatsApp button on any page to message us directly
        </li>
      </LegalUl>
      <LegalNote>
        <p>
          You can also read our{' '}
          <Link href="/terms-and-conditions" className={LEGAL_LINK}>
            Terms and Conditions
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
