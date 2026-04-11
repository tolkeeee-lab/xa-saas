import { createClient } from '@/lib/supabase-server';
import type { Transfert } from '@/types/database';

export async function getTransferts(userId: string): Promise<Transfert[]> {
  const supabase = await createClient();

  // Fetch boutique IDs owned by the user
  const { data: boutiques } = await supabase
    .from('boutiques')
    .select('id')
    .eq('proprietaire_id', userId);

  if (!boutiques?.length) return [];

  const boutiqueIds = boutiques.map((b) => b.id);

  const { data } = await supabase
    .from('transferts')
    .select('*')
    .or(
      `boutique_source_id.in.(${boutiqueIds.join(',')}),boutique_destination_id.in.(${boutiqueIds.join(',')})`,
    )
    .order('created_at', { ascending: false });

  return (data ?? []) as Transfert[];
}
