/* Awan Rental Service - public site service worker (PWA install + offline shell). */
/* eslint-disable no-restricted-globals */

const VERSION = 'v1';
const STATIC_CACHE = `awan-static-${VERSION}`;
const PAGES_CACHE = `awan-pages-${VERSION}`;

// Paths that must NEVER be served from cache (admin area, APIs, anything private).
const EXCLUDED = ['/admin', '/api', '/_next/data'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keep = new Set([STATIC_CACHE, PAGES_CACHE]);
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => !keep.has(key)).map((key) => caches.delete(key)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only same-origin GETs are handled. Everything else goes to the network.
  if (request.method !== 'GET') return;
  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }
  if (url.origin !== self.location.origin) return;
  if (EXCLUDED.some((prefix) => url.pathname.startsWith(prefix))) return;

  const accept = request.headers.get('accept') || '';

  // Navigations: network-first, fall back to cache (shell read-only).
  if (accept.includes('text/html')) {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);
          if (response && response.status === 200) {
            const cache = await caches.open(PAGES_CACHE);
            cache.put(request, response.clone());
          }
          return response;
        } catch (error) {
          const cached = await caches.match(request);
          if (cached) return cached;
          throw error;
        }
      })()
    );
    return;
  }

  // Static assets (JS/CSS/fonts/images): cache-first with network refresh.
  const isStatic = /\.(js|css|png|jpe?g|webp|gif|svg|ico|woff2?|webmanifest)(\?.*)?$/i.test(url.pathname) || url.pathname.startsWith('/_next/static/');
  if (!isStatic) return;

  event.respondWith(
    (async () => {
      const cached = await caches.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      if (response && response.status === 200) {
        const cache = await caches.open(STATIC_CACHE);
        cache.put(request, response.clone());
      }
      return response;
    })()
  );
});
