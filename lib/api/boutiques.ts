/**
 * lib/api/boutiques.ts
 * CRUD Supabase pour les boutiques.
 */

import { supabase } from '../supabase';
import type { Boutique, BoutiqueInsert, BoutiqueUpdate } from '../../types/database';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export async function getBoutiques(proprietaireId: string): Promise<Boutique[]> {
  const { data, error } = await db
    .from('boutiques')
    .select('*')
    .eq('proprietaire_id', proprietaireId)
    .eq('actif', true)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Boutique[];
}

export async function getBoutiqueById(id: string): Promise<Boutique | null> {
  const { data, error } = await db
    .from('boutiques')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data as Boutique;
}

export async function createBoutique(payload: BoutiqueInsert): Promise<Boutique> {
  const { data, error } = await db
    .from('boutiques')
    .insert(payload)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Boutique;
}

export async function updateBoutique(id: string, payload: BoutiqueUpdate): Promise<Boutique> {
  const { data, error } = await db
    .from('boutiques')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Boutique;
}

export async function deleteBoutique(id: string): Promise<void> {
  const { error } = await db
    .from('boutiques')
    .update({ actif: false })
    .eq('id', id);

  if (error) throw new Error(error.message);
}