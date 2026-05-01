import { redirect } from 'next/navigation';
import {
  getEmployeSession,
  shouldRefreshCookie,
  setEmployeCookie,
  createEmployeSession,
} from '@/lib/employe-session-server';
import { createAdminClient } from '@/lib/supabase-admin';
import VenteView from '@/features/employe/vente/VenteView';
import type { Transaction, TopProduit } from '@/features/employe/vente/types';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Vente — xà' };

export default async function EmployeVentePage() {
  const session = await getEmployeSession();

  if (!session) {
    redirect('/login');
  }

  // Rolling 30-day session refresh
  if (shouldRefreshCookie(session.expires_at)) {
    await setEmployeCookie(
      createEmployeSession(session.employe_id, session.boutique_id, session.role),
    );
  }

  const supabase = createAdminClient();

  const now = new Date();
  const today = now.toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
  const tomorrow = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1),
  )
    .toISOString()
    .slice(0, 10);

  const since30j = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 29),
  )
    .toISOString()
    .slice(0, 10);

  // ── Step 1 : fetch employe, boutique, tx headers du jour, dettes (parallel) ──
  const [
    { data: employe },
    { data: boutique },
    { data: txJourHeaders },
    { data: dettes },
  ] = await Promise.all([
    supabase
      .from('employes')
      .select('id, nom, prenom, role, actif')
      .eq('id', session.employe_id)
      .single(),
    supabase
      .from('boutiques')
      .select('id, nom, ville, couleur_theme')
      .eq('id', session.boutique_id)
      .single(),
    // Transactions du jour — sans lignes pour éviter SelectQueryError
    supabase
      .from('transactions')
      .select('id, created_at, montant_total, benefice_total, mode_paiement, client_nom, employe_id, statut')
      .eq('boutique_id', session.boutique_id)
      .eq('statut', 'validee')
      .gte('created_at', today + 'T00:00:00.000Z')
      .lt('created_at', tomorrow + 'T00:00:00.000Z')
      .order('created_at', { ascending: false }),
    // Dettes crédit
    supabase
      .from('transactions')
      .select('id, montant_total, montant_recu')
      .eq('boutique_id', session.boutique_id)
      .eq('mode_paiement', 'credit')
      .eq('statut', 'validee'),
  ]);

  if (!employe || !employe.actif) {
    redirect('/login');
  }

  // ── Step 2 : fetch lignes du jour + lignes 30j (parallel) ──────────────────
  const txJourIds = (txJourHeaders ?? []).map((t) => t.id);

  const { data: txIds30jRaw } = await supabase
    .from('transactions')
    .select('id')
    .eq('boutique_id', session.boutique_id)
    .eq('statut', 'validee')
    .gte('created_at', since30j + 'T00:00:00.000Z')
    .lt('created_at', tomorrow + 'T00:00:00.000Z');

  const all30jIds = (txIds30jRaw ?? []).map((t) => t.id);

  const [{ data: lignesJour }, { data: lignes30j }] = await Promise.all([
    txJourIds.length > 0
      ? supabase
          .from('transaction_lignes')
          .select('transaction_id, produit_id, nom_produit, quantite, prix_vente_unitaire, sous_total')
          .in('transaction_id', txJourIds)
      : Promise.resolve({ data: [] }),
    all30jIds.length > 0
      ? supabase
          .from('transaction_lignes')
          .select('transaction_id, produit_id, nom_produit, quantite, sous_total')
          .in('transaction_id', all30jIds)
      : Promise.resolve({ data: [] }),
  ]);

  // ── Step 3 : assemble Transaction[] pour le jour ──────────────────────────
  const lignesJourByTx = new Map<string, typeof lignesJour>();
  for (const l of lignesJour ?? []) {
    const txId = (l as { transaction_id: string }).transaction_id;
    if (!lignesJourByTx.has(txId)) lignesJourByTx.set(txId, []);
    lignesJourByTx.get(txId)!.push(l);
  }

  const txJour: Transaction[] = (txJourHeaders ?? []).map((t) => ({
    id: t.id,
    created_at: t.created_at,
    montant_total: t.montant_total ?? 0,
    benefice_total: t.benefice_total ?? 0,
    mode_paiement: t.mode_paiement,
    client_nom: t.client_nom ?? null,
    employe_id: t.employe_id ?? null,
    statut: t.statut,
    lignes: (lignesJourByTx.get(t.id) ?? []).map((l) => ({
      produit_id: (l as { produit_id: string | null }).produit_id ?? null,
      nom_produit: (l as { nom_produit: string }).nom_produit,
      quantite: (l as { quantite: number | null }).quantite ?? 0,
      prix_vente_unitaire: (l as { prix_vente_unitaire: number | null }).prix_vente_unitaire ?? 0,
      sous_total: (l as { sous_total: number | null }).sous_total ?? 0,
    })),
  }));

  // ── Step 4 : agrégation top produits 30j ─────────────────────────────────
  const agg = new Map<string, { produit_id: string | null; total_qte: number; total_rev: number }>();
  for (const l of lignes30j ?? []) {
    const row = l as {
      nom_produit: string;
      produit_id: string | null;
      quantite: number | null;
      sous_total: number | null;
    };
    const existing = agg.get(row.nom_produit);
    if (existing) {
      existing.total_qte += row.quantite ?? 0;
      existing.total_rev += row.sous_total ?? 0;
    } else {
      agg.set(row.nom_produit, {
        produit_id: row.produit_id ?? null,
        total_qte: row.quantite ?? 0,
        total_rev: row.sous_total ?? 0,
      });
    }
  }

  const topProduits: TopProduit[] = Array.from(agg.entries())
    .map(([nom_produit, v]) => ({ nom_produit, ...v }))
    .sort((a, b) => b.total_rev - a.total_rev)
    .slice(0, 5);

  // ── KPIs ─────────────────────────────────────────────────────────────────
  const caJour = txJour
    .filter((t) => t.mode_paiement !== 'credit')
    .reduce((s, t) => s + t.montant_total, 0);

  const totalDettes = (dettes ?? []).reduce(
    (s, t) => s + Math.max(0, (t.montant_total ?? 0) - (t.montant_recu ?? 0)),
    0,
  );

  const nbDettes = (dettes ?? []).filter(
    (t) => (t.montant_total ?? 0) - (t.montant_recu ?? 0) > 0,
  ).length;

  const kpi = {
    ca_jour: caJour,
    nb_ventes_jour: txJour.length,
    total_dettes: totalDettes,
    ca_mois: 0,
  };

  return (
    <VenteView
      kpi={kpi}
      boutique={
        boutique ?? {
          id: session.boutique_id,
          nom: 'Boutique',
          ville: null,
          couleur_theme: null,
        }
      }
      employe={employe}
      nbDettes={nbDettes}
      txJour={txJour}
      topProduits={topProduits}
    />
  );
}
