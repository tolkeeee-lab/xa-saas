import { cache } from 'react';
import { createClient } from '@/lib/supabase-server';

export type ForecastData = {
  estimatedCA: number;
  estimatedCADelta: number;
  peakHourRange: string;
  restockCount: number;
};

// Weekday-based demand factors for tomorrow's forecast.
// Index maps to JavaScript's Date.getDay(): 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
// Factors derived from regional retail benchmarks (West Africa small-format retail).
// Sun (0.7): slow start; Mon–Wed (~1.0): baseline; Thu–Fri (1.05–1.15): market days; Sat (0.85): partial.
const WEEKDAY_FACTORS = [0.7, 0.95, 1.0, 1.0, 1.05, 1.15, 0.85];

export const getForecast = cache(async (
  userId: string,
  storeIds: string[],
): Promise<ForecastData> => {
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

  if (!boutiqueIds.length) {
    return { estimatedCA: 0, estimatedCADelta: 0, peakHourRange: 'N/A', restockCount: 0 };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [{ data: txsToday }, { data: txs7d }, { data: produits }] = await Promise.all([
    supabase
      .from('transactions')
      .select('montant_total, created_at')
      .in('boutique_id', boutiqueIds)
      .eq('statut', 'validee')
      .gte('created_at', today.toISOString()),
    supabase
      .from('transactions')
      .select('montant_total, created_at')
      .in('boutique_id', boutiqueIds)
      .eq('statut', 'validee')
      .gte('created_at', sevenDaysAgo.toISOString())
      .lt('created_at', today.toISOString()),
    supabase
      .from('produits')
      .select('stock_actuel, seuil_alerte')
      .in('boutique_id', boutiqueIds)
      .eq('actif', true),
  ]);

  const caToday = (txsToday ?? []).reduce(
    (s, t) => s + ((t.montant_total as number) ?? 0),
    0,
  );
  const avgDaily7d =
    (txs7d ?? []).reduce((s, t) => s + ((t.montant_total as number) ?? 0), 0) / 7;

  const tomorrowDow = (today.getDay() + 1) % 7;
  const factor = WEEKDAY_FACTORS[tomorrowDow];
  const estimatedCA = Math.round(avgDaily7d * factor);

  const estimatedCADelta =
    caToday > 0 ? Math.round(((estimatedCA - caToday) / caToday) * 100) : 0;

  const hourCounts = Array<number>(24).fill(0);
  for (const tx of txs7d ?? []) {
    const h = new Date(tx.created_at as string).getHours();
    hourCounts[h]++;
  }
  const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
  const peakHourRange = `${peakHour}H-${peakHour + 2}H`;

  const restockCount = (produits ?? []).filter((p) => {
    const stock = (p.stock_actuel as number) ?? 0;
    const seuil = (p.seuil_alerte as number) ?? 0;
    return stock <= seuil;
  }).length;

  return { estimatedCA, estimatedCADelta, peakHourRange, restockCount };
});
