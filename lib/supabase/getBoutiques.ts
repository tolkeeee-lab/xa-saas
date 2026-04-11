import { createClient } from '@/lib/supabase-server';
import type { Boutique } from '@/types/database';

export async function getBoutiques(userId: string): Promise<Boutique[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('boutiques')
    .select('*')
    .eq('proprietaire_id', userId)
    .eq('actif', true)
    .order('created_at', { ascending: true });
  return data ?? [];
}
