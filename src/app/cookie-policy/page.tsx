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
  title: 'Cookie Policy',
  description:
    'The cookies used by the Awan Rental Service website: what they are, which ones we set, and how to control them.',
  alternates: { canonical: '/cookie-policy' },
  openGraph: {
    title: 'Cookie Policy',
    description:
      'The cookies used by the Awan Rental Service website and how to control them.',
    url: '/cookie-policy',
    type: 'article',
  },
};

const SECTIONS = [
  { id: 'what-are-cookies', heading: 'What are cookies?' },
  { id: 'cookies-we-use', heading: 'Cookies we set' },
  { id: 'cookies-we-do-not-use', heading: 'What we do not use' },
  { id: 'third-party-services', heading: 'Third-party services' },
  { id: 'managing-cookies', heading: 'Managing cookies' },
  { id: 'changes', heading: 'Changes to this policy' },
  { id: 'contact', heading: 'Contact us' },
] as const;

export default function CookiePolicyPage() {
  return (
    <LegalLayout
      title="Cookie Policy"
      summary="This page explains what cookies are, which cookies this website actually uses, and how you can control them. The short version: this site uses very few."
      lastUpdated={LEGAL_LAST_UPDATED}
      sections={SECTIONS}
    >
      <LegalH2 id="what-are-cookies">What are cookies?</LegalH2>
      <LegalP>
        Cookies are small text files that a website asks your browser to store on
        your device. They let a website remember things between page loads, such
        as whether you are signed in.
      </LegalP>
      <LegalP>
        Cookies can be &quot;first-party&quot;, which means set by this website,
        or &quot;third-party&quot;, which means set by another service embedded in
        the page. They can be temporary, expiring when you close your browser, or
        persistent, staying until they expire or you delete them.
      </LegalP>

      <LegalH2 id="cookies-we-use">Cookies this website sets</LegalH2>
      <LegalP>
        The public pages of this website — the homepage, vehicles, services,
        booking, blog, about and contact — do not set any cookie. You can browse
        the whole site without being tracked and without accepting anything.
      </LegalP>
      <LegalP>
        The only cookies this website sets are created when a member of our staff
        signs in to the back office to manage vehicles, bookings, messages and
        settings. Those cookies are:
      </LegalP>
      <LegalUl>
        <li>
          <strong className="text-gray-900 dark:text-white">Session cookie</strong>{' '}
          — keeps the administrator signed in as they move between pages of the
          back office. It expires when the session ends.
        </li>
        <li>
          <strong className="text-gray-900 dark:text-white">CSRF cookie</strong>{' '}
          — a security cookie that helps confirm that a sign-in attempt really
          came from a person using our site, and not from another website.
        </li>
        <li>
          <strong className="text-gray-900 dark:text-white">Preference cookie</strong>{' '}
          — remembers where to send the administrator after signing in.
        </li>
      </LegalUl>
      <LegalNote>
        <p>
          These cookies are strictly necessary for the back office to work. They
          are not used to track you, they are never shared with advertisers, and
          clearing them only signs the administrator out.
        </p>
      </LegalNote>

      <LegalH2 id="cookies-we-do-not-use">What we do not use</LegalH2>
      <LegalP>This website does not use:</LegalP>
      <LegalUl>
        <li>advertising or retargeting cookies</li>
        <li>Google Analytics, or any other analytics tool</li>
        <li>social media pixels or embedded like/share buttons</li>
        <li>cross-site tracking or behavioural profiling</li>
        <li>
          cookies from font or advertising networks — our fonts are served
          directly from this website
        </li>
      </LegalUl>
      <LegalP>
        Because we do not use non-essential cookies, there is no cookie consent
        banner on this website. There is nothing to accept.
      </LegalP>

      <LegalH2 id="third-party-services">Third-party services</LegalH2>
      <LegalP>
        Some pages link out to services run by other companies. Those companies
        may set their own cookies once you choose to visit them, under their own
        policies. Examples include:
      </LegalP>
      <LegalUl>
        <li>
          <strong className="text-gray-900 dark:text-white">WhatsApp</strong> —
          when you tap a WhatsApp button you are taken to WhatsApp, which is
          operated by Meta
        </li>
        <li>
          <strong className="text-gray-900 dark:text-white">Google Maps and Google Reviews</strong>{' '}
          — links that take you to Google to see our location or read our reviews
        </li>
        <li>
          <strong className="text-gray-900 dark:text-white">Social media</strong>{' '}
          — links to our Facebook, Instagram and LinkedIn pages
        </li>
      </LegalUl>
      <LegalP>
        Following one of these links is your choice. We do not load their
        content into this website, so no cookie is set until you click through.
      </LegalP>

      <LegalH2 id="managing-cookies">Managing cookies in your browser</LegalH2>
      <LegalP>
        You can see, block and delete cookies using your browser settings.
        Almost every browser lets you do this under Settings or Preferences, in a
        section usually called &quot;Privacy&quot;, &quot;Cookies&quot; or
        &quot;Site data&quot;.
      </LegalP>
      <LegalUl>
        <li>
          You can delete all cookies already stored on your device at any time
        </li>
        <li>
          You can block cookies entirely, or allow only first-party cookies
        </li>
        <li>
          You can set your browser to delete cookies every time you close it
        </li>
        <li>
          Your browser may also tell you when a site tries to set a cookie
        </li>
      </LegalUl>
      <LegalP>
        Blocking cookies will not stop you using this website — the public pages
        work without any. The only effect is that an administrator will not be
        able to stay signed in to the back office.
      </LegalP>
      <LegalP>
        Your device may also offer a &quot;Do Not Track&quot; setting. Because
        this website does not track you, we do not need to act on it, but
        switching it on will not affect how the site works.
      </LegalP>

      <LegalH2 id="changes">Changes to this policy</LegalH2>
      <LegalP>
        We may update this policy if the way this website works changes. The date
        at the top of this page tells you when it last changed.
      </LegalP>

      <LegalH2 id="contact">Contact us</LegalH2>
      <LegalP>If you have a question about cookies on this website, contact us:</LegalP>
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
          <Link href="/terms-and-conditions" className={LEGAL_LINK}>
            Terms and Conditions
          </Link>{' '}
          and our{' '}
          <Link href="/cancellation-policy" className={LEGAL_LINK}>
            Cancellation and Refunds policy
          </Link>
          .
        </p>
      </LegalNote>
    </LegalLayout>
  );
}
