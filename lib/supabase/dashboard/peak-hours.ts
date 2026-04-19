import { cache } from 'react';
import { createClient } from '@/lib/supabase-server';

export type PeakHoursData = {
  hours: number[];
};

export const getPeakHours = cache(async (
  userId: string,
  storeIds: string[],
): Promise<PeakHoursData> => {
  const supabase = await createClient();

  let boutiqueIds = storeIds;
  if (!boutiqueIds.length) {
    const { data: boutiques } = await supabase
      .from('boutiques')
      .select('id')
      .eq('proprietaire_id', userId)
      .eq('actif', true);
    boutiqueIds = (boutiques ?? []).map((b) => b.id as string);
  }

  if (!boutiqueIds.length) return { hours: Array<number>(24).fill(0) };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data } = await supabase
    .from('transactions')
    .select('created_at')
    .in('boutique_id', boutiqueIds)
    .eq('statut', 'validee')
    .gte('created_at', today.toISOString());

  const hours = Array<number>(24).fill(0);
  for (const tx of data ?? []) {
    const h = new Date(tx.created_at as string).getHours();
    hours[h]++;
  }

  return { hours };
});
