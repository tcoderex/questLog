const CACHE_NAME = 'quest-log-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/app_logo.png',
  '/qq.png',
  '/qq.jpg',
  '/manifest.json'
];

// Install event - Cache main files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate event - Clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - Stale-While-Revalidate strategy
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // Skip dev endpoints or non-HTTP protocols
  if (!event.request.url.startsWith('http')) return;

  const url = new URL(event.request.url);

  // Handle SPA routing: serve index.html if request is navigation
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match('/index.html').then((cachedIndex) => {
        return fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put('/index.html', networkResponse.clone());
              });
            }
            return networkResponse;
          })
          .catch(() => cachedIndex);
      })
    );
    return;
  }

  // Same-origin dynamic cache update
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          const fetchedResponse = fetch(event.request)
            .then((networkResponse) => {
              if (networkResponse.status === 200) {
                cache.put(event.request, networkResponse.clone());
              }
              return networkResponse;
            })
            .catch(() => {
              // Ignore network errors when offline
              return null;
            });

          return cachedResponse || fetchedResponse;
        });
      })
    );
  } else {
    // Other assets (external)
    event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
  }
});
