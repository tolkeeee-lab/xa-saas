import { createClient } from '@/lib/supabase-server';
import type { DetteProprio } from '@/types/database';

export type DettesProprioData = {
  dettes: DetteProprio[];
  total_en_cours: number;
  total_rembourse: number;
  nb_en_retard: number;
};

export async function getDettesProprioData(userId: string): Promise<DettesProprioData> {
  const supabase = await createClient();

  const { data: dettes } = await supabase
    .from('dettes_proprio')
    .select('*')
    .eq('proprietaire_id', userId)
    .eq('actif', true)
    .order('created_at', { ascending: false });

  const allDettes: DetteProprio[] = (dettes ?? []) as DetteProprio[];

  const total_en_cours = allDettes
    .filter((d) => d.statut === 'en_cours' || d.statut === 'en_retard')
    .reduce((s, d) => s + (d.montant - d.montant_rembourse), 0);

  const total_rembourse = allDettes.reduce((s, d) => s + d.montant_rembourse, 0);
  const nb_en_retard = allDettes.filter((d) => d.statut === 'en_retard').length;

  return { dettes: allDettes, total_en_cours, total_rembourse, nb_en_retard };
}
