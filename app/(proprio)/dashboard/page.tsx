import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { getBoutiques } from '@/lib/supabase/getBoutiques';
import { getWeeklyStats } from '@/lib/supabase/getWeeklyStats';
import { getRapports } from '@/lib/supabase/getRapports';
import { getAlertesStock } from '@/lib/supabase/getAlertesStock';
import { getSalesByCategory } from '@/lib/supabase/getSalesByCategory';
import { getClients } from '@/lib/supabase/getClients';
import DashboardHome from '@/features/dashboard/DashboardHome';
import type { RecentTx } from '@/features/dashboard/DashboardHome';

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

  // Fetch all data in parallel
  const [weeklyStats, rapports, alertesStock, salesByCategory, clientsData] =
    await Promise.all([
      getWeeklyStats(user.id),
      getRapports(user.id),
      getAlertesStock(user.id),
      getSalesByCategory(user.id, dateDebut, dateFin),
      getClients(user.id),
    ]);

  // Recent transactions (last 4, any status)
  const recentTxResult = boutiqueIds.length > 0
    ? await supabase
        .from('transactions')
        .select('id, client_nom, montant_total, created_at, statut, boutique_id')
        .in('boutique_id', boutiqueIds)
        .order('created_at', { ascending: false })
        .limit(4)
    : { data: [] };

  const recentTransactions: RecentTx[] = (recentTxResult.data ?? []).map((t) => ({
    id: t.id as string,
    client_nom: t.client_nom as string | null,
    montant_total: (t.montant_total as number) ?? 0,
    created_at: t.created_at as string,
    statut: t.statut as 'validee' | 'annulee',
    boutique_id: t.boutique_id as string,
  }));

  // Hourly distribution of transactions (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

  const hourlyResult = boutiqueIds.length > 0
    ? await supabase
        .from('transactions')
        .select('created_at')
        .in('boutique_id', boutiqueIds)
        .eq('statut', 'validee')
        .gte('created_at', sevenDaysAgoStr)
    : { data: [] };

  const hourlyStats: number[] = Array<number>(24).fill(0);
  for (const tx of hourlyResult.data ?? []) {
    const hour = new Date(tx.created_at as string).getHours();
    hourlyStats[hour]++;
  }

  return (
    <DashboardHome
      weeklyStats={weeklyStats}
      moisStats={rapports.moisStats}
      alertesStock={alertesStock}
      salesByCategory={salesByCategory}
      boutiques={boutiques}
      recentTransactions={recentTransactions}
      clientsCount={clientsData.total_clients}
      hourlyStats={hourlyStats}
    />
  );
}
