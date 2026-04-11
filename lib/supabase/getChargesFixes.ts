import { createClient } from '@/lib/supabase-server';
import type { ChargeFixe } from '@/types/database';

export type { ChargeFixe };

export type ChargesFixesData = {
  charges: ChargeFixe[];
  total_mensuel: number;
  par_categorie: Record<string, number>;
  ca_mois: number;
  cout_achats_mois: number;
  benefice_brut: number;
  benefice_net_reel: number;
  reste_proprio: number;
};

/**
 * Normalise a charge amount to its monthly equivalent.
 */
function toMensuel(montant: number, periodicite: ChargeFixe['periodicite']): number {
  if (periodicite === 'hebdo') return montant * (52 / 12);
  if (periodicite === 'annuel') return montant / 12;
  return montant;
}

export async function getChargesFixes(userId: string): Promise<ChargesFixesData> {
  const supabase = await createClient();

  // Fetch all charges (including inactive) for management display
  const { data: charges } = await supabase
    .from('charges_fixes')
    .select('*')
    .eq('proprietaire_id', userId)
    .order('created_at', { ascending: false });

  const allCharges: ChargeFixe[] = (charges ?? []) as ChargeFixe[];
  const activeCharges = allCharges.filter((c) => c.actif);

  // Total mensuel normalisé
  const total_mensuel = activeCharges.reduce(
    (s, c) => s + toMensuel(c.montant, c.periodicite),
    0,
  );

  // Par catégorie
  const par_categorie: Record<string, number> = {};
  for (const c of activeCharges) {
    const cat = c.categorie;
    par_categorie[cat] = (par_categorie[cat] ?? 0) + toMensuel(c.montant, c.periodicite);
  }

  // CA + coût achats du mois courant
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  // Fetch boutiques owned by user
  const { data: boutiques } = await supabase
    .from('boutiques')
    .select('id')
    .eq('proprietaire_id', userId)
    .eq('actif', true);

  const boutiqueIds = (boutiques ?? []).map((b) => b.id);

  let ca_mois = 0;
  let cout_achats_mois = 0;

  if (boutiqueIds.length > 0) {
    const { data: txs } = await supabase
      .from('transactions')
      .select('montant_total, benefice_total')
      .in('boutique_id', boutiqueIds)
      .eq('statut', 'validee')
      .gte('created_at', startOfMonth.toISOString());

    ca_mois = txs?.reduce((s, t) => s + (t.montant_total ?? 0), 0) ?? 0;
    const benefice_total_mois = txs?.reduce((s, t) => s + (t.benefice_total ?? 0), 0) ?? 0;
    cout_achats_mois = ca_mois - benefice_total_mois;
  }

  const benefice_brut = ca_mois - cout_achats_mois;
  const benefice_net_reel = benefice_brut - total_mensuel;
  const reste_proprio = benefice_net_reel;

  return {
    charges: allCharges,
    total_mensuel,
    par_categorie,
    ca_mois,
    cout_achats_mois,
    benefice_brut,
    benefice_net_reel,
    reste_proprio,
  };
}
