import { redirect } from 'next/navigation';
import {
  getEmployeSession,
  shouldRefreshCookie,
  setEmployeCookie,
  createEmployeSession,
} from '@/lib/employe-session-server';
import { createAdminClient } from '@/lib/supabase-admin';
import LogoutButton from '@/features/employe/LogoutButton';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Caisse — xà' };

export default async function EmployeCaissePage() {
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
    <div className="min-h-screen flex items-center justify-center bg-xa-bg px-4">
      <div className="bg-xa-surface border border-xa-border rounded-2xl p-8 max-w-sm w-full text-center shadow-lg">
        <p className="text-4xl mb-4">✅</p>
        <h1 className="text-lg font-bold text-xa-text mb-2">
          Bonjour {employe.prenom} !
        </h1>
        <p className="text-sm text-xa-muted mb-1">
          {boutique?.nom ?? 'Boutique'} · {boutique?.ville ?? ''}
        </p>
        <p className="text-xs text-xa-muted mb-6 capitalize">{employe.role}</p>
        <p className="text-sm text-xa-muted">
          La caisse employé sera disponible dans la prochaine mise à jour.
        </p>
        <div className="mt-6">
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}
