import { createClient } from '@/lib/supabase-server';

export type DayStat = {
  date: string;
  ca: number;
  boutique_id: string;
};

export async function getWeeklyStats(proprietaireId: string): Promise<DayStat[]> {
  const supabase = await createClient();

  const { data: boutiques } = await supabase
    .from('boutiques')
    .select('id')
    .eq('proprietaire_id', proprietaireId)
    .eq('actif', true);

  if (!boutiques?.length) return [];

  const boutiqueIds = boutiques.map((b) => b.id);

  const windowStart = new Date();
  windowStart.setDate(windowStart.getDate() - 6);
  const startDate = windowStart.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('transactions')
    .select('created_at, montant_total, boutique_id')
    .in('boutique_id', boutiqueIds)
    .gte('created_at', startDate)
    .eq('statut', 'validee');

  if (error || !data) return [];

  const grouped: Record<string, DayStat> = {};
  for (const t of data) {
    const date = t.created_at.split('T')[0];
    const key = `${date}_${t.boutique_id}`;
    if (!grouped[key]) {
      grouped[key] = { date, ca: 0, boutique_id: t.boutique_id };
    }
    grouped[key].ca += t.montant_total ?? 0;
  }

  return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
}
