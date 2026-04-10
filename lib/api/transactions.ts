/**
 * lib/api/transactions.ts
 * Lecture et mise à jour des transactions dans Supabase.
 */

import { supabase } from '../supabase';
import type {
  Transaction,
  TransactionAvecRelations,
  TransactionUpdate,
} from '../../types/database';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export async function getTransactions(
  boutiqueId: string,
  limit = 50
): Promise<Transaction[]> {
  const { data, error } = await db
    .from('transactions')
    .select('*')
    .eq('boutique_id', boutiqueId)
    .neq('statut', 'annulee')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []) as Transaction[];
}

export async function getTransactionsAvecRelations(
  boutiqueId: string,
  limit = 50
): Promise<TransactionAvecRelations[]> {
  const { data, error } = await db
    .from('transactions')
    .select(`
      *,
      boutique:boutiques(id, nom),
      employe:employes(id, nom, prenom, role),
      client_debiteur:clients_debiteurs(id, nom, prenom, telephone, solde_du)
    `)
    .eq('boutique_id', boutiqueId)
    .neq('statut', 'annulee')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []) as TransactionAvecRelations[];
}

export async function updateTransaction(
  id: string,
  payload: Omit<TransactionUpdate, 'id'>
): Promise<Transaction> {
  const { data, error } = await db
    .from('transactions')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Transaction;
}

export async function annulerTransaction(id: string): Promise<void> {
  const { error } = await db
    .from('transactions')
    .update({ statut: 'annulee' })
    .eq('id', id);

  if (error) throw new Error(error.message);
}