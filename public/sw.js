const CACHE = 'xa-v1';
const OFFLINE_URLS = [
  '/dashboard/caisse',
  '/offline',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(OFFLINE_URLS))
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .catch(() =>
        caches.match(e.request).then(
          (cached) => cached ?? caches.match('/offline')
        )
      )
  );
});
