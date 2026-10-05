'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, Home, RefreshCw, MessageCircle } from 'lucide-react';

/**
 * Last-resort boundary. It replaces the ROOT layout, so it must render its own
 * <html> and <body> - otherwise the browser gets a half-built document on a
 * server crash. Everything here is deliberately dependency-free (no site
 * providers, no data fetching, no design-system imports) because the components
 * those rely on are exactly what may have failed.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled application error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem 1rem',
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          background: '#f9fafb',
          color: '#111827',
        }}
      >
        <main
          style={{
            maxWidth: '32rem',
            width: '100%',
            textAlign: 'center',
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '1rem',
            padding: '2.5rem 1.5rem',
            boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
          }}
        >
          <div
            style={{
              width: '4rem',
              height: '4rem',
              margin: '0 auto 1.25rem',
              borderRadius: '9999px',
              background: '#fee2e2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AlertTriangle size={32} color="#dc2626" aria-hidden="true" />
          </div>

          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0 0 0.75rem' }}>
            Something went wrong
          </h1>

          <p style={{ margin: '0 0 1.75rem', color: '#6b7280', lineHeight: 1.6 }}>
            We hit an unexpected problem loading Awan Rental Service. Your data is
            safe - please try again, or reach us on WhatsApp and we will help
            straight away.
          </p>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.75rem',
              justifyContent: 'center',
            }}
          >
            <button
              type="button"
              onClick={reset}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                border: 'none',
                borderRadius: '0.75rem',
                background: '#0369a1',
                color: '#ffffff',
                padding: '0.75rem 1.25rem',
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <RefreshCw size={18} aria-hidden="true" />
              Try again
            </button>

            <Link
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                borderRadius: '0.75rem',
                background: 'transparent',
                color: '#0369a1',
                border: '1px solid #0369a1',
                padding: '0.75rem 1.25rem',
                fontSize: '0.95rem',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              <Home size={18} aria-hidden="true" />
              Go home
            </Link>

            <Link
              href="/contact"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                borderRadius: '0.75rem',
                background: 'transparent',
                color: '#374151',
                border: '1px solid #d1d5db',
                padding: '0.75rem 1.25rem',
                fontSize: '0.95rem',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              <MessageCircle size={18} aria-hidden="true" />
              Contact us
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}
