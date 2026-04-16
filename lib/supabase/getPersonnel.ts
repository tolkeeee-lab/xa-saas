import { unstable_cache } from 'next/cache';
import { createClient } from '@/lib/supabase-server';
import type { Employe, Boutique } from '@/types/database';

export type EmployePersonnel = Employe & {
  boutique_nom: string;
  boutique_couleur: string;
  ca_mois: number;
};

export function getPersonnel(userId: string): Promise<EmployePersonnel[]> {
  return unstable_cache(
    async () => {
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
    },
    ['personnel', userId],
    { revalidate: 60, tags: [`personnel-${userId}`] },
  )();
}
