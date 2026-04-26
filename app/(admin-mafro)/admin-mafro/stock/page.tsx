import { requireMafroAdmin } from '@/lib/auth/requireMafroAdmin';
import { createAdminClient } from '@/lib/supabase-admin';
import StockCentralTable from '@/features/admin-mafro/stock/StockCentralTable';
import type { ProduitCatalogueAdmin } from '@/types/database';

export const metadata = { title: 'Stock Central — Admin MAFRO' };

export default async function AdminStockPage() {
  await requireMafroAdmin();

  const admin = createAdminClient();
  const { data } = await admin
    .from('produits_catalogue_admin')
    .select('*')
    .order('nom');

  const produits = (data ?? []) as ProduitCatalogueAdmin[];

  const rupturesCount = produits.filter((p) => p.est_actif && p.stock_central <= 0).length;

  return (
    <div className="xa-admin-page">
      <div className="xa-admin-page__header">
        <h1 className="xa-admin-page__title">Stock Central</h1>
        <p className="xa-admin-page__subtitle">
          {produits.filter((p) => p.est_actif).length} produits actifs •{' '}
          {rupturesCount > 0 ? (
            <span style={{ color: 'var(--xa-red)' }}>{rupturesCount} rupture(s)</span>
          ) : (
            <span style={{ color: 'var(--xa-green)' }}>Aucune rupture</span>
          )}
        </p>
      </div>
      <StockCentralTable initialProduits={produits} />
    </div>
  );
}
