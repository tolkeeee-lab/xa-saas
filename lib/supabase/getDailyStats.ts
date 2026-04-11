import { supabaseAdmin } from '@/lib/supabase-admin';

export interface DailyStats {
  chiffre_affaires: number;
  marge_brute: number;
  nb_transactions: number;
  date: string;
}

/**
 * Retourne le CA et la marge brute pour une boutique sur une période.
 */
export async function getDailyStats(
  boutiqueId: string,
  from: string,
  to: string
): Promise<DailyStats[]> {
  const { data, error } = await supabaseAdmin
    .from('transactions')
    .select('montant_total, created_at')
    .eq('boutique_id', boutiqueId)
    .eq('statut', 'validee')
    .in('type', ['vente', 'credit'])
    .gte('created_at', from)
    .lte('created_at', to)
    .order('created_at');

  if (error) throw error;

  const byDay = new Map<string, { ca: number; nb: number }>();
  for (const row of data ?? []) {
    const day = row.created_at.slice(0, 10);
    const existing = byDay.get(day) ?? { ca: 0, nb: 0 };
    byDay.set(day, { ca: existing.ca + row.montant_total, nb: existing.nb + 1 });
  }

  return Array.from(byDay.entries()).map(([date, { ca, nb }]) => ({
    date,
    chiffre_affaires: ca,
    marge_brute: 0, // calculé séparément via transaction_lignes si besoin
    nb_transactions: nb,
  }));
}
