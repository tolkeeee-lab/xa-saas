import { requireMafroAdmin } from '@/lib/auth/requireMafroAdmin';
import { createAdminClient } from '@/lib/supabase-admin';
import DispatchPanel from '@/features/admin-mafro/livraisons/DispatchPanel';
import type { Livraison, CommandeB2B } from '@/types/database';

export const metadata = { title: 'Livraisons — Admin MAFRO' };

export default async function AdminLivraisonsPage() {
  await requireMafroAdmin();

  const admin = createAdminClient();
  const [{ data: livraisonsData }, { data: commandesData }] = await Promise.all([
    admin
      .from('livraisons')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100),
    admin
      .from('commandes_b2b')
      .select('id, numero, statut, boutique_id, total')
      .eq('statut', 'preparee'),
  ]);

  const livraisons = (livraisonsData ?? []) as Livraison[];
  const commandesPrets = (commandesData ?? []) as Pick<
    CommandeB2B,
    'id' | 'numero' | 'statut' | 'boutique_id' | 'total'
  >[];

  return (
    <div className="xa-admin-page">
      <div className="xa-admin-page__header">
        <h1 className="xa-admin-page__title">Dispatch Livraisons</h1>
        <p className="xa-admin-page__subtitle">
          {livraisons.filter((l) => l.statut === 'en_route').length} livraison(s) en route
        </p>
      </div>
      <DispatchPanel initialLivraisons={livraisons} commandesPrets={commandesPrets} />
    </div>
  );
}
