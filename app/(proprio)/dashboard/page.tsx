import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { getBoutiques } from '@/lib/supabase/getBoutiques';
import { getDailyStats } from '@/lib/supabase/getDailyStats';
import { getWeeklyStats } from '@/lib/supabase/getWeeklyStats';
import StatCard from '@/components/dashboard/StatCard';
import BoutiqueCard from '@/components/dashboard/BoutiqueCard';
import WeeklyChart from '@/components/dashboard/WeeklyChart';
import TransactionFlux from '@/components/dashboard/TransactionFlux';
import DashboardClient from '@/components/dashboard/DashboardClient';
import { formatFCFA } from '@/lib/format';
import type { Transaction } from '@/types/database';
import type { DailyStats } from '@/lib/supabase/getDailyStats';
import Link from 'next/link';

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const boutiques = await getBoutiques(user.id);
  const boutiqueIds = boutiques.map((b) => b.id);
  const today = new Date().toISOString().split('T')[0];

  const [weeklyStats, boutiqueStatsArr, stockResult, txResult] = await Promise.all([
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
      <DashboardClient hasBoutiques={boutiques.length > 0} />
      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="CA réseau aujourd'hui"
          value={formatFCFA(globalStats.ca)}
          subtitle="Toutes boutiques"
          accent
        />
        <StatCard
          title="Transactions"
          value={globalStats.transactions}
          subtitle="Aujourd'hui"
        />
        <StatCard
          title="Boutiques actives"
          value={boutiques.length}
          subtitle="En ligne"
        />
        <StatCard
          title="Alertes stock"
          value={stockAlertes}
          subtitle="Produits sous seuil"
        />
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
