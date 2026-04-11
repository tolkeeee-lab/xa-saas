import { createAdminClient } from '@/lib/supabase-admin';
import type { Transfert } from '@/types/database';

type CreateTransfertInput = {
  produit_id: string;
  boutique_source_id: string;
  boutique_destination_id: string;
  quantite: number;
  note?: string;
};

export async function createTransfert(input: CreateTransfertInput): Promise<Transfert> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('transferts')
    .insert({
      produit_id: input.produit_id,
      boutique_source_id: input.boutique_source_id,
      boutique_destination_id: input.boutique_destination_id,
      quantite: input.quantite,
      note: input.note ?? null,
      statut: 'en_transit',
    })
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'Erreur lors de la création du transfert');
  }

  return data as Transfert;
}
