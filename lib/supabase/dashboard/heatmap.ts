import { cache } from 'react';
import { createClient } from '@/lib/supabase-server';

export type HeatmapData = {
  days: string[];
  hours: number[];
  values: number[][];
};

const DAY_LABELS = ['DIM', 'LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM'];

export const getHeatmap = cache(async (
  userId: string,
  storeIds: string[],
): Promise<HeatmapData> => {
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

  const hours = Array.from({ length: 16 }, (_, i) => i + 6);

  const buildEmptyResult = (): HeatmapData => {
    const days = Array.from({ length: 4 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (3 - i));
      return i === 3 ? 'AUJ.' : DAY_LABELS[d.getDay()];
    });
    return { days, hours, values: Array(4).fill(null).map(() => Array<number>(16).fill(0)) };
  };

  if (!boutiqueIds.length) return buildEmptyResult();

  const fourDaysAgo = new Date();
  fourDaysAgo.setDate(fourDaysAgo.getDate() - 3);
  fourDaysAgo.setHours(0, 0, 0, 0);

  const { data } = await supabase
    .from('transactions')
    .select('created_at')
    .in('boutique_id', boutiqueIds)
    .eq('statut', 'validee')
    .gte('created_at', fourDaysAgo.toISOString());

  const days: string[] = [];
  const dateKeys: string[] = [];
  for (let i = 3; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    days.push(i === 0 ? 'AUJ.' : DAY_LABELS[d.getDay()]);
    dateKeys.push(d.toISOString().split('T')[0]);
  }

  const values: number[][] = Array(4).fill(null).map(() => Array<number>(16).fill(0));

  for (const tx of data ?? []) {
    const dt = new Date(tx.created_at as string);
    const dateKey = dt.toISOString().split('T')[0];
    const dayIdx = dateKeys.indexOf(dateKey);
    if (dayIdx === -1) continue;
    const h = dt.getHours();
    if (h < 6 || h > 21) continue;
    values[dayIdx][h - 6]++;
  }

  return { days, hours, values };
});
