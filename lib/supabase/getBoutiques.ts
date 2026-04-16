import { cache } from 'react';
import { createClient } from '@/lib/supabase-server';
import type { Boutique } from '@/types/database';

export const getBoutiques = cache(async (userId: string): Promise<Boutique[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from('boutiques')
    .select('id, proprietaire_id, nom, ville, quartier, code_unique, pin_caisse, couleur_theme, actif, created_at, updated_at')
    .eq('proprietaire_id', userId)
    .eq('actif', true)
    .order('created_at', { ascending: true });
  return data ?? [];
});
