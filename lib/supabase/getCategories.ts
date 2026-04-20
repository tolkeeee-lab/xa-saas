import { cache } from 'react';
import { createClient } from '@/lib/supabase-server';
import type { CategorieProduit } from '@/types/database';

export const getCategories = cache(async (userId: string): Promise<CategorieProduit[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from('categories_produits')
    .select('*')
    .eq('proprietaire_id', userId)
    .order('ordre', { ascending: true })
    .order('nom', { ascending: true });
  return data ?? [];
});
