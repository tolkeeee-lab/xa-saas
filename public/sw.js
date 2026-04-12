const CACHE = 'xa-v2';
const STATIC_URLS = [
  '/dashboard',
  '/dashboard/caisse',
  '/offline',
  '/icon.svg',
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(STATIC_URLS).catch(() => {}))
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  // Ne pas intercepter les requêtes API Supabase
  if (e.request.url.includes('supabase.co')) return;

  e.respondWith(
    fetch(e.request)
      .then((response) => {
        // Mettre en cache les réponses réussies pour les pages statiques
        if (response.ok && e.request.destination === 'document') {
          const clone = response.clone();
          caches.open(CACHE).then((cache) => cache.put(e.request, clone));
        }
        return response;
      })
      .catch(() =>
        caches.match(e.request).then(
          (cached) => cached ?? caches.match('/offline')
        )
      )
  );
});
