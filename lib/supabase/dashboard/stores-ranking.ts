import { cache } from 'react';
import { createClient } from '@/lib/supabase-server';

export type StoreRankRow = {
  id: string;
  name: string;
  color: string;
  ca: number;
  percent: number;
};
export type StoresRankingData = StoreRankRow[];

export const getStoresRanking = cache(async (userId: string): Promise<StoresRankingData> => {
  const supabase = await createClient();

  const { data: boutiquesData } = await supabase
    .from('boutiques')
    .select('id, nom, couleur_theme')
    .eq('proprietaire_id', userId)
    .eq('actif', true);

  if (!boutiquesData?.length) return [];

  const boutiqueIds = boutiquesData.map((b) => b.id as string);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: txs } = await supabase
    .from('transactions')
    .select('boutique_id, montant_total')
    .in('boutique_id', boutiqueIds)
    .eq('statut', 'validee')
    .gte('created_at', today.toISOString());

  const caMap: Record<string, number> = {};
  for (const tx of txs ?? []) {
    const bid = tx.boutique_id as string;
    caMap[bid] = (caMap[bid] ?? 0) + ((tx.montant_total as number) ?? 0);
  }

  const rows: StoreRankRow[] = boutiquesData.map((b) => ({
    id: b.id as string,
    name: b.nom as string,
    color: b.couleur_theme as string,
    ca: caMap[b.id as string] ?? 0,
    percent: 0,
  }));

  rows.sort((a, b) => b.ca - a.ca);
  const maxCA = rows[0]?.ca ?? 0;
  if (maxCA > 0) {
    for (const row of rows) {
      row.percent = Math.round((row.ca / maxCA) * 100);
    }
  }

  return rows;
});
