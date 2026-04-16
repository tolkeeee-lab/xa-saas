import { cache } from 'react';
import { createClient } from '@/lib/supabase-server';
import type { Transaction } from '@/types/database';

export type TransactionWithDetails = Transaction & {
  boutique_nom: string;
  employe_nom: string | null;
};

export type TransactionsData = {
  transactions: TransactionWithDetails[];
  total_ca: number;
  total_transactions: number;
  boutiques: { id: string; nom: string; couleur_theme: string }[];
};

export const getTransactions = cache(async (
  userId: string,
  filters?: {
    boutique_id?: string;
    date_from?: string;
    date_to?: string;
    employe_id?: string;
    statut?: 'validee' | 'annulee';
  },
): Promise<TransactionsData> => {
  const supabase = await createClient();

  const { data: boutiquesData } = await supabase
    .from('boutiques')
    .select('id, nom, couleur_theme')
    .eq('proprietaire_id', userId)
    .eq('actif', true);

  const boutiques = boutiquesData ?? [];
  const boutiqueIds = boutiques.map((b) => b.id);

  if (boutiqueIds.length === 0) {
    return { transactions: [], total_ca: 0, total_transactions: 0, boutiques: [] };
  }

  let query = supabase
    .from('transactions')
    .select('*, boutiques(nom), employes(nom, prenom)')
    .in('boutique_id', filters?.boutique_id ? [filters.boutique_id] : boutiqueIds)
    .order('created_at', { ascending: false })
    .limit(500);

  if (filters?.date_from) query = query.gte('created_at', filters.date_from);
  if (filters?.date_to) query = query.lte('created_at', filters.date_to + 'T23:59:59');
  if (filters?.statut) query = query.eq('statut', filters.statut);

  const { data } = await query;

  const transactions: TransactionWithDetails[] = (data ?? []).map((t) => {
    const boutique = (t.boutiques as unknown as { nom: string } | null);
    const employe = (t.employes as unknown as { nom: string; prenom: string } | null);
    return {
      ...t,
      boutique_nom: boutique?.nom ?? '—',
      employe_nom: employe ? `${employe.nom} ${employe.prenom}` : null,
    };
  });

  const validees = transactions.filter((t) => t.statut === 'validee');
  const total_ca = validees.reduce((s, t) => s + t.montant_total, 0);

  return { transactions, total_ca, total_transactions: transactions.length, boutiques };
});
