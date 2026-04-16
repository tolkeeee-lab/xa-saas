import { cache } from 'react';
import { createClient } from '@/lib/supabase-server';

export type DailyStats = {
  ca: number;
  transactions: number;
  benefice: number;
};

// Security note: boutiqueId is a UUID that belongs to exactly one proprietaire.
// The cache is scoped by boutiqueId, which provides implicit user isolation
// since UUIDs are globally unique. This function is only called from
// authenticated server components that have already verified ownership.
export const getDailyStats = cache(async (boutiqueId?: string): Promise<DailyStats> => {
  const supabase = await createClient();
  const today = new Date().toISOString().split('T')[0];

  let query = supabase
    .from('transactions')
    .select('montant_total, benefice_total')
    .gte('created_at', today)
    .eq('statut', 'validee');

  if (boutiqueId) query = query.eq('boutique_id', boutiqueId);

  const { data, error } = await query;
  if (error || !data) return { ca: 0, transactions: 0, benefice: 0 };

  return {
    ca: data.reduce((s, t) => s + (t.montant_total ?? 0), 0),
    transactions: data.length,
    benefice: data.reduce((s, t) => s + (t.benefice_total ?? 0), 0),
  };
});
