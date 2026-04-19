import { cache } from 'react';
import { createClient } from '@/lib/supabase-server';

export type ObjectiveRow = {
  boutiqueId: string;
  boutiqueName: string;
  boutiqueColor: string;
  current: number;
  target: number;
  percent: number;
};
export type ObjectivesData = ObjectiveRow[];

export const getObjectives = cache(async (userId: string): Promise<ObjectivesData> => {
  const supabase = await createClient();

  const { data: boutiquesData } = await supabase
    .from('boutiques')
    .select('id, nom, couleur_theme')
    .eq('proprietaire_id', userId)
    .eq('actif', true);

  if (!boutiquesData?.length) return [];

  const boutiqueIds = boutiquesData.map((b) => b.id as string);
  const now = new Date();
  const mois = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [{ data: objectives }, { data: txs }] = await Promise.all([
    supabase
      .from('boutique_objectifs')
      .select('boutique_id, objectif_ca')
      .in('boutique_id', boutiqueIds)
      .eq('proprietaire_id', userId)
      .eq('mois', mois),
    supabase
      .from('transactions')
      .select('boutique_id, montant_total')
      .in('boutique_id', boutiqueIds)
      .eq('statut', 'validee')
      .gte('created_at', startOfMonth.toISOString()),
  ]);

  const objectivesMap = new Map(
    (objectives ?? []).map((o) => [o.boutique_id as string, (o.objectif_ca as number) ?? 0]),
  );
  const caMap: Record<string, number> = {};
  for (const tx of txs ?? []) {
    const bid = tx.boutique_id as string;
    caMap[bid] = (caMap[bid] ?? 0) + ((tx.montant_total as number) ?? 0);
  }

  return boutiquesData.map((b) => {
    const bid = b.id as string;
    const target = objectivesMap.get(bid) ?? 0;
    const current = caMap[bid] ?? 0;
    const percent = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
    return {
      boutiqueId: bid,
      boutiqueName: b.nom as string,
      boutiqueColor: b.couleur_theme as string,
      current,
      target,
      percent,
    };
  });
});
