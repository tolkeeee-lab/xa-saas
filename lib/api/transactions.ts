import { createClient } from '../supabase-browser';
import type { Transaction, TransactionAvecRelations, TransactionUpdate } from '../../types/database';

export async function getTransactions(boutiqueId: string, limit = 50): Promise<Transaction[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('boutique_id', boutiqueId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data;
}

export async function getTransactionsAvecRelations(
  boutiqueId: string,
  limit = 50
): Promise<TransactionAvecRelations[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      boutique:boutiques(id, nom),
      employe:employes(id, nom, prenom, role),
      client_debiteur:clients_debiteurs(id, nom, prenom, telephone, solde_du)
    `)
    .eq('boutique_id', boutiqueId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data as TransactionAvecRelations[];
}

export async function updateTransaction(
  id: string,
  payload: TransactionUpdate
): Promise<Transaction> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('transactions')
    .update(payload)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function annulerTransaction(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('transactions')
    .update({ statut: 'annulee' })
    .eq('id', id);
  if (error) throw new Error(error.message);
}
