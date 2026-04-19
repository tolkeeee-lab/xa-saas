import { cache } from 'react';
import { createClient } from '@/lib/supabase-server';

export type AlertRow = {
  id: string;
  type: 'stock_critical' | 'stock_warning' | 'sales_drop';
  message: string;
  boutique: string;
  relativeTime: string;
  severity: 'critical' | 'warning';
};
export type AlertsData = AlertRow[];

function relativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffH = Math.floor(diffMs / 3600000);
  if (diffH < 1) {
    const diffMin = Math.floor(diffMs / 60000);
    return diffMin <= 1 ? "à l'instant" : `il y a ${diffMin}min`;
  }
  if (diffH < 24) return `il y a ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  return `il y a ${diffD}j`;
}

export const getAlerts = cache(async (
  userId: string,
  storeIds: string[],
): Promise<AlertsData> => {
  const supabase = await createClient();

  const { data: boutiquesData } = await supabase
    .from('boutiques')
    .select('id, nom')
    .eq('proprietaire_id', userId)
    .eq('actif', true);

  if (!boutiquesData?.length) return [];

  const allIds = boutiquesData.map((b) => b.id as string);
  const boutiqueIds = storeIds.length > 0 ? allIds.filter((id) => storeIds.includes(id)) : allIds;
  const boutiqueMap = new Map(boutiquesData.map((b) => [b.id as string, b.nom as string]));

  const { data: produits } = await supabase
    .from('produits')
    .select('id, nom, boutique_id, stock_actuel, seuil_alerte, updated_at')
    .in('boutique_id', boutiqueIds)
    .eq('actif', true)
    .order('stock_actuel', { ascending: true })
    .limit(20);

  const alerts: AlertRow[] = [];
  for (const p of produits ?? []) {
    const stock = (p.stock_actuel as number) ?? 0;
    const seuil = (p.seuil_alerte as number) ?? 0;
    const boutiqueName = boutiqueMap.get(p.boutique_id as string) ?? '';
    const updatedAt = new Date(p.updated_at as string);

    if (stock === 0) {
      alerts.push({
        id: p.id as string,
        type: 'stock_critical',
        message: `Rupture de stock : ${p.nom as string}`,
        boutique: boutiqueName,
        relativeTime: relativeTime(updatedAt),
        severity: 'critical',
      });
    } else if (stock > 0 && stock <= seuil) {
      alerts.push({
        id: p.id as string,
        type: 'stock_warning',
        message: `Stock bas (${stock}) : ${p.nom as string}`,
        boutique: boutiqueName,
        relativeTime: relativeTime(updatedAt),
        severity: 'warning',
      });
    }
  }

  return alerts.slice(0, 10);
});
