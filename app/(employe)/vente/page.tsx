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

// ─── Raw Supabase row types (inline for page use only) ────────────────────────
type RawTxLigne = {
  produit_id: string | null;
  nom_produit: string;
  quantite: number | null;
  prix_vente_unitaire: number | null;
  sous_total: number | null;
};
type RawTx = {
  id: string;
  created_at: string;
  montant_total: number | null;
  benefice_total: number | null;
  mode_paiement: string;
  client_nom: string | null;
  employe_id: string | null;
  statut: string;
  transaction_lignes: RawTxLigne[] | null;
};

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
  const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1))
    .toISOString()
    .slice(0, 10);

  // 30j window for top produits
  const since30j = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 29))
    .toISOString()
    .slice(0, 10);

  // Fetch employe, boutique, today's transactions (with lignes), and credit dettes in parallel
  const [
    { data: employe },
    { data: boutique },
    { data: txJourRaw },
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
    supabase
      .from('transactions')
      .select(
        'id, created_at, montant_total, benefice_total, mode_paiement, client_nom, employe_id, statut, transaction_lignes(produit_id, nom_produit, quantite, prix_vente_unitaire, sous_total)',
      )
      .eq('boutique_id', session.boutique_id)
      .eq('statut', 'validee')
      .gte('created_at', today + 'T00:00:00.000Z')
      .lte('created_at', today + 'T23:59:59.999Z')
      .order('created_at', { ascending: false }),
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

  // --- Top produits (30 jours) ---
  // Step 1: get tx IDs from last 30 days
  const { data: txIds30j } = await supabase
    .from('transactions')
    .select('id')
    .eq('boutique_id', session.boutique_id)
    .eq('statut', 'validee')
    .gte('created_at', since30j + 'T00:00:00.000Z')
    .lte('created_at', today + 'T23:59:59.999Z');

  let topProduits: TopProduit[] = [];

  if (txIds30j && txIds30j.length > 0) {
    const ids = (txIds30j as Array<{ id: string }>).map((t) => t.id);
    const { data: lignes30j } = await supabase
      .from('transaction_lignes')
      .select('produit_id, nom_produit, quantite, sous_total')
      .in('transaction_id', ids);

    // Aggregate by nom_produit
    const agg = new Map<string, { produit_id: string | null; total_qte: number; total_rev: number }>();
    for (const l of lignes30j ?? []) {
      const key = l.nom_produit;
      const existing = agg.get(key);
      if (existing) {
        existing.total_qte += l.quantite ?? 0;
        existing.total_rev += l.sous_total ?? 0;
      } else {
        agg.set(key, {
          produit_id: l.produit_id ?? null,
          total_qte: l.quantite ?? 0,
          total_rev: l.sous_total ?? 0,
        });
      }
    }

    topProduits = Array.from(agg.entries())
      .map(([nom_produit, v]) => ({ nom_produit, ...v }))
      .sort((a, b) => b.total_rev - a.total_rev)
      .slice(0, 5);
  }

  // --- Map raw Supabase data to TypeScript types ---
  const txJour: Transaction[] = ((txJourRaw ?? []) as RawTx[]).map((t) => ({
    id: t.id,
    created_at: t.created_at,
    montant_total: t.montant_total ?? 0,
    benefice_total: t.benefice_total ?? 0,
    mode_paiement: t.mode_paiement,
    client_nom: t.client_nom ?? null,
    employe_id: t.employe_id ?? null,
    statut: t.statut,
    lignes: (t.transaction_lignes ?? []).map((l) => ({
      produit_id: l.produit_id ?? null,
      nom_produit: l.nom_produit,
      quantite: l.quantite ?? 0,
      prix_vente_unitaire: l.prix_vente_unitaire ?? 0,
      sous_total: l.sous_total ?? 0,
    })),
  }));

  // --- KPIs ---
  const caJour = txJour
    .filter((t) => t.mode_paiement !== 'credit')
    .reduce((s, t) => s + t.montant_total, 0);

  const nbVentesJour = txJour.length;

  const totalDettes = (dettes ?? []).reduce(
    (s, t) => s + Math.max(0, (t.montant_total ?? 0) - (t.montant_recu ?? 0)),
    0,
  );

  const nbDettes = (dettes ?? []).filter(
    (t) => (t.montant_total ?? 0) - (t.montant_recu ?? 0) > 0,
  ).length;

  const kpi = {
    ca_jour: caJour,
    nb_ventes_jour: nbVentesJour,
    total_dettes: totalDettes,
    ca_mois: 0,
  };

  return (
    <VenteView
      kpi={kpi}
      boutique={boutique ?? { id: session.boutique_id, nom: 'Boutique', ville: null, couleur_theme: null }}
      employe={employe}
      nbDettes={nbDettes}
      txJour={txJour}
      topProduits={topProduits}
    />
  );
}

