import { cache } from 'react';
import { createClient } from '@/lib/supabase-server';
import type { Inventaire, InventaireLigne, Produit, Boutique } from '@/types/database';

export type InventaireAvecBoutique = Inventaire & {
  boutique: Pick<Boutique, 'id' | 'nom'>;
};

export type LigneAvecProduit = InventaireLigne & {
  produit: Pick<Produit, 'id' | 'nom' | 'categorie' | 'unite'>;
};

export type InventaireDetail = Inventaire & {
  boutique: Pick<Boutique, 'id' | 'nom'>;
  lignes: LigneAvecProduit[];
};

export const getInventaires = cache(async (
  userId: string,
  opts?: { boutiqueId?: string; limit?: number },
): Promise<InventaireAvecBoutique[]> => {
  const supabase = await createClient();

  let query = supabase
    .from('inventaires')
    .select('id, boutique_id, proprietaire_id, created_by, started_at, validated_at, statut, perimetre, categorie, nb_produits, nb_ecarts_negatifs, nb_ecarts_positifs, valeur_ecart_total, note, created_at, updated_at')
    .eq('proprietaire_id', userId)
    .order('started_at', { ascending: false })
    .limit(opts?.limit ?? 30);

  if (opts?.boutiqueId) {
    query = query.eq('boutique_id', opts.boutiqueId);
  }

  const { data: inventaires } = await query;
  if (!inventaires?.length) return [];

  // Fetch boutique names
  const boutiqueIds = [...new Set(inventaires.map((i) => i.boutique_id as string))];
  const { data: boutiques } = await supabase
    .from('boutiques')
    .select('id, nom')
    .in('id', boutiqueIds);

  const boutiqueMap = new Map(
    (boutiques ?? []).map((b) => [b.id as string, b.nom as string]),
  );

  return inventaires.map((inv) => ({
    ...(inv as Inventaire),
    boutique: {
      id: inv.boutique_id as string,
      nom: boutiqueMap.get(inv.boutique_id as string) ?? '',
    },
  }));
});

export async function getInventaire(
  userId: string,
  inventaireId: string,
): Promise<InventaireDetail | null> {
  const supabase = await createClient();

  const { data: inv } = await supabase
    .from('inventaires')
    .select('id, boutique_id, proprietaire_id, created_by, started_at, validated_at, statut, perimetre, categorie, nb_produits, nb_ecarts_negatifs, nb_ecarts_positifs, valeur_ecart_total, note, created_at, updated_at')
    .eq('id', inventaireId)
    .eq('proprietaire_id', userId)
    .single();

  if (!inv) return null;

  // Fetch boutique name
  const { data: boutique } = await supabase
    .from('boutiques')
    .select('id, nom')
    .eq('id', inv.boutique_id as string)
    .single();

  // Fetch lignes with produit details
  const { data: lignes } = await supabase
    .from('inventaire_lignes')
    .select('id, inventaire_id, produit_id, stock_theorique, stock_compte, ecart, prix_vente_snapshot, created_at, updated_at')
    .eq('inventaire_id', inventaireId)
    .order('created_at', { ascending: true });

  if (!lignes?.length) {
    return {
      ...(inv as Inventaire),
      boutique: { id: inv.boutique_id as string, nom: boutique?.nom as string ?? '' },
      lignes: [],
    };
  }

  // Fetch produit details
  const produitIds = lignes.map((l) => l.produit_id as string);
  const { data: produits } = await supabase
    .from('produits')
    .select('id, nom, categorie, unite')
    .in('id', produitIds);

  const produitMap = new Map(
    (produits ?? []).map((p) => [p.id as string, p]),
  );

  const lignesAvecProduit: LigneAvecProduit[] = lignes.map((l) => {
    const p = produitMap.get(l.produit_id as string);
    return {
      ...(l as InventaireLigne),
      produit: {
        id: l.produit_id as string,
        nom: p?.nom as string ?? '',
        categorie: p?.categorie as string ?? '',
        unite: p?.unite as string ?? 'unité',
      },
    };
  });

  return {
    ...(inv as Inventaire),
    boutique: { id: inv.boutique_id as string, nom: boutique?.nom as string ?? '' },
    lignes: lignesAvecProduit,
  };
}
