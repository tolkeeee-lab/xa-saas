/**
 * lib/api/employes.ts
 * CRUD Supabase pour les employés.
 */

import { supabase } from '../supabase';
import type { Employe, EmployeInsert, EmployeUpdate } from '../../types/database';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export async function getEmployes(boutiqueId: string): Promise<Employe[]> {
  const { data, error } = await db
    .from('employes')
    .select('*')
    .eq('boutique_id', boutiqueId)
    .eq('actif', true)
    .order('nom', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as Employe[];
}

export async function getEmployeById(id: string): Promise<Employe | null> {
  const { data, error } = await db
    .from('employes')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data as Employe;
}

export async function createEmploye(payload: EmployeInsert): Promise<Employe> {
  const { data, error } = await db
    .from('employes')
    .insert(payload)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Employe;
}

export async function updateEmploye(id: string, payload: EmployeUpdate): Promise<Employe> {
  const { data, error } = await db
    .from('employes')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Employe;
}

export async function deleteEmploye(id: string): Promise<void> {
  const { error } = await db
    .from('employes')
    .update({ actif: false })
    .eq('id', id);

  if (error) throw new Error(error.message);
}