import { Metadata } from 'next';
import { Inter, Poppins } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Toaster } from 'react-hot-toast';
import { SITE_URL, SITE_NAME } from '@/config/site';
import { getSEOConfig, getBusinessInfo } from '@/lib/settings';
import { buildStructuredDataGraph } from '@/lib/seo';

const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' });
const poppins = Poppins({ subsets: ['latin'], display: 'swap', variable: '--font-poppins', weight: ['400', '500', '600', '700'] });

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
    openGraph: {
      type: 'website',
      locale: 'en_PK',
      siteName: SITE_NAME,
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
    <html lang="en" className={`${inter.variable} ${poppins.variable} antialiased`}>
      <head>
        {/* Fonts are self-hosted through next/font above - no runtime Google
            Fonts requests, so no preconnects to fonts.googleapis.com. */}
        <link rel="dns-prefetch" href="https://wa.me" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className="font-sans text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-50 min-h-screen">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-700 focus:shadow-lg"
        >
          Skip to main content
        </a>
        <Providers>{children}</Providers>
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
