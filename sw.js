const CACHE_NAME = 'getxh-v1';

const PRECACHE_URLS = [
  '/index.html',
  '/Dashboard.html',
  '/Registerpage.html',
  '/orders.html',
  '/wallet.html',
  '/account.html',
  '/support.html',
  '/about.html',
  '/contact.html',
  '/terms.html',
  '/privacy.html',
  '/refund.html',
  '/cancellation.html',
  '/payment-qr.png',
  '/getxh new logo.png'
];

// Install: cache all pages
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activate: delete old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: cache-first for same-origin, network-only for Firebase/CDN
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Skip non-GET and external requests (Firebase, fonts, CDN)
  if (event.request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        // Cache valid same-origin responses
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
