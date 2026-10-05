'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

/** Measurement id from the environment; false means "do nothing at all". */
export function isAnalyticsEnabled(): boolean {
  return Boolean(GA_ID);
}

function gtag(...args: unknown[]) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(args);
}

/**
 * Google Analytics 4 page-view beacon.
 *
 * Renders nothing and loads nothing unless NEXT_PUBLIC_GA_ID is set, so a
 * deployment without analytics pays no cost: no extra request, no console
 * noise, no layout shift.
 *
 * The query string is read from window.location inside the effect rather than
 * through useSearchParams, deliberately: useSearchParams would force a Suspense
 * boundary onto every page that renders this component. Filtered vehicle
 * listings (/vehicles?q=...&category=...) still report their filters because
 * the URL has already changed by the time the pathname effect runs.
 */
export function GoogleAnalytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (!GA_ID) return;
    if (typeof window === 'undefined') return;

    // An ad-blocker or a failed network fetch must never break the page.
    try {
      const query = window.location.search;
      gtag('event', 'page_view', {
        page_location: window.location.href,
        page_path: pathname + query,
        page_title: document.title,
      });
    } catch {
      // Analytics is best-effort by definition.
    }
  }, [pathname]);

  if (!GA_ID) return null;

  return (
    <>
      <script
        async
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        suppressHydrationWarning
      />
      <script
        dangerouslySetInnerHTML={{
          __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}',{send_page_view:false});`,
        }}
        suppressHydrationWarning
      />
    </>
  );
}
