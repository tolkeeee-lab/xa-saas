// Offline queue backed by IndexedDB — no external dependencies

export type OfflineSale = {
  id: string; // UUID généré côté client (crypto.randomUUID())
  boutique_id: string;
  lignes: { produit_id: string; quantite: number; prix_unitaire: number }[];
  mode_paiement: 'especes' | 'momo' | 'carte' | 'credit';
  montant_total: number;
  client_nom?: string;
  client_telephone?: string;
  created_at: string; // ISO string
};

/**
 * Maximum age of a cached product catalogue before it is considered stale.
 * After this duration, loadProduits() returns null to force a fresh fetch.
 * When offline and the cache is expired, the POS will display a warning.
 * 24 hours is a reasonable default for a daily-operated POS terminal.
 */
export const PRODUITS_CACHE_TTL_MS = 24 * 60 * 60 * 1_000;
const DB_NAME = 'xa-offline';
const STORE_NAME = 'sales';
const PRODUITS_STORE = 'produits';
const DB_VERSION = 2;

export type CachedProduit = {
  boutique_id: string;
  produits: unknown[];
  cached_at: number;
};

export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const oldVersion = event.oldVersion;
      if (oldVersion < 1) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
      if (oldVersion < 2) {
        if (!db.objectStoreNames.contains(PRODUITS_STORE)) {
          db.createObjectStore(PRODUITS_STORE, { keyPath: 'boutique_id' });
        }
      }
    };

    request.onsuccess = (event) => resolve((event.target as IDBOpenDBRequest).result);
    request.onerror = (event) => reject((event.target as IDBOpenDBRequest).error);
  });
}

export async function saveProduits(boutiqueId: string, produits: unknown[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PRODUITS_STORE, 'readwrite');
    const store = tx.objectStore(PRODUITS_STORE);
    const request = store.put({ boutique_id: boutiqueId, produits, cached_at: Date.now() } satisfies CachedProduit);
    request.onsuccess = () => resolve();
    request.onerror = (event) => reject((event.target as IDBRequest).error);
    tx.oncomplete = () => db.close();
  });
}

export async function loadProduits(boutiqueId: string): Promise<unknown[] | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PRODUITS_STORE, 'readonly');
    const store = tx.objectStore(PRODUITS_STORE);
    const request = store.get(boutiqueId);
    request.onsuccess = (event) => {
      const cached = (event.target as IDBRequest<CachedProduit | undefined>).result;
      if (!cached) {
        resolve(null);
        return;
      }
      // Expire stale cache entries so caissiers never work with very old prices
      if (Date.now() - cached.cached_at > PRODUITS_CACHE_TTL_MS) {
        resolve(null);
        return;
      }
      resolve(cached.produits);
    };
    request.onerror = (event) => reject((event.target as IDBRequest).error);
    tx.oncomplete = () => db.close();
  });
}

export async function enqueueSale(sale: OfflineSale): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(sale);
    request.onsuccess = () => resolve();
    request.onerror = (event) => reject((event.target as IDBRequest).error);
    tx.oncomplete = () => db.close();
  });
}

export async function getPendingSales(): Promise<OfflineSale[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = (event) => resolve((event.target as IDBRequest<OfflineSale[]>).result);
    request.onerror = (event) => reject((event.target as IDBRequest).error);
    tx.oncomplete = () => db.close();
  });
}

export async function removeSale(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = (event) => reject((event.target as IDBRequest).error);
    tx.oncomplete = () => db.close();
  });
}

export async function clearAll(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = (event) => reject((event.target as IDBRequest).error);
    tx.oncomplete = () => db.close();
  });
}
