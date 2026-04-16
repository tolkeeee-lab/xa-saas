import { cache } from 'react';
import { createClient } from '@/lib/supabase-server';
import type { Boutique } from '@/types/database';

export type StockConsolideRow = {
  id: string;
  nom: string;
  categorie: string;
  stocks: Record<string, number>; // boutiqueId → stock_actuel
  total: number;
  seuil_alerte: number;
  statut: 'ok' | 'bas' | 'rupture';
};

export type StocksConsolidesData = {
  boutiques: Pick<Boutique, 'id' | 'nom' | 'couleur_theme'>[];
  produits: StockConsolideRow[];
  totalRefs: number;
  valeurReseau: number; // computed server-side from prix_achat × stock_actuel
  ruptures: number;
  stocksBas: number;
};

/**
 * Fetch consolidated stock data across all boutiques for a proprietaire.
 * prix_achat is used server-side only to compute valeurReseau; it is never returned.
 */
export const getStocksConsolides = cache(async (userId: string): Promise<StocksConsolidesData> => {
  const supabase = await createClient();

  // Fetch all active boutiques for this proprietaire
  const { data: boutiquesData } = await supabase
    .from('boutiques')
    .select('id, nom, couleur_theme')
    .eq('proprietaire_id', userId)
    .eq('actif', true)
    .order('created_at', { ascending: true });

  const boutiques = boutiquesData ?? [];
  const boutiqueIds = boutiques.map((b) => b.id);

  if (boutiqueIds.length === 0) {
    return { boutiques: [], produits: [], totalRefs: 0, valeurReseau: 0, ruptures: 0, stocksBas: 0 };
  }

  // Fetch all products (with prix_achat for server-side valeurReseau calculation)
  const { data: produitsData } = await supabase
    .from('produits')
    .select('id, boutique_id, nom, categorie, prix_achat, stock_actuel, seuil_alerte, actif')
    .in('boutique_id', boutiqueIds)
    .eq('actif', true)
    .order('nom', { ascending: true });

  const rawProduits = produitsData ?? [];

  // Build a map: nom → aggregated row (to merge same product across boutiques by name)
  const rowMap = new Map<string, StockConsolideRow & { prix_achat: number }>();

  for (const p of rawProduits) {
    const key = p.nom;
    const existing = rowMap.get(key);
    if (existing) {
      existing.stocks[p.boutique_id] = p.stock_actuel;
      existing.total += p.stock_actuel;
    } else {
      rowMap.set(key, {
        id: p.id,
        nom: p.nom,
        categorie: (p.categorie as string | null) ?? 'Général',
        stocks: { [p.boutique_id]: p.stock_actuel },
        total: p.stock_actuel,
        seuil_alerte: p.seuil_alerte,
        statut: 'ok', // computed below
        prix_achat: p.prix_achat,
      });
    }
  }

  // Compute statuts and aggregates
  let valeurReseau = 0;
  let ruptures = 0;
  let stocksBas = 0;

  const produits: StockConsolideRow[] = [];

  for (const row of rowMap.values()) {
    // valeur réseau uses prix_achat server-side only
    valeurReseau += row.prix_achat * row.total;

    let statut: StockConsolideRow['statut'];
    if (row.total === 0) {
      statut = 'rupture';
      ruptures++;
    } else if (row.total <= row.seuil_alerte) {
      statut = 'bas';
      stocksBas++;
    } else {
      statut = 'ok';
    }

    // Strip prix_achat before returning to client
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { prix_achat: _pa, ...publicRow } = row;
    produits.push({ ...publicRow, statut });
  }

  return {
    boutiques,
    produits,
    totalRefs: produits.length,
    valeurReseau,
    ruptures,
    stocksBas,
  };
});
