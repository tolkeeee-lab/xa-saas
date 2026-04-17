import { cache } from 'react';
import { createClient } from '@/lib/supabase-server';
import type { Employe, Boutique } from '@/types/database';

export type EmployePersonnel = Employe & {
  boutique_nom: string;
  boutique_couleur: string;
  ca_mois: number;
};

export const getPersonnel = cache(async (userId: string): Promise<EmployePersonnel[]> => {
  const supabase = await createClient();

  const { data: boutiques } = await supabase
    .from('boutiques')
    .select('id, nom, couleur_theme')
    .eq('proprietaire_id', userId)
    .eq('actif', true);

  if (!boutiques?.length) return [];

  const boutiqueIds = boutiques.map((b: Pick<Boutique, 'id' | 'nom' | 'couleur_theme'>) => b.id);
  const boutiqueMap = new Map(
    boutiques.map((b: Pick<Boutique, 'id' | 'nom' | 'couleur_theme'>) => [b.id, b]),
  );

  const { data: employes } = await supabase
    .from('employes')
    .select('id, boutique_id, proprietaire_id, nom, prenom, telephone, role, pin, actif, created_at, updated_at')
    .in('boutique_id', boutiqueIds)
    .order('nom', { ascending: true });

  if (!employes?.length) return [];

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const employeIds = employes.map((e) => e.id);

  // Single bulk query instead of one-per-employee (N+1 → O(1)) — C6
  const { data: txRows } = await supabase
    .from('transactions')
    .select('employe_id, montant_total')
    .in('employe_id', employeIds)
    .eq('statut', 'validee')
    .gte('created_at', startOfMonth.toISOString());

  const caParEmploye: Record<string, number> = {};
  for (const row of txRows ?? []) {
    if (row.employe_id) {
      caParEmploye[row.employe_id] = (caParEmploye[row.employe_id] ?? 0) + (row.montant_total ?? 0);
    }
  }

  return employes.map((emp) => {
    const boutique = boutiqueMap.get(emp.boutique_id);
    return {
      ...emp,
      boutique_nom: boutique?.nom ?? '',
      boutique_couleur: boutique?.couleur_theme ?? '#999',
      ca_mois: caParEmploye[emp.id] ?? 0,
    } as EmployePersonnel;
  });
});
