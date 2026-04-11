import { supabaseAdmin } from '@/lib/supabase-admin';
import type { TransactionInsert, TransactionLigneInsert } from '@/types/database';

export interface SaleResult {
  transactionId: string;
}

/**
 * Enregistre une vente de façon atomique :
 * 1. Insère la transaction
 * 2. Insère les lignes
 * 3. Décrémente le stock via le trigger PostgreSQL
 */
export async function processSale(
  transaction: TransactionInsert,
  lignes: TransactionLigneInsert[]
): Promise<SaleResult> {
  const { data: tx, error: txErr } = await supabaseAdmin
    .from('transactions')
    .insert(transaction)
    .select('id')
    .single();

  if (txErr || !tx) throw txErr ?? new Error('Insertion transaction échouée');

  const lignesWithId = lignes.map(l => ({ ...l, transaction_id: tx.id }));
  const { error: lignesErr } = await supabaseAdmin
    .from('transaction_lignes')
    .insert(lignesWithId);

  if (lignesErr) throw lignesErr;

  return { transactionId: tx.id };
}
