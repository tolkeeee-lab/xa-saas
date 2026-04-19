import { cache } from 'react';
import { createClient } from '@/lib/supabase-server';

export type HealthScore = { id: string; name: string; color: string; score: number };
export type HealthScoresData = HealthScore[];

export const getHealthScores = cache(async (userId: string): Promise<HealthScoresData> => {
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

  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [{ data: produits }, { data: txsToday }, { data: txs7d }, { data: employes }] =
    await Promise.all([
      supabase
        .from('produits')
        .select('id, boutique_id, stock_actuel, seuil_alerte')
        .in('boutique_id', boutiqueIds)
        .eq('actif', true),
      supabase
        .from('transactions')
        .select('boutique_id, montant_total')
        .in('boutique_id', boutiqueIds)
        .eq('statut', 'validee')
        .gte('created_at', today.toISOString()),
      supabase
        .from('transactions')
        .select('boutique_id, created_at')
        .in('boutique_id', boutiqueIds)
        .eq('statut', 'validee')
        .gte('created_at', sevenDaysAgo.toISOString())
        .lt('created_at', today.toISOString()),
      supabase
        .from('employes')
        .select('boutique_id, actif')
        .in('boutique_id', boutiqueIds),
    ]);

  return boutiquesData.map((b) => {
    const bid = b.id as string;
    const bProduits = (produits ?? []).filter((p) => p.boutique_id === bid);
    const bTxsToday = (txsToday ?? []).filter((t) => t.boutique_id === bid);
    const bTxs7d = (txs7d ?? []).filter((t) => t.boutique_id === bid);
    const bEmployes = (employes ?? []).filter((e) => e.boutique_id === bid);

    // 25 pts: stock OK ratio
    const totalProducts = bProduits.length;
    const okProducts = bProduits.filter((p) => {
      const stock = (p.stock_actuel as number) ?? 0;
      const seuil = (p.seuil_alerte as number) ?? 0;
      return stock > seuil;
    }).length;
    const stockScore = totalProducts > 0 ? Math.round((okProducts / totalProducts) * 25) : 25;

    // 25 pts: sales vs 80% of 7-day daily average
    const avgDaily7d = bTxs7d.length / 7;
    const todayCount = bTxsToday.length;
    const salesScore =
      avgDaily7d === 0 || todayCount >= avgDaily7d * 0.8
        ? 25
        : Math.round((todayCount / (avgDaily7d * 0.8)) * 25);

    // 25 pts: has active staff
    const hasActiveStaff = bEmployes.some((e) => e.actif as boolean);
    const staffScore = hasActiveStaff ? 25 : 0;

    // 25 pts: no critical stock alerts
    const hasCritical = bProduits.some((p) => (p.stock_actuel as number) === 0);
    const alertScore = hasCritical ? 0 : 25;

    const score = Math.min(100, stockScore + salesScore + staffScore + alertScore);

    return {
      id: bid,
      name: b.nom as string,
      color: b.couleur_theme as string,
      score,
    };
  });
});
