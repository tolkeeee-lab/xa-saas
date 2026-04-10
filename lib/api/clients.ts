import { createClient } from '../supabase-browser';
import type { ClientDebiteur, ClientDebiteurInsert, ClientDebiteurUpdate } from '../../types/database';

export async function getClients(boutiqueId: string): Promise<ClientDebiteur[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('clients_debiteurs')
    .select('*')
    .eq('boutique_id', boutiqueId)
    .eq('actif', true)
    .order('nom', { ascending: true });
  if (error) throw new Error(error.message);
  return data;
}

export async function getClientById(id: string): Promise<ClientDebiteur | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('clients_debiteurs')
    .select('*')
    .eq('id', id)
    .single();
  if (error) return null;
  return data;
}

export async function createClientDebiteur(payload: ClientDebiteurInsert): Promise<ClientDebiteur> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('clients_debiteurs')
    .insert(payload)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateClient(id: string, payload: ClientDebiteurUpdate): Promise<ClientDebiteur> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('clients_debiteurs')
    .update(payload)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteClient(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('clients_debiteurs')
    .update({ actif: false })
    .eq('id', id);
  if (error) throw new Error(error.message);
}
