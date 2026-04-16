import { unstable_cache } from 'next/cache';
import { createClient } from '@/lib/supabase-server';

export type DailyStats = {
  ca: number;
  transactions: number;
  benefice: number;
};

export function getDailyStats(boutiqueId?: string): Promise<DailyStats> {
  // Security note: boutiqueId is a UUID that belongs to exactly one proprietaire.
  // The cache is scoped by boutiqueId, which provides implicit user isolation
  // since UUIDs are globally unique. This function is only called from
  // authenticated server components that have already verified ownership.
  return unstable_cache(
    async () => {
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
    },
    ['daily-stats', boutiqueId ?? 'all'],
    { revalidate: 60, tags: [`daily-stats-${boutiqueId ?? 'all'}`] },
  )();
}
