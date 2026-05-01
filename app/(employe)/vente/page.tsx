import { redirect } from 'next/navigation';
import {
  getEmployeSession,
  shouldRefreshCookie,
  setEmployeCookie,
  createEmployeSession,
} from '@/lib/employe-session-server';
import { createAdminClient } from '@/lib/supabase-admin';
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

  const [{ data: employe }, { data: boutique }] = await Promise.all([
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
  ]);

  if (!employe || !employe.actif) {
    redirect('/login');
  }

  return (
    <main>
      {/* TODO: intégrer VenteView — voir mockup/caisse-v4.html */}
    </main>
  );
}
