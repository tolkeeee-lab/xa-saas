/**
 * lib/offlineSync.ts
 *
 * Synchronisation offline pour xà — stockage IndexedDB, sync via API route.
 *
 * Principe :
 *  1. Toute transaction créée hors ligne est stockée dans IndexedDB avec local_id.
 *  2. Lors du retour en ligne, syncPendingTransactions() envoie les transactions
 *     vers /api/transactions/sync (idempotent grâce à local_id).
 *  3. En cas de succès, l'entrée est supprimée de l'IndexedDB.
 */

import type { TransactionInsert } from '../types/database';

const DB_NAME = 'xa-offline';
const STORE   = 'pending_transactions';
const DB_VERSION = 1;

// ── IndexedDB helpers ─────────────────────────────────────────────────────────

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = e => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'local_id' });
      }
    };
    req.onsuccess = e => resolve((e.target as IDBOpenDBRequest).result);
    req.onerror   = e => reject((e.target as IDBOpenDBRequest).error);
  });
}

async function dbGetAll(): Promise<TransactionInsert[]> {
  if (typeof window === 'undefined') return [];
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE, 'readonly');
    const req   = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result as TransactionInsert[]);
    req.onerror   = () => reject(req.error);
  });
}

async function dbPut(item: TransactionInsert): Promise<void> {
  if (typeof window === 'undefined') return;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE, 'readwrite');
    const req = tx.objectStore(STORE).put(item);
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}

async function dbDelete(localId: string): Promise<void> {
  if (typeof window === 'undefined') return;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE, 'readwrite');
    const req = tx.objectStore(STORE).delete(localId);
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}

async function dbClear(): Promise<void> {
  if (typeof window === 'undefined') return;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE, 'readwrite');
    const req = tx.objectStore(STORE).clear();
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}

// ── API publique ──────────────────────────────────────────────────────────────

/**
 * Enregistre une transaction localement (mode offline).
 */
export async function saveTransactionLocally(
  transaction: Omit<TransactionInsert, 'local_id' | 'sync_statut'>
): Promise<TransactionInsert> {
  const entry: TransactionInsert = {
    ...transaction,
    local_id: crypto.randomUUID(),
    sync_statut: 'local',
    created_at: transaction.created_at ?? new Date().toISOString(),
  };
  await dbPut(entry);
  return entry;
}

/**
 * Renvoie le nombre de transactions en attente de synchronisation.
 */
export async function countPendingTransactions(): Promise<number> {
  const all = await dbGetAll();
  return all.length;
}

/**
 * Synchronise toutes les transactions locales avec le serveur via /api/transactions/sync.
 */
export async function syncPendingTransactions(): Promise<{
  synced: number;
  failed: number;
}> {
  const pending = await dbGetAll();
  if (pending.length === 0) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;

  for (const tx of pending) {
    try {
      const res = await fetch('/api/transactions/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tx),
      });
      if (res.ok) {
        await dbDelete(tx.local_id as string);
        synced++;
      } else {
        failed++;
      }
    } catch {
      failed++;
    }
  }

  return { synced, failed };
}

/**
 * Supprime toutes les transactions locales (ex. après déconnexion).
 */
export async function clearPendingTransactions(): Promise<void> {
  await dbClear();
}

/**
 * Écoute les événements réseau et déclenche la sync automatiquement dès le retour en ligne.
 *
 * Usage dans un composant React :
 *   useEffect(() => registerOnlineSync(), []);
 */
export function registerOnlineSync(
  onResult?: (result: { synced: number; failed: number }) => void
): () => void {
  if (typeof window === 'undefined') return () => {};

  const handler = async () => {
    const result = await syncPendingTransactions();
    onResult?.(result);
  };

  window.addEventListener('online', handler);
  return () => window.removeEventListener('online', handler);
}

/**
 * Crée une transaction en ligne ou hors ligne selon la connectivité.
 */
export async function createTransaction(
  transaction: Omit<TransactionInsert, 'local_id' | 'sync_statut'>
): Promise<{ offline: boolean }> {
  if (typeof navigator !== 'undefined' && navigator.onLine) {
    const res = await fetch('/api/caisse/transaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transaction),
    });
    if (res.ok) return { offline: false };
  }

  await saveTransactionLocally(transaction);
  return { offline: true };
}
