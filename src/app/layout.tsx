import { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import { Providers } from './providers';
import { Toaster } from 'react-hot-toast';
import { SITE_URL, SITE_NAME } from '@/config/site';
import { getSEOConfig, getBusinessInfo } from '@/lib/settings';
import { buildStructuredDataGraph } from '@/lib/seo';
import { getContentSecurityPolicy } from '@/config/security-headers';
import { GoogleAnalytics } from '@/components/common/GoogleAnalytics';

const GOOGLE_SITE_VERIFICATION = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;

/**
 * Site-wide metadata, driven by the SEO values in Site Settings (Admin >
 * Site Settings > SEO) so title, description and social image are
 * configurable without deploys. `openGraph` deliberately omits
 * title/description: Next.js then derives them per page from the resolved
 * (templated) title and page description, keeping every page unique.
 */
export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSEOConfig();

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: seo.title,
      template: `%s | ${SITE_NAME}`,
    },
    description: seo.description,
    keywords: ['car rental pakistan', 'car rental islamabad', 'rent a car rawalpindi', 'car rental lahore', 'chauffeur service pakistan', 'airport transfer islamabad', 'corporate car rental pakistan'],
    authors: [{ name: SITE_NAME }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    robots: 'index, follow',
    // The PWA manifest was shipped in public/ but never linked, so installable
    // metadata and the themed icons never reached the browser.
    manifest: '/site.webmanifest',
    openGraph: {
      type: 'website',
      locale: 'en_PK',
      siteName: SITE_NAME,
      // Without an explicit url Next leaves og:url empty on every page, which
      // makes social scrapers fall back to the canonical - and WhatsApp/
      // Facebook then pick the wrong share target when the domain changes.
      url: SITE_URL,
      images: [
        {
          url: seo.ogImage,
          width: 1200,
          height: 630,
          alt: SITE_NAME,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      images: [seo.ogImage],
    },
    ...(GOOGLE_SITE_VERIFICATION
      ? { verification: { google: GOOGLE_SITE_VERIFICATION } }
      : {}),
  };
}

/**
 * Root layout. Renders the site-wide JSON-LD graph (Organization, WebSite,
 * LocalBusiness + AutoRental) built exclusively from real SiteSettings
 * values — no ratings, reviews, prices or other invented claims.
 */
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const businessInfo = await getBusinessInfo();
  const structuredData = buildStructuredDataGraph(businessInfo);

  return (
    <html lang="en" className="antialiased">
      <head>
        {/*
          The same Content-Security-Policy that next.config.js puts on the
          response header, mirrored as a meta tag because Hostinger's platform
          rewrites that one header back to `upgrade-insecure-requests` while
          leaving the headers around it untouched. A meta element is not
          rewritten, so this is what actually takes effect in production.

          It is deliberately the first child of <head>: the policy applies from
          wherever the element is parsed, so putting it first covers the
          preconnects, the stylesheets and every script below it.

          `frame-ancestors` is dropped because browsers ignore it when it is
          delivered via meta - clickjacking stays covered by the
          X-Frame-Options: DENY header set in next.config.js.

          Full rationale (including why 'unsafe-inline' is unavoidable here)
          lives in src/config/security-headers.js, which is the single source
          for both forms.
        */}
        <meta
          httpEquiv="Content-Security-Policy"
          content={getContentSecurityPolicy({ includeFrameAncestors: false })}
        />
        {/* Fonts are self-hosted through next/font above - no runtime Google
            Fonts requests, so no preconnects to fonts.googleapis.com. */}
        <link rel="dns-prefetch" href="https://wa.me" />
        {/* gtag.js is the only third-party script on the page. Opening the
            connection while the head is still parsing means the analytics
            fetch (which runs after hydration) no longer pays DNS + TCP + TLS
            out of the measured window. No crossorigin attribute: the script is
            fetched as a classic script, so the non-CORS connection is the one
            that must be warmed up. */}
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        {/* Google Tag Manager */}
        <Script
          id="gtm-loader"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-5X33KSKR');`,
          }}
        />
        {/* Apollo.io Website Tracker */}
        <Script
          id="apollo-tracker"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `function initApollo(){var n=Math.random().toString(36).substring(7),o=document.createElement("script");
o.src="https://assets.apollo.io/micro/website-tracker/tracker.iife.js?nocache="+n,o.async=!0,o.defer=!0,
o.onload=function(){window.trackingFunctions.onLoad({appId:"6acb54920fd5510010c02fa7"})},
document.head.appendChild(o)}initApollo();`,
          }}
        />
        <Script
          id="site-structured-data"
          type="application/ld+json"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      {/*
        No bg-/text- utilities here: globals.css already does
        `@apply bg-background text-foreground` on body, and those two tokens are
        the ones that flip for dark mode (--background goes to hsl(222 84% 5%),
        --foreground to near-white). The utilities used to sit on top of that and
        pin dark mode to bg-gray-50 + text-gray-100 - near-white text on a
        near-white page, 1.05:1, unreadable for anyone whose OS prefers dark.
      */}
      <body className="font-sans min-h-screen">
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-5X33KSKR"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-700 focus:shadow-lg"
        >
          Skip to main content
        </a>
        <Providers>{children}</Providers>
        {/* Renders nothing unless NEXT_PUBLIC_GA_ID is configured. */}
        <GoogleAnalytics />
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1f2937',
              color: '#fff',
              borderRadius: '12px',
              padding: '16px',
            },
            success: {
              iconTheme: {
                primary: '#22c55e',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </body>
    </html>
  );
}
