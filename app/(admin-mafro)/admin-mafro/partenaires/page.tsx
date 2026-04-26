import { requireMafroAdmin } from '@/lib/auth/requireMafroAdmin';
import { createAdminClient } from '@/lib/supabase-admin';
import PartenairesList from '@/features/admin-mafro/partenaires/PartenairesList';
import type { Boutique } from '@/types/database';

export const metadata = { title: 'Partenaires — Admin MAFRO' };

export default async function AdminPartenairesPage() {
  await requireMafroAdmin();

  const admin = createAdminClient();
  const { data } = await admin
    .from('boutiques')
    .select('*')
    .order('created_at', { ascending: false });

  const boutiques = (data ?? []) as Boutique[];

  return (
    <div className="xa-admin-page">
      <div className="xa-admin-page__header">
        <h1 className="xa-admin-page__title">Partenaires</h1>
        <p className="xa-admin-page__subtitle">
          {boutiques.filter((b) => b.actif).length} boutique(s) active(s) •{' '}
          {boutiques.filter((b) => !b.actif).length} inactive(s)
        </p>
      </div>
      <PartenairesList initialBoutiques={boutiques} />
    </div>
  );
}
