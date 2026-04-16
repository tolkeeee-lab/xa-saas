import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { getBoutiques } from '@/lib/supabase/getBoutiques';
import { getDailyStats } from '@/lib/supabase/getDailyStats';
import { getWeeklyStats } from '@/lib/supabase/getWeeklyStats';
import { getRapports } from '@/lib/supabase/getRapports';
import { getTopProduits } from '@/lib/supabase/getTopProduits';
import StatCard from '@/components/ui/StatCard';
import BoutiqueCard from '@/components/ui/BoutiqueCard';
import WeeklyChart from '@/features/rapports/WeeklyChart';
import TransactionFlux from '@/features/rapports/TransactionFlux';
import DashboardCharts from '@/features/dashboard/DashboardCharts';
import { formatFCFA } from '@/lib/format';
import type { Transaction } from '@/types/database';
import type { DailyStats } from '@/lib/supabase/getDailyStats';
import Link from 'next/link';

const QUICK_LINKS = [
  { href: '/dashboard/caisse',   label: '🛒 Nouvelle vente', color: '#6c2ed1' },
  { href: '/dashboard/stocks',   label: '📦 Stocks',          color: '#14d9eb' },
  { href: '/dashboard/rapports', label: '📊 Rapports',        color: '#17e8bb' },
  { href: '/dashboard/charges',  label: '💳 Charges',         color: '#8a58da' },
];

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const now = new Date();
  const dateDebut = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const dateFin = now.toISOString().slice(0, 10);

  const boutiques = await getBoutiques(user.id);
  const boutiqueIds = boutiques.map((b) => b.id);
  const today = now.toISOString().split('T')[0];

  const [weeklyStats, boutiqueStatsArr, stockResult, txResult, rapports, topProduitsData] =
    await Promise.all([
      getWeeklyStats(user.id),
      Promise.all(boutiques.map((b) => getDailyStats(b.id))),
      boutiqueIds.length > 0
        ? supabase
            .from('produits')
            .select('id, stock_actuel, seuil_alerte')
            .in('boutique_id', boutiqueIds)
            .eq('actif', true)
        : Promise.resolve({ data: [] as { id: string; stock_actuel: number; seuil_alerte: number }[] }),
      boutiqueIds.length > 0
        ? supabase
            .from('transactions')
            .select('*')
            .in('boutique_id', boutiqueIds)
            .gte('created_at', today)
            .eq('statut', 'validee')
            .order('created_at', { ascending: false })
            .limit(10)
        : Promise.resolve({ data: [] as Transaction[] }),
      getRapports(user.id),
      getTopProduits(user.id, dateDebut, dateFin),
    ]);

  const produits = stockResult.data ?? [];
  const stockAlertes = produits.filter(
    (p) => p.stock_actuel <= p.seuil_alerte,
  ).length;

  const recentTransactions = (txResult.data ?? []) as Transaction[];

  // Aggregate global stats from per-boutique stats
  const globalStats: DailyStats = (boutiqueStatsArr as DailyStats[]).reduce(
    (acc, s) => ({
      ca: acc.ca + s.ca,
      transactions: acc.transactions + s.transactions,
      benefice: acc.benefice + s.benefice,
    }),
    { ca: 0, transactions: 0, benefice: 0 },
  );

  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="CA réseau aujourd'hui"
          value={formatFCFA(globalStats.ca)}
          subtitle="Toutes boutiques"
          emoji="💰"
          color="#14d9eb"
          animate
        />
        <StatCard
          title="Transactions"
          value={globalStats.transactions}
          subtitle="Aujourd'hui"
          emoji="🧾"
          color="#17e8bb"
          animate
        />
        <StatCard
          title="Boutiques actives"
          value={boutiques.length}
          subtitle="En ligne"
          emoji="🏪"
          color="#8a58da"
          animate
        />
        <StatCard
          title="Alertes stock"
          value={stockAlertes}
          subtitle="Produits sous seuil"
          emoji="⚠️"
          color="#f5740a"
          animate
          badge={stockAlertes > 0 ? `🔴 ${stockAlertes} alerte${stockAlertes > 1 ? 's' : ''}` : undefined}
        />
      </div>

      {/* Rich dashboard charts */}
      <DashboardCharts
        weeklyStats={weeklyStats}
        moisStats={rapports.moisStats}
        topProduits={topProduitsData.global}
        globalStats={globalStats}
        boutiques={boutiques}
      />

      {/* Accès rapides */}
      <div>
        <h2 className="text-xs font-semibold text-xa-muted uppercase tracking-wider mb-3">
          Accès rapides
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-white text-sm font-semibold transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-100"
              style={{
                background: `linear-gradient(135deg, ${link.color}cc, ${link.color})`,
                boxShadow: `0 2px 12px ${link.color}44`,
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Per-boutique cards */}
      {boutiques.length > 0 ? (
        <div>
          <h2 className="text-xs font-semibold text-xa-muted uppercase tracking-wider mb-3">
            Mes boutiques
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {boutiques.map((boutique, i) => {
              const stats = (boutiqueStatsArr as DailyStats[])[i] ?? {
                ca: 0,
                transactions: 0,
                benefice: 0,
              };
              return (
                <BoutiqueCard
                  key={boutique.id}
                  boutique={boutique}
                  ca={stats.ca}
                  transactions={stats.transactions}
                  benefice={stats.benefice}
                />
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-xa-surface border border-xa-border rounded-xl p-8 text-center">
          <p className="text-xa-muted mb-4">Vous n&apos;avez pas encore de boutique.</p>
          <Link
            href="/dashboard/boutiques/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-xa-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            + Créer ma première boutique
          </Link>
        </div>
      )}

      {/* Chart + flux */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <WeeklyChart stats={weeklyStats} boutiques={boutiques} />
        <TransactionFlux transactions={recentTransactions} boutiques={boutiques} />
      </div>
    </div>
  );
}
