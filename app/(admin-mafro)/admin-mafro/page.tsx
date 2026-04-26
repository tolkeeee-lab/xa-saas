import { requireMafroAdmin } from '@/lib/auth/requireMafroAdmin';
import { createAdminClient } from '@/lib/supabase-admin';
import KpiCard from '@/features/admin-mafro/overview/KpiCard';
import AlertesList from '@/features/admin-mafro/overview/AlertesList';
import type { CommandeB2B, Livraison, ProduitCatalogueAdmin } from '@/types/database';

type KpiColor = 'green' | 'amber' | 'red' | 'blue' | 'purple';
type KpiIcon = 'trending-up' | 'shopping-cart' | 'truck' | 'store' | 'alert-triangle' | 'undo-2';
type KpiData = { label: string; value: string | number; icon: KpiIcon; color: KpiColor };

export const metadata = { title: 'Vue d\'ensemble — Admin MAFRO' };

export default async function AdminMafroOverviewPage() {
  await requireMafroAdmin();

  const admin = createAdminClient();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [
    { data: commandes },
    { data: livraisons },
    { data: partenaires },
    { data: stockItems },
  ] = await Promise.all([
    admin
      .from('commandes_b2b')
      .select('id, statut, total, created_at')
      .gte('created_at', startOfMonth),
    admin
      .from('livraisons')
      .select('id, statut, created_at, parti_at'),
    admin
      .from('boutiques')
      .select('id, nom, est_actif')
      .eq('est_actif', true),
    admin
      .from('produits_catalogue_admin')
      .select('id, nom, stock_central, est_actif')
      .eq('est_actif', true),
  ]);

  const commandesList = (commandes ?? []) as CommandeB2B[];
  const livraisonsList = (livraisons ?? []) as Livraison[];
  const partenairesList = partenaires ?? [];
  const stockList = (stockItems ?? []) as ProduitCatalogueAdmin[];

  const caTotal = commandesList
    .filter((c) => c.statut !== 'annulee')
    .reduce((sum, c) => sum + c.total, 0);

  const commandesAttente = commandesList.filter(
    (c) => c.statut === 'soumise' || c.statut === 'confirmee',
  ).length;

  const livraisonsEnRoute = livraisonsList.filter(
    (l) => l.statut === 'en_route',
  ).length;

  const rupturesStock = stockList.filter((p) => p.stock_central <= 0).length;

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const commandesEnRetard = commandesList.filter(
    (c) =>
      (c.statut === 'soumise' || c.statut === 'confirmee') &&
      c.created_at < twentyFourHoursAgo,
  );

  const livraisonsEnRetard = livraisonsList.filter(
    (l) =>
      l.statut === 'en_route' &&
      l.parti_at &&
      l.parti_at < new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
  );

  const kpis: KpiData[] = [
    {
      label: 'CA total (mois)',
      value: `${(caTotal / 1000).toFixed(0)}k FCFA`,
      icon: 'trending-up' as const,
      color: 'green' as const,
    },
    {
      label: 'Commandes en attente',
      value: commandesAttente,
      icon: 'shopping-cart' as const,
      color: commandesAttente > 0 ? 'amber' as const : 'green' as const,
    },
    {
      label: 'Livraisons en route',
      value: livraisonsEnRoute,
      icon: 'truck' as const,
      color: 'blue' as const,
    },
    {
      label: 'Partenaires actifs',
      value: partenairesList.length,
      icon: 'store' as const,
      color: 'purple' as const,
    },
    {
      label: 'Ruptures stock',
      value: rupturesStock,
      icon: 'alert-triangle' as const,
      color: rupturesStock > 0 ? 'red' as const : 'green' as const,
    },
    {
      label: 'Retours/Litiges',
      value: livraisonsList.filter((l) => l.statut === 'retournee').length,
      icon: 'undo-2' as const,
      color: 'amber' as const,
    },
  ];

  const alertes = [
    ...commandesEnRetard.map((c) => ({
      id: c.id,
      type: 'commande' as const,
      message: `Commande ${c.id.slice(0, 8)} en attente depuis +24h`,
      href: '/admin-mafro/commandes',
      severity: 'warning' as const,
    })),
    ...livraisonsEnRetard.map((l) => ({
      id: l.id,
      type: 'livraison' as const,
      message: `Livraison ${l.id.slice(0, 8)} en route depuis +48h`,
      href: '/admin-mafro/livraisons',
      severity: 'danger' as const,
    })),
    ...stockList
      .filter((p) => p.stock_central <= 0)
      .slice(0, 5)
      .map((p) => ({
        id: p.id,
        type: 'stock' as const,
        message: `Rupture : ${p.nom}`,
        href: '/admin-mafro/stock',
        severity: 'danger' as const,
      })),
  ];

  return (
    <div className="xa-admin-overview">
      <div className="xa-admin-overview__header">
        <h1 className="xa-admin-overview__title">Vue d&apos;ensemble</h1>
        <p className="xa-admin-overview__subtitle">
          Tableau de bord MAFRO — {now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      <div className="xa-admin-overview__kpis">
        {kpis.map((kpi) => (
          <KpiCard
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            icon={kpi.icon}
            color={kpi.color}
          />
        ))}
      </div>

      <div className="xa-admin-overview__bottom">
        <div className="xa-admin-overview__alertes">
          <h2 className="xa-admin-section-title">⚠️ Alertes à traiter</h2>
          <AlertesList alertes={alertes} />
        </div>
      </div>
    </div>
  );
}
