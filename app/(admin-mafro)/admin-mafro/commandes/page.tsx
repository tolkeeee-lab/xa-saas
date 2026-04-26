import { requireMafroAdmin } from '@/lib/auth/requireMafroAdmin';
import { createAdminClient } from '@/lib/supabase-admin';
import CommandesQueue from '@/features/admin-mafro/commandes/CommandesQueue';
import type { CommandeB2B } from '@/types/database';

export const metadata = { title: 'Commandes B2B — Admin MAFRO' };

export default async function AdminCommandesPage() {
  await requireMafroAdmin();

  const admin = createAdminClient();
  const { data } = await admin
    .from('commandes_b2b')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  const commandes = (data ?? []) as CommandeB2B[];

  return (
    <div className="xa-admin-page">
      <div className="xa-admin-page__header">
        <h1 className="xa-admin-page__title">Commandes B2B</h1>
        <p className="xa-admin-page__subtitle">
          {commandes.filter((c) => c.statut === 'soumise').length} nouvelle(s) commande(s) en attente
        </p>
      </div>
      <CommandesQueue initialCommandes={commandes} />
    </div>
  );
}
