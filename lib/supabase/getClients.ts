import { createClient } from '@/lib/supabase-server';
import type { Client } from '@/types/database';

export type ClientsData = {
  clients: Client[];
  total_clients: number;
  clients_avec_remise: number; // clients avec points >= 100
  total_points_reseau: number;
};

export async function getClients(userId: string): Promise<ClientsData> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('clients')
    .select('*')
    .eq('proprietaire_id', userId)
    .eq('actif', true)
    .order('points', { ascending: false });

  const clients: Client[] = (data ?? []) as Client[];

  return {
    clients,
    total_clients: clients.length,
    clients_avec_remise: clients.filter((c) => c.points >= 100).length,
    total_points_reseau: clients.reduce((s, c) => s + c.points, 0),
  };
}
