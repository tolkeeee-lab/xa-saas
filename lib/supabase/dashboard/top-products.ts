import { cache } from 'react';
import { createClient } from '@/lib/supabase-server';

export type TopProductRow = {
  rank: number;
  name: string;
  categorie: string;
  quantite: number;
};
export type TopProductsData = TopProductRow[];

export const getTopProducts = cache(async (
  userId: string,
  storeIds: string[],
): Promise<TopProductsData> => {
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

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: txIds } = await supabase
    .from('transactions')
    .select('id')
    .in('boutique_id', boutiqueIds)
    .eq('statut', 'validee')
    .gte('created_at', today.toISOString());

  if (!txIds?.length) return [];

  const transactionIds = txIds.map((t) => t.id as string);

  const { data: lignes } = await supabase
    .from('transaction_lignes')
    .select('produit_id, nom_produit, quantite')
    .in('transaction_id', transactionIds);

  if (!lignes?.length) return [];

  const quantMap: Record<string, { qty: number; name: string }> = {};
  for (const l of lignes) {
    const pid = (l.produit_id as string | null) ?? `__nom__${l.nom_produit as string}`;
    const existing = quantMap[pid];
    if (existing) {
      existing.qty += (l.quantite as number) ?? 0;
    } else {
      quantMap[pid] = {
        qty: (l.quantite as number) ?? 0,
        name: (l.nom_produit as string) ?? 'Produit inconnu',
      };
    }
  }

  const topEntries = Object.entries(quantMap)
    .sort((a, b) => b[1].qty - a[1].qty)
    .slice(0, 5);

  if (!topEntries.length) return [];

  // Fetch categories for real product IDs
  const realIds = topEntries
    .map(([id]) => id)
    .filter((id) => !id.startsWith('__nom__'));

  const { data: produits } = realIds.length
    ? await supabase.from('produits').select('id, categorie').in('id', realIds)
    : { data: [] };

  const catMap = new Map(
    (produits ?? []).map((p) => [p.id as string, (p.categorie as string | null) ?? 'Autre']),
  );

  return topEntries.map(([id, { qty, name }], idx) => ({
    rank: idx + 1,
    name,
    categorie: catMap.get(id) ?? 'Autre',
    quantite: qty,
  }));
});
