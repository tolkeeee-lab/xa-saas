import { createAdminClient } from '@/lib/supabase-admin';
import type { ProduitPublic } from '@/types/database';
import type { EmployeSession } from '@/lib/employe-session';

/**
 * Fetch active products for the employee's boutique.
 * `prix_achat` is excluded for all roles — gerant sees the same public view
 * here (the exclusion is done at the SELECT level, matching `getProduits`).
 */
export async function getProduitsForEmploye(
  session: EmployeSession,
): Promise<ProduitPublic[]> {
  const admin = createAdminClient();

  const { data } = await admin
    .from('produits')
    .select(
      'id, boutique_id, nom, categorie, description, prix_vente, stock_actuel, seuil_alerte, unite, actif, created_at, updated_at',
    )
    .eq('boutique_id', session.boutique_id)
    .eq('actif', true)
    .order('nom', { ascending: true });

  return (data ?? []) as ProduitPublic[];
}

/**
 * Fetch all products (including prix_achat) for gérant role only.
 */
export async function getProduitsCompletForGerant(
  session: EmployeSession,
): Promise<(ProduitPublic & { prix_achat: number })[]> {
  if (session.role !== 'gerant') return [];

  const admin = createAdminClient();

  const { data } = await admin
    .from('produits')
    .select(
      'id, boutique_id, nom, categorie, description, prix_achat, prix_vente, stock_actuel, seuil_alerte, unite, actif, created_at, updated_at',
    )
    .eq('boutique_id', session.boutique_id)
    .eq('actif', true)
    .order('nom', { ascending: true });

  return (data ?? []) as (ProduitPublic & { prix_achat: number })[];
}
