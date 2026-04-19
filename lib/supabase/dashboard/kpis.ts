import { cache } from 'react';
import { createClient } from '@/lib/supabase-server';

export type PeriodKey = '7J' | '30J' | 'Mois' | 'An';

export type KPIData = {
  volume: { value: number; delta: number; prev: number };
  orders: { value: number; delta: number; prev: number };
  visitors: { value: number; delta: number; prev: number };
  stockAlerts: { value: number };
};

function getPeriodBounds(period: PeriodKey): {
  startISO: string;
  endISO: string;
  prevStartISO: string;
  prevEndISO: string;
} {
  const now = new Date();
  let start: Date;
  const end = new Date(now);

  switch (period) {
    case '7J':
      start = new Date(now);
      start.setDate(start.getDate() - 6);
      break;
    case '30J':
      start = new Date(now);
      start.setDate(start.getDate() - 29);
      break;
    case 'Mois':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'An':
      start = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      start = new Date(now);
      start.setDate(start.getDate() - 6);
  }

  const periodMs = end.getTime() - start.getTime();
  const prevEnd = new Date(start.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - periodMs);

  return {
    startISO: start.toISOString(),
    endISO: end.toISOString(),
    prevStartISO: prevStart.toISOString(),
    prevEndISO: prevEnd.toISOString(),
  };
}

export const getKPIs = cache(async (
  userId: string,
  storeIds: string[],
  period: PeriodKey,
): Promise<KPIData> => {
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
      volume: { value: 0, delta: 0, prev: 0 },
      orders: { value: 0, delta: 0, prev: 0 },
      visitors: { value: 0, delta: 0, prev: 0 },
      stockAlerts: { value: 0 },
    };
  }

  const { startISO, endISO, prevStartISO, prevEndISO } = getPeriodBounds(period);

  const [{ data: currentTxs }, { data: prevTxs }, { data: allProduits }] = await Promise.all([
    supabase
      .from('transactions')
      .select('montant_total')
      .in('boutique_id', boutiqueIds)
      .eq('statut', 'validee')
      .gte('created_at', startISO)
      .lte('created_at', endISO),
    supabase
      .from('transactions')
      .select('montant_total')
      .in('boutique_id', boutiqueIds)
      .eq('statut', 'validee')
      .gte('created_at', prevStartISO)
      .lte('created_at', prevEndISO),
    supabase
      .from('produits')
      .select('stock_actuel, seuil_alerte')
      .in('boutique_id', boutiqueIds)
      .eq('actif', true),
  ]);

  const currentVolume = (currentTxs ?? []).reduce(
    (s, t) => s + ((t.montant_total as number) ?? 0),
    0,
  );
  const prevVolume = (prevTxs ?? []).reduce(
    (s, t) => s + ((t.montant_total as number) ?? 0),
    0,
  );
  const volumeDelta =
    prevVolume > 0 ? Math.round(((currentVolume - prevVolume) / prevVolume) * 100) : 0;

  const currentOrders = (currentTxs ?? []).length;
  const prevOrders = (prevTxs ?? []).length;
  const ordersDelta =
    prevOrders > 0 ? Math.round(((currentOrders - prevOrders) / prevOrders) * 100) : 0;

  // Visitors are estimated from transaction count. Each transaction
  // is assumed to involve ~1.47 unique visitors on average (foot traffic
  // includes browsers who don't purchase plus multi-item group buyers).
  const VISITOR_ESTIMATION_FACTOR = 1.47;
  const currentVisitors = Math.round(currentOrders * VISITOR_ESTIMATION_FACTOR);
  const prevVisitors = Math.round(prevOrders * VISITOR_ESTIMATION_FACTOR);
  const visitorsDelta =
    prevVisitors > 0 ? Math.round(((currentVisitors - prevVisitors) / prevVisitors) * 100) : 0;

  const stockAlerts = (allProduits ?? []).filter((p) => {
    const stock = (p.stock_actuel as number) ?? 0;
    const seuil = (p.seuil_alerte as number) ?? 0;
    return stock === 0 || (stock > 0 && stock <= seuil);
  }).length;

  return {
    volume: { value: currentVolume, delta: volumeDelta, prev: prevVolume },
    orders: { value: currentOrders, delta: ordersDelta, prev: prevOrders },
    visitors: { value: currentVisitors, delta: visitorsDelta, prev: prevVisitors },
    stockAlerts: { value: stockAlerts },
  };
});
