import { createClient } from '@/lib/supabase-server';
import type { Employe, Boutique } from '@/types/database';

export type EmployePersonnel = Employe & {
  boutique_nom: string;
  boutique_couleur: string;
  ca_mois: number;
};

export async function getPersonnel(userId: string): Promise<EmployePersonnel[]> {
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
    .select('*')
    .in('boutique_id', boutiqueIds)
    .order('nom', { ascending: true });

  if (!employes?.length) return [];

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const results = await Promise.all(
    employes.map(async (emp) => {
      const { data: txs } = await supabase
        .from('transactions')
        .select('montant_total')
        .eq('employe_id', emp.id)
        .eq('statut', 'validee')
        .gte('created_at', startOfMonth.toISOString());

      const ca_mois = txs?.reduce((s, t) => s + (t.montant_total ?? 0), 0) ?? 0;
      const boutique = boutiqueMap.get(emp.boutique_id);

      return {
        ...emp,
        boutique_nom: boutique?.nom ?? '',
        boutique_couleur: boutique?.couleur_theme ?? '#999',
        ca_mois,
      } as EmployePersonnel;
    }),
  );

  return results;
}
