import { cache } from 'react';
import { createClient } from '@/lib/supabase-server';
import { getHealthScores } from './health-scores';
import { getAlerts } from './alerts';

export type BoutiqueSummary = {
  id: string;
  nom: string;
  ville: string;
  quartier: string | null;
  couleur_theme: string;
  ca_today: number;
  ca_yesterday: number;
  orders_today: number;
  panier_moyen: number;
  employes_actifs: number;
  stock_alerts: number;
  health_score: number;
  statut: 'ACTIF' | 'ALERTE' | 'OFFLINE';
};

export type GlobalSummary = {
  ca_today: number;
  orders_today: number;
  ca_yesterday: number;
  top3: { id: string; nom: string; ca: number; color: string }[];
};

export const getBoutiquesSummary = cache(async (userId: string): Promise<BoutiqueSummary[]> => {
  const supabase = await createClient();

  const { data: boutiquesData } = await supabase
    .from('boutiques')
    .select('id, nom, ville, quartier, couleur_theme, actif')
    .eq('proprietaire_id', userId)
    .eq('actif', true);

  if (!boutiquesData?.length) return [];

  const boutiqueIds = boutiquesData.map((b) => b.id as string);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const [
    { data: txsToday },
    { data: txsYesterday },
    { data: employes },
    { data: produits },
    healthScores,
  ] = await Promise.all([
    supabase
      .from('transactions')
      .select('boutique_id, montant_total, statut')
      .in('boutique_id', boutiqueIds)
      .eq('statut', 'validee')
      .gte('created_at', today.toISOString()),
    supabase
      .from('transactions')
      .select('boutique_id, montant_total')
      .in('boutique_id', boutiqueIds)
      .eq('statut', 'validee')
      .gte('created_at', yesterday.toISOString())
      .lt('created_at', today.toISOString()),
    supabase
      .from('employes')
      .select('boutique_id, actif')
      .in('boutique_id', boutiqueIds),
    supabase
      .from('produits')
      .select('boutique_id, stock_actuel, seuil_alerte')
      .in('boutique_id', boutiqueIds)
      .eq('actif', true),
    getHealthScores(userId),
  ]);

  const healthMap = new Map(healthScores.map((h) => [h.id, h.score]));

  return boutiquesData.map((b) => {
    const bid = b.id as string;

    const bTxsToday = (txsToday ?? []).filter((t) => t.boutique_id === bid);
    const bTxsYesterday = (txsYesterday ?? []).filter((t) => t.boutique_id === bid);
    const bEmployes = (employes ?? []).filter((e) => e.boutique_id === bid);
    const bProduits = (produits ?? []).filter((p) => p.boutique_id === bid);

    const ca_today = bTxsToday.reduce((s, t) => s + ((t.montant_total as number) ?? 0), 0);
    const ca_yesterday = bTxsYesterday.reduce((s, t) => s + ((t.montant_total as number) ?? 0), 0);
    const orders_today = bTxsToday.length;
    const panier_moyen = orders_today > 0 ? Math.round(ca_today / orders_today) : 0;
    const employes_actifs = bEmployes.filter((e) => e.actif as boolean).length;
    const stock_alerts = bProduits.filter((p) => {
      const stock = (p.stock_actuel as number) ?? 0;
      const seuil = (p.seuil_alerte as number) ?? 0;
      return seuil > 0 && stock <= seuil;
    }).length;
    const health_score = healthMap.get(bid) ?? 0;

    let statut: 'ACTIF' | 'ALERTE' | 'OFFLINE' = 'OFFLINE';
    if (orders_today > 0) {
      statut = stock_alerts > 0 ? 'ALERTE' : 'ACTIF';
    } else if (employes_actifs > 0) {
      statut = 'ACTIF';
    }

    return {
      id: bid,
      nom: b.nom as string,
      ville: b.ville as string,
      quartier: b.quartier as string | null,
      couleur_theme: (b.couleur_theme as string) || 'var(--xa-accent)',
      ca_today,
      ca_yesterday,
      orders_today,
      panier_moyen,
      employes_actifs,
      stock_alerts,
      health_score,
      statut,
    };
  });
});

export const getGlobalSummary = cache(async (userId: string): Promise<GlobalSummary> => {
  const summaries = await getBoutiquesSummary(userId);

  const ca_today = summaries.reduce((s, b) => s + b.ca_today, 0);
  const ca_yesterday = summaries.reduce((s, b) => s + b.ca_yesterday, 0);
  const orders_today = summaries.reduce((s, b) => s + b.orders_today, 0);

  const top3 = [...summaries]
    .sort((a, b) => b.ca_today - a.ca_today)
    .slice(0, 3)
    .map((b) => ({ id: b.id, nom: b.nom, ca: b.ca_today, color: b.couleur_theme }));

  return { ca_today, ca_yesterday, orders_today, top3 };
});

// Keep getAlerts re-exported for convenience
export { getAlerts };
