import { cache } from 'react';
import { createClient } from '@/lib/supabase-server';
import type { PeriodKey } from './kpis';

export type QuickSummaryData = {
  basketAvg: number;
  conversionRate: number;
  conversionDelta: number;
  insight: string;
  eventsToday: number;
  alertsResolved: number;
  alertsTotal: number;
  criticalStockCount: number;
};

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

export const getQuickSummary = cache(async (
  userId: string,
  storeIds: string[],
  period: PeriodKey,
): Promise<QuickSummaryData> => {
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
    return {
      basketAvg: 0,
      conversionRate: 0,
      conversionDelta: 0,
      insight: 'Aucune boutique active.',
      eventsToday: 0,
      alertsResolved: 0,
      alertsTotal: 0,
      criticalStockCount: 0,
    };
  }

  const periodStart = getPeriodStart(period);
  const periodMs = Date.now() - periodStart.getTime();
  const prevEnd = new Date(periodStart.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - periodMs);

  const [{ data: txsCurrent }, { data: txsPrev }, { data: produits }] = await Promise.all([
    supabase
      .from('transactions')
      .select('montant_total, statut')
      .in('boutique_id', boutiqueIds)
      .gte('created_at', periodStart.toISOString()),
    supabase
      .from('transactions')
      .select('montant_total, statut')
      .in('boutique_id', boutiqueIds)
      .gte('created_at', prevStart.toISOString())
      .lte('created_at', prevEnd.toISOString()),
    supabase
      .from('produits')
      .select('stock_actuel, seuil_alerte')
      .in('boutique_id', boutiqueIds)
      .eq('actif', true),
  ]);

  const validatedCurrent = (txsCurrent ?? []).filter((t) => t.statut === 'validee');
  const totalCurrentCA = validatedCurrent.reduce(
    (s, t) => s + ((t.montant_total as number) ?? 0),
    0,
  );
  const basketAvg =
    validatedCurrent.length > 0 ? Math.round(totalCurrentCA / validatedCurrent.length) : 0;

  const totalCurrent = (txsCurrent ?? []).length;
  const conversionRate =
    totalCurrent > 0 ? Math.round((validatedCurrent.length / totalCurrent) * 100) : 0;

  const validatedPrev = (txsPrev ?? []).filter((t) => t.statut === 'validee');
  const totalPrev = (txsPrev ?? []).length;
  const prevConvRate =
    totalPrev > 0 ? Math.round((validatedPrev.length / totalPrev) * 100) : 0;
  const conversionDelta = prevConvRate > 0 ? conversionRate - prevConvRate : 0;

  const criticalStockCount = (produits ?? []).filter(
    (p) => (p.stock_actuel as number) === 0,
  ).length;
  const alertsTotal = (produits ?? []).filter((p) => {
    const stock = (p.stock_actuel as number) ?? 0;
    const seuil = (p.seuil_alerte as number) ?? 0;
    return stock === 0 || (stock > 0 && stock <= seuil);
  }).length;

  let insight = 'Aucune donnée disponible pour générer un insight.';
  if (validatedCurrent.length > 0) {
    if (criticalStockCount > 0) {
      insight = `${criticalStockCount} produit(s) en rupture de stock. Réapprovisionnez rapidement.`;
    } else if (conversionDelta > 5) {
      insight = `Taux de conversion en hausse de ${conversionDelta}pts. Excellent !`;
    } else if (basketAvg > 0) {
      insight = `Panier moyen de ${basketAvg.toLocaleString('fr-FR')} FCFA sur la période.`;
    }
  }

  return {
    basketAvg,
    conversionRate,
    conversionDelta,
    insight,
    eventsToday: validatedCurrent.length,
    alertsResolved: 0,
    alertsTotal,
    criticalStockCount,
  };
});
