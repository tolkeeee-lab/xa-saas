import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase-admin';
import EmployeLockScreenClient from '@/features/employe/EmployeLockScreenClient';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Connexion employé — xà' };

function DesactivatedScreen({ prenom }: { prenom: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-xa-bg px-4">
      <div className="bg-xa-surface border border-xa-border rounded-2xl p-8 max-w-sm w-full text-center shadow-lg">
        <p className="text-4xl mb-4">❌</p>
        <h1 className="text-lg font-bold text-xa-text mb-2">Compte désactivé</h1>
        <p className="text-sm text-xa-muted">
          Bonjour {prenom}, ton compte a été désactivé. Contacte le propriétaire pour le
          réactiver.
        </p>
      </div>
    </div>
  );
}

function LockedScreen({ until }: { until: string }) {
  const minutes = Math.max(1, Math.ceil((new Date(until).getTime() - Date.now()) / 60000));
  return (
    <div className="min-h-screen flex items-center justify-center bg-xa-bg px-4">
      <div className="bg-xa-surface border border-xa-border rounded-2xl p-8 max-w-sm w-full text-center shadow-lg">
        <p className="text-4xl mb-4">⏰</p>
        <h1 className="text-lg font-bold text-xa-text mb-2">Compte verrouillé</h1>
        <p className="text-sm text-xa-muted">
          Trop de tentatives incorrectes. Réessaye dans{' '}
          <strong>{minutes} minute{minutes > 1 ? 's' : ''}</strong>.
        </p>
      </div>
    </div>
  );
}

export default async function EmployeInvitePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const supabase = createAdminClient();

  const { data: employe } = await supabase
    .from('employes')
    .select('id, nom, prenom, role, actif, boutique_id, locked_until')
    .eq('invite_code', code.toUpperCase())
    .maybeSingle();

  if (!employe) notFound();

  if (!employe.actif) {
    return <DesactivatedScreen prenom={employe.prenom} />;
  }

  if (employe.locked_until && new Date(employe.locked_until) > new Date()) {
    return <LockedScreen until={employe.locked_until} />;
  }

  const { data: boutique } = await supabase
    .from('boutiques')
    .select('id, nom, ville, couleur_theme')
    .eq('id', employe.boutique_id)
    .single();

  return (
    <EmployeLockScreenClient
      mode="invite"
      preselectedEmploye={{
        id: employe.id,
        nom: employe.nom,
        prenom: employe.prenom,
        role: employe.role,
        boutique_id: employe.boutique_id,
      }}
      boutique={boutique ?? undefined}
    />
  );
}
