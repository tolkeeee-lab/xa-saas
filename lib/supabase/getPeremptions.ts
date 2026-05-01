import { cache } from 'react';
import { createClient } from '@/lib/supabase-server';
import type { Produit } from '@/types/database';

/**
 * ProduitPeremption includes all Produit fields (including prix_achat)
 * so that the "Valeur perdue" column can be computed as stock_actuel * prix_achat.
 * date_peremption is guaranteed non-null here (filtered server-side).
 */
export type ProduitPeremption = Omit<Produit, 'date_peremption'> & {
  date_peremption: string;
  boutique_nom: string;
  jours_restants: number;
};

export const getPeremptions = cache(async (userId: string): Promise<ProduitPeremption[]> => {
  const supabase = await createClient();

  // Fetch boutiques owned by the user
  const { data: boutiques } = await supabase
    .from('boutiques')
    .select('id, nom')
    .eq('proprietaire_id', userId);

  if (!boutiques?.length) return [];

  const boutiqueIds = boutiques.map((b) => b.id);
  const boutiqueNomMap = new Map(boutiques.map((b) => [b.id, b.nom]));

  // Fetch products with expiry dates — date_peremption is never null here
  const { data: produits } = await supabase
    .from('produits')
    .select(
      'id, boutique_id, nom, categorie, description, prix_achat, prix_vente, stock_actuel, seuil_alerte, unite, actif, date_peremption, mode_achat, qty_par_lot, prix_lot_achat, lot_label, unite_label, image_url, created_at, updated_at',
    )
    .in('boutique_id', boutiqueIds)
    .not('date_peremption', 'is', null)
    .eq('actif', true)
    .order('date_peremption', { ascending: true });

  if (!produits) return [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return produits
    .filter((p): p is typeof p & { date_peremption: string } => p.date_peremption !== null)
    .map((p) => {
      const expiry = new Date(p.date_peremption);
      expiry.setHours(0, 0, 0, 0);
      const diffMs = expiry.getTime() - today.getTime();
      const jours_restants = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      return {
        ...p,
        date_peremption: p.date_peremption,
        boutique_nom: boutiqueNomMap.get(p.boutique_id) ?? '',
        jours_restants,
      };
    });
});
