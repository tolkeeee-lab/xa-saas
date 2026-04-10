// Service Worker xà - Offline first pour /caisse
const CACHE_NAME = 'xa-v1';
const OFFLINE_URLS = ['/', '/caisse', '/offline'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(OFFLINE_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('/api/') || event.request.url.includes('supabase')) return;
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      }).catch(() => caches.match('/offline'));
    })
  );
});

// Background Sync
self.addEventListener('sync', event => {
  if (event.tag === 'sync-transactions') {
    event.waitUntil(syncTransactions());
  }
});

async function syncTransactions() {
  const db = await openDB();
  const tx = db.transaction('pending_transactions', 'readonly');
  const pending = await tx.objectStore('pending_transactions').getAll();
  for (const item of pending) {
    try {
      const res = await fetch('/api/transactions/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      if (res.ok) {
        const delTx = db.transaction('pending_transactions', 'readwrite');
        await delTx.objectStore('pending_transactions').delete(item.local_id);
      }
    } catch (err) {
      console.error('[sw] sync error for item', item.local_id, err);
    }
  }
}

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('xa-offline', 1);
    req.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('pending_transactions')) {
        db.createObjectStore('pending_transactions', { keyPath: 'local_id' });
      }
    };
    req.onsuccess = e => resolve(e.target.result);
    req.onerror = e => reject(e.target.error);
  });
}

// Push notifications
self.addEventListener('push', event => {
  const data = event.data?.json() ?? { title: 'xà', body: 'Nouvelle notification' };
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      vibrate: [200, 100, 200],
      data: data.url ?? '/dashboard',
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data));
});
