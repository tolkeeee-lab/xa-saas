import { redirect } from 'next/navigation';
import {
  getEmployeSession,
  shouldRefreshCookie,
  setEmployeCookie,
  createEmployeSession,
} from '@/lib/employe-session-server';
import { createAdminClient } from '@/lib/supabase-admin';
import VenteView from '@/features/employe/vente/VenteView';
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

  // Fetch employe + boutique + KPIs en parallèle
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const [
    { data: employe },
    { data: boutique },
    { data: txJour },
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
    // Transactions du jour (validées, non-credit)
    supabase
      .from('transactions')
      .select('id, montant_total, mode_paiement')
      .eq('boutique_id', session.boutique_id)
      .eq('statut', 'validee')
      .gte('created_at', today + 'T00:00:00.000Z')
      .lt('created_at', today + 'T23:59:59.999Z'),
    // Dettes : transactions credit non soldées
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

  // Calculer KPIs
  const caJour = (txJour ?? [])
    .filter((t) => t.mode_paiement !== 'credit')
    .reduce((s, t) => s + (t.montant_total ?? 0), 0);

  const nbVentesJour = (txJour ?? []).length;

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
    ca_mois: 0, // sera calculé en PR 2
  };

  return (
    <VenteView
      kpi={kpi}
      boutique={boutique ?? { id: session.boutique_id, nom: 'Boutique', ville: null, couleur_theme: null }}
      employe={employe}
      nbDettes={nbDettes}
    />
  );
}
