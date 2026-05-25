const CACHE_NAME = 'quest-log-cache-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/app_logo.png',
  '/qq.png',
  '/qq.jpg',
  '/manifest.json'
];

// Install event - Cache core shell files immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Use to handle individual cache failure gracefully so SW installs successfully
      return Promise.allSettled(
        ASSETS_TO_CACHE.map(asset => {
          return cache.add(asset).catch(err => {
            console.warn(`Failed to pre-cache asset: ${asset}`, err);
          });
        })
      );
    }).then(() => self.skipWaiting())
  );
});

// Activate event - Clean old caches instantly when activated
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Clearing old rune cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - Cache-First & Stale-While-Revalidate fallback strategy
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith('http')) return;

  const url = new URL(event.request.url);

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // 1. If we have the item in cache, return it immediately (very fast, offline friendly)
      if (cachedResponse) {
        // Fetch in background to update cache for next load
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse);
              });
            }
          })
          .catch(() => {
            // Silently swallow errors when offline in background fetch
          });
        return cachedResponse;
      }

      // 2. If not stored in cache, fetch it from the network
      return fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch((err) => {
          // 3. Physical Offline Fallback for SPA routing and navigation
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html') || caches.match('/');
          }
          // Propagate real fetch network failure instead of returning null
          throw err;
        });
    })
  );
});
