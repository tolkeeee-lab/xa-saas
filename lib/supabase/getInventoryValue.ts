import { supabaseAdmin } from '@/lib/supabase-admin';

export interface InventoryValue {
  valeur_achat: number;
  valeur_vente: number;
  nb_produits: number;
}

/**
 * Calcule la valeur totale du stock d'une boutique.
 */
export async function getInventoryValue(boutiqueId: string): Promise<InventoryValue> {
  const { data, error } = await supabaseAdmin
    .from('produits')
    .select('prix_achat, prix_vente, stock_actuel')
    .eq('boutique_id', boutiqueId)
    .eq('actif', true);

  if (error) throw error;

  let valeur_achat = 0;
  let valeur_vente = 0;
  for (const p of data ?? []) {
    valeur_achat += p.prix_achat * p.stock_actuel;
    valeur_vente += p.prix_vente * p.stock_actuel;
  }

  return { valeur_achat, valeur_vente, nb_produits: data?.length ?? 0 };
}
