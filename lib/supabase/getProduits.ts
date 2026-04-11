import { createClient } from '@/lib/supabase-server';
import type { ProduitPublic } from '@/types/database';

/**
 * Fetch all active products for a boutique, excluding prix_achat.
 */
export async function getProduits(boutiqueId: string): Promise<ProduitPublic[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('produits')
    .select('id, boutique_id, nom, categorie, description, prix_vente, stock_actuel, seuil_alerte, unite, actif, created_at, updated_at')
    .eq('boutique_id', boutiqueId)
    .eq('actif', true)
    .order('nom', { ascending: true });
  return (data ?? []) as ProduitPublic[];
}
