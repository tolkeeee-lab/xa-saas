import { cache } from 'react';
import { createClient } from '@/lib/supabase-server';
import type { PeriodKey } from './kpis';

export type CategoryData = { name: string; value: number; percent: number }[];

function getPeriodStart(period: PeriodKey): Date {
  const now = new Date();
  switch (period) {
    case '7J': {
      const d = new Date(now);
      d.setDate(d.getDate() - 6);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case '30J': {
      const d = new Date(now);
      d.setDate(d.getDate() - 29);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case 'Mois':
      return new Date(now.getFullYear(), now.getMonth(), 1);
    case 'An':
      return new Date(now.getFullYear(), 0, 1);
  }
}

export const getCategoryBreakdown = cache(async (
  userId: string,
  storeIds: string[],
  period: PeriodKey,
): Promise<CategoryData> => {
  const supabase = await createClient();

  let boutiqueIds = storeIds;
  if (!boutiqueIds.length) {
    const { data: boutiques } = await supabase
      .from('boutiques')
      .select('id')
      .eq('proprietaire_id', userId)
      .eq('actif', true);
    boutiqueIds = (boutiques ?? []).map((b) => b.id as string);
  }

  if (!boutiqueIds.length) return [];

  const periodStart = getPeriodStart(period);

  // Get validated transaction IDs within the period for these boutiques
  const { data: txs } = await supabase
    .from('transactions')
    .select('id')
    .in('boutique_id', boutiqueIds)
    .eq('statut', 'validee')
    .gte('created_at', periodStart.toISOString());

  if (!txs?.length) return [];

  const txIds = txs.map((t) => t.id as string);

  const { data: lignes } = await supabase
    .from('transaction_lignes')
    .select('sous_total, produit_id')
    .in('transaction_id', txIds);

  if (!lignes?.length) return [];

  const produitIds = [...new Set(
    (lignes ?? [])
      .map((l) => l.produit_id as string | null)
      .filter((id): id is string => id !== null),
  )];

  const { data: produits } = await supabase
    .from('produits')
    .select('id, categorie')
    .in('id', produitIds);

  const produitCatMap = new Map(
    (produits ?? []).map((p) => [p.id as string, (p.categorie as string | null) ?? 'Autre']),
  );

  const totals: Record<string, number> = {};
  for (const l of lignes) {
    const pid = l.produit_id as string | null;
    const cat = pid ? (produitCatMap.get(pid) ?? 'Autre') : 'Autre';
    totals[cat] = (totals[cat] ?? 0) + ((l.sous_total as number) ?? 0);
  }

  const total = Object.values(totals).reduce((s, v) => s + v, 0);
  if (total === 0) return [];

  return Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, value]) => ({
      name,
      value,
      percent: Math.round((value / total) * 100),
    }));
});
