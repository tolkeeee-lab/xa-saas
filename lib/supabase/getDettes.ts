import { createClient } from '@/lib/supabase-server';
import type { Dette } from '@/types/database';

export type DetteAvecBoutique = Dette & {
  boutique_nom: string;
  boutique_couleur: string;
};

export type DettesData = {
  dettes: DetteAvecBoutique[];
  total_du: number;
  en_retard: number;
  recuperees_ce_mois: number;
};

export async function getDettes(userId: string): Promise<DettesData> {
  const supabase = await createClient();

  const { data: boutiques } = await supabase
    .from('boutiques')
    .select('id, nom, couleur_theme')
    .eq('proprietaire_id', userId)
    .eq('actif', true);

  if (!boutiques?.length) {
    return { dettes: [], total_du: 0, en_retard: 0, recuperees_ce_mois: 0 };
  }

  const boutiqueIds = boutiques.map((b) => b.id);
  const boutiqueMap = new Map(boutiques.map((b) => [b.id, b]));

  const { data: dettes } = await supabase
    .from('dettes')
    .select('*')
    .in('boutique_id', boutiqueIds)
    .order('created_at', { ascending: false });

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const dettesAvecBoutique: DetteAvecBoutique[] = (dettes ?? []).map((d) => {
    const b = boutiqueMap.get(d.boutique_id);
    return {
      ...d,
      boutique_nom: b?.nom ?? '',
      boutique_couleur: b?.couleur_theme ?? '#999',
    };
  });

  const total_du = dettesAvecBoutique
    .filter((d) => d.statut !== 'paye')
    .reduce((s, d) => s + (d.montant - d.montant_rembourse), 0);

  const en_retard = dettesAvecBoutique.filter((d) => d.statut === 'en_retard').length;

  const recuperees_ce_mois = dettesAvecBoutique
    .filter((d) => d.statut === 'paye' && d.created_at >= startOfMonth)
    .reduce((s, d) => s + d.montant, 0);

  return { dettes: dettesAvecBoutique, total_du, en_retard, recuperees_ce_mois };
}