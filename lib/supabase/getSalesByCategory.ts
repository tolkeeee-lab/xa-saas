import { cache } from 'react';
import { createClient } from '@/lib/supabase-server';

export type CategoryStat = {
  categorie: string;
  ca_total: number;
  quantite_totale: number;
};

export const getSalesByCategory = cache(async (
  userId: string,
  dateDebut: string,
  dateFin: string,
): Promise<CategoryStat[]> => {
  const supabase = await createClient();

  const { data: boutiques } = await supabase
    .from('boutiques')
    .select('id')
    .eq('proprietaire_id', userId)
    .eq('actif', true);

  if (!boutiques?.length) return [];

  const boutiqueIds = boutiques.map((b) => b.id);
  const startISO = `${dateDebut}T00:00:00.000Z`;
  const endISO = `${dateFin}T23:59:59.999Z`;

  const { data: transactions } = await supabase
    .from('transactions')
    .select('id')
    .in('boutique_id', boutiqueIds)
    .eq('statut', 'validee')
    .gte('created_at', startISO)
    .lte('created_at', endISO);

  if (!transactions?.length) return [];

  const txIds = transactions.map((t) => t.id);

  const { data: lignes } = await supabase
    .from('transaction_lignes')
    .select('produit_id, quantite, sous_total')
    .in('transaction_id', txIds);

  if (!lignes?.length) return [];

  const produitIds = [
    ...new Set(
      lignes
        .filter((l) => l.produit_id !== null)
        .map((l) => l.produit_id as string),
    ),
  ];

  const { data: produits } = produitIds.length > 0
    ? await supabase
        .from('produits')
        .select('id, categorie')
        .in('id', produitIds)
    : { data: [] };

  const categorieMap = new Map<string, string>();
  for (const p of produits ?? []) {
    categorieMap.set(p.id as string, (p.categorie as string | null) ?? 'Général');
  }

  const catMap = new Map<string, { ca_total: number; quantite_totale: number }>();
  for (const ligne of lignes) {
    const cat =
      ligne.produit_id !== null
        ? (categorieMap.get(ligne.produit_id as string) ?? 'Autre')
        : 'Autre';
    const existing = catMap.get(cat);
    if (existing) {
      existing.ca_total += (ligne.sous_total as number) ?? 0;
      existing.quantite_totale += (ligne.quantite as number) ?? 0;
    } else {
      catMap.set(cat, {
        ca_total: (ligne.sous_total as number) ?? 0,
        quantite_totale: (ligne.quantite as number) ?? 0,
      });
    }
  }

  return Array.from(catMap.entries())
    .map(([categorie, stats]) => ({ categorie, ...stats }))
    .sort((a, b) => b.ca_total - a.ca_total);
});
