import { createClient } from '@/lib/supabase-server';
import type { Boutique } from '@/types/database';

export type BoutiqueComparatif = Boutique & {
  ca: number;
  benefice: number;
  nbTx: number;
  panierMoyen: number;
  marge: number;
};

export type RuptureItem = {
  boutique_nom: string;
  boutique_couleur: string;
  produit_nom: string;
  stock_actuel: number;
};

export type ComparatifData = {
  boutiques: BoutiqueComparatif[];
  ruptures: RuptureItem[];
};

export async function getComparatif(userId: string): Promise<ComparatifData> {
  const supabase = await createClient();

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data: boutiques } = await supabase
    .from('boutiques')
    .select('*')
    .eq('proprietaire_id', userId)
    .eq('actif', true);

  if (!boutiques?.length) return { boutiques: [], ruptures: [] };

  const boutiqueIds = boutiques.map((b) => b.id);

  const boutiqueResults = await Promise.all(
    boutiques.map(async (b) => {
      const { data: txs } = await supabase
        .from('transactions')
        .select('montant_total, benefice_total')
        .eq('boutique_id', b.id)
        .eq('statut', 'validee')
        .gte('created_at', startOfMonth.toISOString());

      const ca = txs?.reduce((s, t) => s + (t.montant_total ?? 0), 0) ?? 0;
      const benefice = txs?.reduce((s, t) => s + (t.benefice_total ?? 0), 0) ?? 0;
      const nbTx = txs?.length ?? 0;
      const panierMoyen = nbTx > 0 ? Math.round(ca / nbTx) : 0;
      const marge = ca > 0 ? Math.round((benefice / ca) * 100) : 0;

      return { ...b, ca, benefice, nbTx, panierMoyen, marge } as BoutiqueComparatif;
    }),
  );

  const sortedBoutiques = boutiqueResults.sort((a, b) => b.ca - a.ca);

  // Fetch ruptures (stock_actuel <= 0)
  const { data: prodRuptures } = await supabase
    .from('produits')
    .select('nom, boutique_id, stock_actuel')
    .in('boutique_id', boutiqueIds)
    .lte('stock_actuel', 0)
    .eq('actif', true)
    .order('nom', { ascending: true });

  const boutiqueMap = new Map(boutiques.map((b) => [b.id, b]));

  const ruptures: RuptureItem[] = (prodRuptures ?? []).map((p) => {
    const b = boutiqueMap.get(p.boutique_id);
    return {
      boutique_nom: b?.nom ?? '',
      boutique_couleur: b?.couleur_theme ?? '#999',
      produit_nom: p.nom,
      stock_actuel: p.stock_actuel,
    };
  });

  return { boutiques: sortedBoutiques, ruptures };
}
