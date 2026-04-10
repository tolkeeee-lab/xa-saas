import { createClient } from '../supabase-browser';
import type { Boutique, BoutiqueInsert, BoutiqueUpdate } from '../../types/database';

export async function getBoutiques(proprietaireId: string): Promise<Boutique[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('boutiques')
    .select('*')
    .eq('proprietaire_id', proprietaireId)
    .eq('actif', true)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

export async function getBoutiqueById(id: string): Promise<Boutique | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('boutiques')
    .select('*')
    .eq('id', id)
    .single();
  if (error) return null;
  return data;
}

export async function createBoutique(payload: BoutiqueInsert): Promise<Boutique> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('boutiques')
    .insert(payload)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateBoutique(id: string, payload: BoutiqueUpdate): Promise<Boutique> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('boutiques')
    .update(payload)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteBoutique(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('boutiques')
    .update({ actif: false })
    .eq('id', id);
  if (error) throw new Error(error.message);
}
