const CACHE = 'xa-v2';
const API_CACHE = 'xa-api-v1';
const API_TTL_MS = 5 * 60 * 1000; // 5 minutes
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
      Promise.all(
        keys.filter((k) => k !== CACHE && k !== API_CACHE).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Stale-while-revalidate helper for /api/produits
function isProduitsRequest(url) {
  return url.pathname.startsWith('/api/produits');
}

function isCachedResponseFresh(response) {
  const timestamp = response.headers.get('x-sw-cached-at');
  if (!timestamp) return false;
  return Date.now() - parseInt(timestamp, 10) < API_TTL_MS;
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(API_CACHE);
  const cached = await cache.match(request);

  const fetchAndCache = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      // Clone and add timestamp header for TTL check
      const headers = new Headers(networkResponse.headers);
      headers.set('x-sw-cached-at', String(Date.now()));
      const stamped = new Response(networkResponse.clone().body, {
        status: networkResponse.status,
        statusText: networkResponse.statusText,
        headers,
      });
      cache.put(request, stamped);
    }
    return networkResponse;
  }).catch(() => null);

  if (cached && isCachedResponseFresh(cached)) {
    // Return stale immediately, revalidate in background
    void fetchAndCache;
    return cached;
  }

  // No fresh cache — wait for network, fall back to stale if network fails
  const networkResponse = await fetchAndCache;
  if (networkResponse) return networkResponse;
  if (cached) return cached;
  return caches.match('/offline') ?? new Response('Offline', { status: 503 });
}

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  // Ne pas intercepter les requêtes API Supabase
  if (e.request.url.includes('supabase.co')) return;

  const url = new URL(e.request.url);

  // Stale-while-revalidate for /api/produits
  if (isProduitsRequest(url)) {
    e.respondWith(staleWhileRevalidate(e.request));
    return;
  }

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
