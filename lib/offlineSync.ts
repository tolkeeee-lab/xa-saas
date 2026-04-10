/**
 * lib/offlineSync.ts
 *
 * Utilitaires de synchronisation offline pour xà.
 */

import { supabase } from './supabase';
import type { Transaction, TransactionInsert } from '../types/database';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

const STORAGE_KEY = 'xa_pending_transactions';

function readPending(): TransactionInsert[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TransactionInsert[]) : [];
  } catch {
    return [];
  }
}

function writePending(transactions: TransactionInsert[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

export function saveTransactionLocally(
  transaction: Omit<TransactionInsert, 'local_id' | 'sync_statut'>
): TransactionInsert {
  const pending = readPending();
  const entry: TransactionInsert = {
    ...transaction,
    local_id: crypto.randomUUID(),
    sync_statut: 'local',
    created_at: transaction.created_at ?? new Date().toISOString(),
  };
  pending.push(entry);
  writePending(pending);
  return entry;
}

export function countPendingTransactions(): number {
  return readPending().length;
}

export async function syncPendingTransactions(): Promise<{
  synced: number;
  failed: number;
  conflicts: number;
}> {
  const pending = readPending();
  if (pending.length === 0) return { synced: 0, failed: 0, conflicts: 0 };

  let synced = 0;
  let failed = 0;
  let conflicts = 0;
  const remaining: TransactionInsert[] = [];

  for (const tx of pending) {
    const { data: existing, error: fetchError } = await db
      .from('transactions')
      .select('id, statut')
      .eq('local_id', tx.local_id as string)
      .maybeSingle();

    if (fetchError) {
      failed++;
      remaining.push(tx);
      continue;
    }

    if (existing) {
      conflicts++;
      continue;
    }

    const { error: insertError } = await db
      .from('transactions')
      .insert({ ...tx, sync_statut: 'synced', synced_at: new Date().toISOString() });

    if (insertError) {
      failed++;
      remaining.push({ ...tx, sync_statut: 'conflict' });
    } else {
      synced++;
    }
  }

  writePending(remaining);
  return { synced, failed, conflicts };
}

export function clearPendingTransactions(): void {
  writePending([]);
}

export function registerOnlineSync(
  onResult?: (result: { synced: number; failed: number; conflicts: number }) => void
): () => void {
  if (typeof window === 'undefined') return () => {};

  const handler = async () => {
    const result = await syncPendingTransactions();
    onResult?.(result);
  };

  window.addEventListener('online', handler);
  return () => window.removeEventListener('online', handler);
}

export async function createTransaction(
  transaction: Omit<TransactionInsert, 'local_id' | 'sync_statut'>
): Promise<{ data: Transaction | TransactionInsert | null; offline: boolean }> {
  if (navigator.onLine) {
    const localId = crypto.randomUUID();
    const { data, error } = await db
      .from('transactions')
      .insert({
        ...transaction,
        local_id: localId,
        sync_statut: 'synced',
        synced_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      const local = saveTransactionLocally(transaction);
      return { data: local, offline: true };
    }

    return { data: data as Transaction, offline: false };
  }

  const local = saveTransactionLocally(transaction);
  return { data: local, offline: true };
}