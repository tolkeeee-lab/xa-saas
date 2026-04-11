import { createClient } from '@/lib/supabase-server';
import type { Boutique } from '@/types/database';

export type BoutiqueComparatif = Boutique & {
  ca: number;
  benefice: number;
  cout_achats: number;
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
  boutiquesLastPeriod: BoutiqueComparatif[];
  ruptures: RuptureItem[];
};

export type ComparatifPeriode = 'ce_mois' | 'mois_precedent' | '3_mois';

function getPeriodRange(periode: ComparatifPeriode): { from: Date; to: Date } {
  const now = new Date();
  if (periode === 'ce_mois') {
    return {
      from: new Date(now.getFullYear(), now.getMonth(), 1),
      to: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
    };
  }
  if (periode === 'mois_precedent') {
    return {
      from: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      to: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999),
    };
  }
  // 3 months
  return {
    from: new Date(now.getFullYear(), now.getMonth() - 2, 1),
    to: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
  };
}

async function computeBoutiqueStats(
  supabase: Awaited<ReturnType<typeof createClient>>,
  boutiques: Boutique[],
  from: Date,
  to: Date,
): Promise<BoutiqueComparatif[]> {
  const results = await Promise.all(
    boutiques.map(async (b) => {
      const { data: txs } = await supabase
        .from('transactions')
        .select('montant_total, benefice_total')
        .eq('boutique_id', b.id)
        .eq('statut', 'validee')
        .gte('created_at', from.toISOString())
        .lte('created_at', to.toISOString());

      const ca = txs?.reduce((s, t) => s + (t.montant_total ?? 0), 0) ?? 0;
      const benefice = txs?.reduce((s, t) => s + (t.benefice_total ?? 0), 0) ?? 0;
      const nbTx = txs?.length ?? 0;
      const panierMoyen = nbTx > 0 ? Math.round(ca / nbTx) : 0;
      const marge = ca > 0 ? Math.round((benefice / ca) * 100) : 0;

      return {
        ...b,
        ca,
        benefice,
        cout_achats: ca - benefice,
        nbTx,
        panierMoyen,
        marge,
      } as BoutiqueComparatif;
    }),
  );

  return results.sort((a, b) => b.ca - a.ca);
}

export async function getComparatif(
  userId: string,
  periode: ComparatifPeriode = 'ce_mois',
): Promise<ComparatifData> {
  const supabase = await createClient();

  const { data: boutiques } = await supabase
    .from('boutiques')
    .select('*')
    .eq('proprietaire_id', userId)
    .eq('actif', true);

  if (!boutiques?.length) return { boutiques: [], boutiquesLastPeriod: [], ruptures: [] };

  const boutiqueIds = boutiques.map((b) => b.id);

  const { from, to } = getPeriodRange(periode);

  // Previous period range (same duration, one period back)
  const durationMs = to.getTime() - from.getTime();
  const prevTo = new Date(from.getTime() - 1);
  const prevFrom = new Date(prevTo.getTime() - durationMs);

  const [sortedBoutiques, boutiquesLastPeriod] = await Promise.all([
    computeBoutiqueStats(supabase, boutiques, from, to),
    computeBoutiqueStats(supabase, boutiques, prevFrom, prevTo),
  ]);

  // Fetch ruptures (stock_actuel <= 0)
  const { data: prodRuptures } = await supabase
    .from('produits')
    .select('nom, boutique_id, stock_actuel')
    .in('boutique_id', boutiqueIds)
    .lte('stock_actuel', 0)
    .eq('actif', true)
    .order('nom', { ascending: true });

  const boutiqueMap = new Map((boutiques as Boutique[]).map((b) => [b.id, b]));

  const ruptures: RuptureItem[] = (prodRuptures ?? []).map((p) => {
    const b = boutiqueMap.get(p.boutique_id);
    return {
      boutique_nom: b?.nom ?? '',
      boutique_couleur: b?.couleur_theme ?? '#999',
      produit_nom: p.nom,
      stock_actuel: p.stock_actuel,
    };
  });

  return { boutiques: sortedBoutiques, boutiquesLastPeriod, ruptures };
}
