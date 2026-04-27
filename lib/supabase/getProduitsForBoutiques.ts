import { createClient } from '@/lib/supabase-server';
import type { ProduitPublic } from '@/types/database';

/**
 * Fetch all active products for one or more boutiques.
 * Never returns prix_achat (security: use for client-side rendering only).
 *
 * - 1 boutique → products for that boutique only
 * - multiple boutiques → all products from all specified boutiques, with boutique_id
 */
export async function getProduitsForBoutiques(boutiqueIds: string[]): Promise<ProduitPublic[]> {
  if (boutiqueIds.length === 0) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from('produits')
    .select(
      'id, boutique_id, nom, categorie, description, prix_vente, stock_actuel, seuil_alerte, unite, actif, created_at, updated_at',
    )
    .in('boutique_id', boutiqueIds)
    .eq('actif', true)
    .order('nom', { ascending: true });

  return (data ?? []) as ProduitPublic[];
}
