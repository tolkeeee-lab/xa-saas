import { unstable_cache } from 'next/cache';
import { createClient } from '@/lib/supabase-server';
import type { Boutique } from '@/types/database';

export function getBoutiques(userId: string): Promise<Boutique[]> {
  return unstable_cache(
    async () => {
      const supabase = await createClient();
      const { data } = await supabase
        .from('boutiques')
        .select('id, proprietaire_id, nom, ville, quartier, code_unique, pin_caisse, couleur_theme, actif, created_at, updated_at')
        .eq('proprietaire_id', userId)
        .eq('actif', true)
        .order('created_at', { ascending: true });
      return data ?? [];
    },
    ['boutiques', userId],
    { revalidate: 60, tags: [`boutiques-${userId}`] },
  )();
}
