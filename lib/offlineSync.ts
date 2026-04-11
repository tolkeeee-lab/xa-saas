/**
 * Gestion des transactions hors-ligne (IndexedDB).
 * Les ventes effectuées sans connexion sont stockées localement
 * et synchronisées dès que la connexion est rétablie.
 */

import type { TransactionInsert, TransactionLigneInsert } from '@/types/database';

export interface PendingTransaction {
  localId: string;
  transaction: TransactionInsert;
  lignes: TransactionLigneInsert[];
  createdAt: string;
}

const DB_NAME = 'xa-offline';
const STORE_NAME = 'pending_transactions';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'localId' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function savePendingTransaction(pending: PendingTransaction): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(pending);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getPendingTransactions(): Promise<PendingTransaction[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => resolve(req.result as PendingTransaction[]);
    req.onerror = () => reject(req.error);
  });
}

export async function removePendingTransaction(localId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(localId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function syncPendingTransactions(): Promise<{ synced: number; errors: number }> {
  const pending = await getPendingTransactions();
  let synced = 0;
  let errors = 0;

  for (const item of pending) {
    try {
      const res = await fetch('/api/transactions/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      if (res.ok) {
        await removePendingTransaction(item.localId);
        synced++;
      } else {
        errors++;
      }
    } catch {
      errors++;
    }
  }
  return { synced, errors };
}
