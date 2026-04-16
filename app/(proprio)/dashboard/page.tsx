import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { getBoutiques } from '@/lib/supabase/getBoutiques';
import { getDailyStats } from '@/lib/supabase/getDailyStats';
import { getWeeklyStats } from '@/lib/supabase/getWeeklyStats';
import { getRapports } from '@/lib/supabase/getRapports';
import { getTopProduits } from '@/lib/supabase/getTopProduits';
import BoutiqueCard from '@/components/ui/BoutiqueCard';
import TransactionFlux from '@/features/rapports/TransactionFlux';
import DashboardCharts from '@/features/dashboard/DashboardCharts';
import type { Transaction } from '@/types/database';
import type { DailyStats } from '@/lib/supabase/getDailyStats';
import Link from 'next/link';

const QUICK_LINKS = [
  { href: '/dashboard/caisse',   emoji: '🛒', label: 'Nouvelle vente' },
  { href: '/dashboard/stocks',   emoji: '📦', label: 'Stocks'          },
  { href: '/dashboard/rapports', emoji: '📊', label: 'Rapports'        },
  { href: '/dashboard/charges',  emoji: '💳', label: 'Charges'         },
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

  const [weeklyStats, boutiqueStatsArr, txResult, rapports, topProduitsData] =
    await Promise.all([
      getWeeklyStats(user.id),
      Promise.all(boutiques.map((b) => getDailyStats(b.id))),
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
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs text-zinc-400 uppercase tracking-widest mb-1">
            {now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Tableau de bord</h1>
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          En direct
        </div>
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
        <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
          Accès rapides
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex flex-col items-center justify-center gap-1.5 px-4 py-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 text-sm font-medium text-zinc-900 dark:text-white transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
            >
              <span className="text-2xl">{link.emoji}</span>
              <span>{link.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Per-boutique cards */}
      {boutiques.length > 0 ? (
        <div>
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
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
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl p-8 text-center shadow-sm">
          <p className="text-zinc-400 mb-4">Vous n&apos;avez pas encore de boutique.</p>
          <Link
            href="/dashboard/boutiques/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-xa-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            + Créer ma première boutique
          </Link>
        </div>
      )}

      {/* Transaction flux */}
      <TransactionFlux transactions={recentTransactions} boutiques={boutiques} />
    </div>
  );
}
