import { createClient } from '@/lib/supabase-server';
import type { Boutique } from '@/types/database';

export type MoisStat = {
  mois: string; // e.g. "Jan", "Fév", ...
  ca: number;
};

export type BoutiqueRapport = Boutique & {
  ca: number;
  cout_achat: number;
  marge_brute: number;
  charges: number;
  benefice_net: number;
  evolution: number; // % vs previous month
};

export type RapportsData = {
  moisStats: MoisStat[];
  boutiques: BoutiqueRapport[];
  ca_mois: number;
  benefice_net: number;
  cout_achats: number;
  marge_nette: number;
};

const MOIS_LABELS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

export async function getRapports(userId: string): Promise<RapportsData> {
  const supabase = await createClient();

  const { data: boutiques } = await supabase
    .from('boutiques')
    .select('*')
    .eq('proprietaire_id', userId)
    .eq('actif', true);

  if (!boutiques?.length) {
    return {
      moisStats: [],
      boutiques: [],
      ca_mois: 0,
      benefice_net: 0,
      cout_achats: 0,
      marge_nette: 0,
    };
  }

  const boutiqueIds = boutiques.map((b) => b.id);

  // Build 6-month stats
  const now = new Date();
  const moisStats: MoisStat[] = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const start = new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString();

    const { data: txs } = await supabase
      .from('transactions')
      .select('montant_total')
      .in('boutique_id', boutiqueIds)
      .eq('statut', 'validee')
      .gte('created_at', start)
      .lt('created_at', end);

    const ca = txs?.reduce((s, t) => s + (t.montant_total ?? 0), 0) ?? 0;
    moisStats.push({ mois: MOIS_LABELS[d.getMonth()], ca });
  }

  // Current month stats per boutique
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

  const boutiqueRapports: BoutiqueRapport[] = await Promise.all(
    boutiques.map(async (b) => {
      const [{ data: txsCurrent }, { data: txsPrev }] = await Promise.all([
        supabase
          .from('transactions')
          .select('montant_total, benefice_total')
          .eq('boutique_id', b.id)
          .eq('statut', 'validee')
          .gte('created_at', startOfMonth),
        supabase
          .from('transactions')
          .select('montant_total')
          .eq('boutique_id', b.id)
          .eq('statut', 'validee')
          .gte('created_at', startOfPrevMonth)
          .lt('created_at', startOfMonth),
      ]);

      const ca = txsCurrent?.reduce((s, t) => s + (t.montant_total ?? 0), 0) ?? 0;
      const benefice = txsCurrent?.reduce((s, t) => s + (t.benefice_total ?? 0), 0) ?? 0;
      const cout_achat = ca - benefice;
      const marge_brute = benefice;
      const charges = Math.round(marge_brute * 0.25);
      const benefice_net = marge_brute - charges;

      const ca_prev = txsPrev?.reduce((s, t) => s + (t.montant_total ?? 0), 0) ?? 0;
      const evolution = ca_prev > 0 ? Math.round(((ca - ca_prev) / ca_prev) * 100) : 0;

      return { ...b, ca, cout_achat, marge_brute, charges, benefice_net, evolution };
    }),
  );

  const ca_mois = boutiqueRapports.reduce((s, b) => s + b.ca, 0);
  const benefice_net = boutiqueRapports.reduce((s, b) => s + b.benefice_net, 0);
  const cout_achats = boutiqueRapports.reduce((s, b) => s + b.cout_achat, 0);
  const marge_nette = ca_mois > 0 ? Math.round((benefice_net / ca_mois) * 100) : 0;

  return { moisStats, boutiques: boutiqueRapports, ca_mois, benefice_net, cout_achats, marge_nette };
}
