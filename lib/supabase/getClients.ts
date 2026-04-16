import { unstable_cache } from 'next/cache';
import { createClient } from '@/lib/supabase-server';
import type { Client } from '@/types/database';

export type ClientsData = {
  clients: Client[];
  total_clients: number;
  clients_avec_remise: number; // clients avec points >= 100
  total_points_reseau: number;
};

export function getClients(userId: string): Promise<ClientsData> {
  return unstable_cache(
    async () => {
      const supabase = await createClient();

      const { data } = await supabase
        .from('clients')
        .select('id, proprietaire_id, nom, telephone, points, total_achats, nb_visites, actif, created_at, updated_at')
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
    },
    ['clients', userId],
    { revalidate: 60, tags: [`clients-${userId}`] },
  )();
}
