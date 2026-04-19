import { cache } from 'react';
import { createClient } from '@/lib/supabase-server';
import type { PeriodKey } from './kpis';
import { CHART_COLORS } from './chart-colors';

export type RevenueSeries = {
  labels: string[];
  global: number[];
  byStore: { id: string; name: string; color: string; data: number[] }[];
};

function buildLabels(period: PeriodKey): { labels: string[]; buckets: number } {
  switch (period) {
    case '7J': {
      const days = ['DIM', 'LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM'];
      const labels: string[] = [];
      for (let i = 6; i >= 1; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        labels.push(days[d.getDay()]);
      }
      labels.push('AUJ.');
      return { labels, buckets: 7 };
    }
    case '30J':
      return { labels: Array.from({ length: 30 }, (_, i) => `J${i + 1}`), buckets: 30 };
    case 'Mois':
      return { labels: ['SEM. 1', 'SEM. 2', 'SEM. 3', 'SEM. 4'], buckets: 4 };
    case 'An':
      return {
        labels: ['JAN', 'FÉV', 'MAR', 'AVR', 'MAI', 'JUN', 'JUL', 'AOÛ', 'SEP', 'OCT', 'NOV', 'DÉC'],
        buckets: 12,
      };
  }
}

function getBucketIndex(period: PeriodKey, dateStr: string): number {
  const date = new Date(dateStr);
  const now = new Date();
  switch (period) {
    case '7J': {
      const daysAgo = Math.floor((now.getTime() - date.getTime()) / 86400000);
      return 6 - daysAgo;
    }
    case '30J': {
      const daysAgo = Math.floor((now.getTime() - date.getTime()) / 86400000);
      return 29 - daysAgo;
    }
    case 'Mois': {
      const day = date.getDate();
      return Math.min(Math.floor((day - 1) / 7), 3);
    }
    case 'An':
      return date.getMonth();
  }
}

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

export const getRevenueSeries = cache(async (
  userId: string,
  storeIds: string[],
  period: PeriodKey,
): Promise<RevenueSeries> => {
  const supabase = await createClient();

  const { data: boutiquesData } = await supabase
    .from('boutiques')
    .select('id, nom, couleur_theme')
    .eq('proprietaire_id', userId)
    .eq('actif', true);

  const allBoutiques = boutiquesData ?? [];
  const filteredBoutiques =
    storeIds.length > 0
      ? allBoutiques.filter((b) => storeIds.includes(b.id as string))
      : allBoutiques;

  const boutiqueIds = filteredBoutiques.map((b) => b.id as string);

  if (!boutiqueIds.length) {
    const { labels, buckets } = buildLabels(period);
    return { labels, global: Array<number>(buckets).fill(0), byStore: [] };
  }

  const periodStart = getPeriodStart(period);
  const { data: txs } = await supabase
    .from('transactions')
    .select('created_at, montant_total, boutique_id')
    .in('boutique_id', boutiqueIds)
    .eq('statut', 'validee')
    .gte('created_at', periodStart.toISOString());

  const { labels, buckets } = buildLabels(period);
  const global = Array<number>(buckets).fill(0);
  const storeData: Record<string, number[]> = {};
  for (const b of filteredBoutiques) {
    storeData[b.id as string] = Array<number>(buckets).fill(0);
  }

  for (const tx of txs ?? []) {
    const idx = getBucketIndex(period, tx.created_at as string);
    if (idx < 0 || idx >= buckets) continue;
    const amount = (tx.montant_total as number) ?? 0;
    global[idx] += amount;
    const sid = tx.boutique_id as string;
    if (storeData[sid]) storeData[sid][idx] += amount;
  }

  const byStore = filteredBoutiques.map((b, i) => ({
    id: b.id as string,
    name: b.nom as string,
    color: (b.couleur_theme as string) || CHART_COLORS[i % CHART_COLORS.length],
    data: storeData[b.id as string] ?? Array<number>(buckets).fill(0),
  }));

  return { labels, global, byStore };
});
