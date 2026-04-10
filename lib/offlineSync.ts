/**
 * lib/offlineSync.ts
 *
 * Utilitaires de synchronisation offline pour xà.
 *
 * Principe :
 *  1. Toute transaction créée hors ligne est stockée avec sync_statut = 'local'
 *     et un local_id généré par le client (crypto.randomUUID).
 *  2. Lors du retour en ligne, syncPendingTransactions() envoie les transactions
 *     locales vers Supabase via upsert (idempotent grâce à local_id).
 *  3. En cas de conflit, la transaction est marquée sync_statut = 'conflict'
 *     pour résolution manuelle.
 */

import { supabase } from './supabase';
import type { Transaction, TransactionInsert } from '../types/database';

// ── Clé de stockage local ─────────────────────────────────────────────────────

const STORAGE_KEY = 'xa_pending_transactions';

// ── Lecture / écriture dans localStorage ─────────────────────────────────────

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

// ── API publique ──────────────────────────────────────────────────────────────

/**
 * Enregistre une transaction localement (mode offline).
 * Génère un local_id et marque sync_statut = 'local'.
 */
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

/**
 * Renvoie le nombre de transactions en attente de synchronisation.
 */
export function countPendingTransactions(): number {
  return readPending().length;
}

/**
 * Synchronise toutes les transactions locales avec Supabase.
 *
 * @returns Un objet résumant les succès, échecs et conflits.
 */
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
    // Vérifier si un enregistrement avec ce local_id existe déjà (conflit potentiel)
    const { data: existing, error: fetchError } = await supabase
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
      // Enregistrement déjà présent → conflit ou doublon idempotent
      conflicts++;
      // Ne pas garder dans la file : déjà dans Supabase
      continue;
    }

    // Insérer la transaction
    const { error: insertError } = await supabase
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

/**
 * Supprime toutes les transactions locales (ex. après déconnexion).
 */
export function clearPendingTransactions(): void {
  writePending([]);
}

/**
 * Hook utilitaire : écoute les événements réseau et déclenche la sync
 * automatiquement dès le retour en ligne.
 *
 * Usage dans un composant React :
 *   useEffect(() => registerOnlineSync(), []);
 */
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

// ── Helpers de création de transaction ───────────────────────────────────────

/**
 * Crée une transaction en ligne ou hors ligne selon la connectivité.
 *
 * - En ligne  : insère directement dans Supabase (sync_statut = 'synced').
 * - Hors ligne : stocke localement (sync_statut = 'local').
 *
 * @returns La transaction créée (avec son id Supabase ou son local_id).
 */
export async function createTransaction(
  transaction: Omit<TransactionInsert, 'local_id' | 'sync_statut'>
): Promise<{ data: Transaction | TransactionInsert | null; offline: boolean }> {
  if (navigator.onLine) {
    const localId = crypto.randomUUID();
    const { data, error } = await supabase
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
      // Repli sur le stockage local en cas d'erreur réseau
      const local = saveTransactionLocally(transaction);
      return { data: local, offline: true };
    }

    return { data, offline: false };
  }

  // Mode offline
  const local = saveTransactionLocally(transaction);
  return { data: local, offline: true };
}
