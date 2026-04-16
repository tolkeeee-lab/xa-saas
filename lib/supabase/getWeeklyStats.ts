import { unstable_cache } from 'next/cache';
import { createClient } from '@/lib/supabase-server';

export type DayStat = {
  date: string;       // 'YYYY-MM-DD'
  ca: number;
  benefice: number;
  transactions: number;
  boutique_id: string;
};

export function getWeeklyStats(proprietaireId: string): Promise<DayStat[]> {
  return unstable_cache(
    async () => {
      const supabase = await createClient();

      const { data: boutiques } = await supabase
        .from('boutiques')
        .select('id')
        .eq('proprietaire_id', proprietaireId)
        .eq('actif', true);

      if (!boutiques?.length) return [];

      const boutiqueIds = boutiques.map((b) => b.id);

      // Fetch last 30 days so the client can filter by 7j / 30j / mois
      const windowStart = new Date();
      windowStart.setDate(windowStart.getDate() - 29);
      const startDate = windowStart.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('transactions')
        .select('created_at, montant_total, benefice_total, boutique_id')
        .in('boutique_id', boutiqueIds)
        .gte('created_at', startDate)
        .eq('statut', 'validee');

      if (error || !data) return [];

      const grouped: Record<string, DayStat> = {};
      for (const t of data) {
        const date = (t.created_at as string).split('T')[0];
        const key = `${date}_${t.boutique_id}`;
        if (!grouped[key]) {
          grouped[key] = { date, ca: 0, benefice: 0, transactions: 0, boutique_id: t.boutique_id as string };
        }
        grouped[key].ca += (t.montant_total as number | null) ?? 0;
        grouped[key].benefice += (t.benefice_total as number | null) ?? 0;
        grouped[key].transactions += 1;
      }

      return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
    },
    ['weekly-stats', proprietaireId],
    { revalidate: 60, tags: [`weekly-stats-${proprietaireId}`] },
  )();
}
