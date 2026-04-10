/**
 * lib/api/clients.ts
 * CRUD Supabase pour les clients débiteurs.
 */

import { supabase } from '../supabase';
import type {
  ClientDebiteur,
  ClientDebiteurInsert,
  ClientDebiteurUpdate,
} from '../../types/database';

export async function getClients(boutiqueId: string): Promise<ClientDebiteur[]> {
  const { data, error } = await supabase
    .from('clients_debiteurs')
    .select('*')
    .eq('boutique_id', boutiqueId)
    .eq('actif', true)
    .order('nom', { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getClientById(id: string): Promise<ClientDebiteur | null> {
  const { data, error } = await supabase
    .from('clients_debiteurs')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data;
}

export async function createClient(payload: ClientDebiteurInsert): Promise<ClientDebiteur> {
  const { data, error } = await supabase
    .from('clients_debiteurs')
    .insert(payload)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateClient(
  id: string,
  payload: ClientDebiteurUpdate
): Promise<ClientDebiteur> {
  const { data, error } = await supabase
    .from('clients_debiteurs')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}
