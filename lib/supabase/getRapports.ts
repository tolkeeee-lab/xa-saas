import { cache } from 'react';
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

export type JourStat = {
  date: string; // "2026-04-01"
  ca: number;
  transactions: number;
};

export type RapportsPeriodeData = {
  ca_total: number;
  benefice_net: number;
  cout_achats: number;
  marge_nette: number;
  boutiques: BoutiqueRapport[];
  historiqueJournalier: JourStat[];
};

const MOIS_LABELS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

export const getRapports = cache(async (userId: string): Promise<RapportsData> => {
  const supabase = await createClient();

  const { data: boutiques } = await supabase
    .from('boutiques')
    .select('id, proprietaire_id, nom, ville, quartier, code_unique, pin_caisse, couleur_theme, actif, created_at, updated_at')
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
});

export const getRapportsPeriode = cache(async (
  userId: string,
  dateDebut: string,
  dateFin: string,
): Promise<RapportsPeriodeData> => {
  const supabase = await createClient();

  const { data: boutiques } = await supabase
    .from('boutiques')
    .select('id, proprietaire_id, nom, ville, quartier, code_unique, pin_caisse, couleur_theme, actif, created_at, updated_at')
    .eq('proprietaire_id', userId)
    .eq('actif', true);

  if (!boutiques?.length) {
    return {
      ca_total: 0,
      benefice_net: 0,
      cout_achats: 0,
      marge_nette: 0,
      boutiques: [],
      historiqueJournalier: [],
    };
  }

  const boutiqueIds = boutiques.map((b) => b.id);

  // ISO boundaries: dateDebut at 00:00:00 UTC, dateFin end-of-day
  const startISO = `${dateDebut}T00:00:00.000Z`;
  const endISO = `${dateFin}T23:59:59.999Z`;

  // Fetch all validated transactions in range
  const { data: txs } = await supabase
    .from('transactions')
    .select('boutique_id, montant_total, benefice_total, created_at')
    .in('boutique_id', boutiqueIds)
    .eq('statut', 'validee')
    .gte('created_at', startISO)
    .lte('created_at', endISO);

  // Per-boutique stats for the period
  const boutiqueRapports: BoutiqueRapport[] = boutiques.map((b) => {
    const btxs = (txs ?? []).filter((t) => t.boutique_id === b.id);
    const ca = btxs.reduce((s, t) => s + (t.montant_total ?? 0), 0);
    const benefice = btxs.reduce((s, t) => s + (t.benefice_total ?? 0), 0);
    const cout_achat = ca - benefice;
    const marge_brute = benefice;
    const charges = Math.round(marge_brute * 0.25);
    const benefice_net = marge_brute - charges;
    return { ...b, ca, cout_achat, marge_brute, charges, benefice_net, evolution: 0 };
  });

  // Aggregate totals
  const ca_total = boutiqueRapports.reduce((s, b) => s + b.ca, 0);
  const benefice_net = boutiqueRapports.reduce((s, b) => s + b.benefice_net, 0);
  const cout_achats = boutiqueRapports.reduce((s, b) => s + b.cout_achat, 0);
  const marge_nette = ca_total > 0 ? Math.round((benefice_net / ca_total) * 100) : 0;

  // Build daily history (one entry per calendar day in range, even if 0)
  const historiqueJournalier: JourStat[] = [];
  const cursor = new Date(`${dateDebut}T00:00:00.000Z`);
  const end = new Date(`${dateFin}T00:00:00.000Z`);

  while (cursor <= end) {
    const dateStr = cursor.toISOString().slice(0, 10);
    const dayTxs = (txs ?? []).filter((t) => {
      if (!t.created_at) return false;
      return t.created_at.slice(0, 10) === dateStr;
    });
    historiqueJournalier.push({
      date: dateStr,
      ca: dayTxs.reduce((s, t) => s + (t.montant_total ?? 0), 0),
      transactions: dayTxs.length,
    });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  // Sort descending (most recent first)
  historiqueJournalier.sort((a, b) => b.date.localeCompare(a.date));

  return { ca_total, benefice_net, cout_achats, marge_nette, boutiques: boutiqueRapports, historiqueJournalier };
});
