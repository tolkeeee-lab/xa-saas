import { createClient } from '../supabase-browser';
import type { Employe, EmployeInsert, EmployeUpdate } from '../../types/database';

export async function getEmployes(boutiqueId: string): Promise<Employe[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('employes')
    .select('*')
    .eq('boutique_id', boutiqueId)
    .eq('actif', true)
    .order('nom', { ascending: true });
  if (error) throw new Error(error.message);
  return data;
}

export async function getEmployeById(id: string): Promise<Employe | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('employes')
    .select('*')
    .eq('id', id)
    .single();
  if (error) return null;
  return data;
}

export async function createEmploye(payload: EmployeInsert): Promise<Employe> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('employes')
    .insert(payload)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateEmploye(id: string, payload: EmployeUpdate): Promise<Employe> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('employes')
    .update(payload)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteEmploye(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('employes')
    .update({ actif: false })
    .eq('id', id);
  if (error) throw new Error(error.message);
}
