import { createAdminClient } from '@/lib/supabase-admin';
import type { Client } from '@/types/database';
import type { EmployeSession } from '@/lib/employe-session';

export type ClientsEmployeData = {
  clients: Client[];
  total_clients: number;
};

/**
 * Fetch clients owned by the boutique's proprietaire.
 * Clients are at the proprietaire level (shared across boutiques).
 */
export async function getClientsForEmploye(
  session: EmployeSession,
): Promise<ClientsEmployeData> {
  const admin = createAdminClient();

  // Get the proprietaire_id from the boutique
  const { data: boutique } = await admin
    .from('boutiques')
    .select('proprietaire_id')
    .eq('id', session.boutique_id)
    .single();

  if (!boutique) return { clients: [], total_clients: 0 };

  const { data } = await admin
    .from('clients')
    .select(
      'id, proprietaire_id, nom, telephone, points, total_achats, nb_visites, actif, created_at, updated_at',
    )
    .eq('proprietaire_id', boutique.proprietaire_id)
    .eq('actif', true)
    .order('nom', { ascending: true });

  const clients: Client[] = (data ?? []) as Client[];

  return { clients, total_clients: clients.length };
}
