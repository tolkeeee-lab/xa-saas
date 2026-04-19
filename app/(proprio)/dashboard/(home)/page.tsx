import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { getBoutiques } from '@/lib/supabase/getBoutiques';
import { getKPIs } from '@/lib/supabase/dashboard/kpis';
import { getRevenueSeries } from '@/lib/supabase/dashboard/revenue';
import { getPeakHours } from '@/lib/supabase/dashboard/peak-hours';
import { getCategoryBreakdown } from '@/lib/supabase/dashboard/categories';
import { getHeatmap } from '@/lib/supabase/dashboard/heatmap';
import { getStoresRanking } from '@/lib/supabase/dashboard/stores-ranking';
import { getTopProducts } from '@/lib/supabase/dashboard/top-products';
import { getStaffStatus } from '@/lib/supabase/dashboard/staff-status';
import { getAlerts } from '@/lib/supabase/dashboard/alerts';
import { getHealthScores } from '@/lib/supabase/dashboard/health-scores';
import { getForecast } from '@/lib/supabase/dashboard/forecast';
import { getObjectives } from '@/lib/supabase/dashboard/objectives';
import { getQuickSummary } from '@/lib/supabase/dashboard/quick-summary';
import type { PeriodKey } from '@/lib/supabase/dashboard/kpis';
import PageHeader from '@/components/dashboard/home/PageHeader';
import KPIGrid from '@/components/dashboard/home/KPIGrid';
import RevenueChart from '@/components/dashboard/home/RevenueChart';
import PeakHoursCard from '@/components/dashboard/home/PeakHoursCard';
import CategoriesDonut from '@/components/dashboard/home/CategoriesDonut';
import HeatmapCard from '@/components/dashboard/home/HeatmapCard';
import StoresRankingCard from '@/components/dashboard/home/StoresRankingCard';
import TopProductsCard from '@/components/dashboard/home/TopProductsCard';
import StaffCard from '@/components/dashboard/home/StaffCard';
import ActiveAlertsCard from '@/components/dashboard/home/ActiveAlertsCard';
import HealthScoresCard from '@/components/dashboard/home/HealthScoresCard';
import ForecastCard from '@/components/dashboard/home/ForecastCard';
import MonthObjectivesCard from '@/components/dashboard/home/MonthObjectivesCard';
import QuickSummaryCard from '@/components/dashboard/home/QuickSummaryCard';
import KPIGridSkeleton from '@/components/dashboard/home/KPIGridSkeleton';
import RevenueChartSkeleton from '@/components/dashboard/home/RevenueChartSkeleton';
import GridSkeleton from '@/components/dashboard/home/GridSkeleton';
import DashboardShell from '@/components/dashboard/shell/DashboardShell';
import LeftColumnServer from '@/components/dashboard/shell/LeftColumnServer';
import RightColumnServer from '@/components/dashboard/shell/RightColumnServer';
import LeftColumnSkeleton from '@/components/dashboard/shell/LeftColumnSkeleton';
import RightColumnSkeleton from '@/components/dashboard/shell/RightColumnSkeleton';
import DashboardLoading from '../loading';

const VALID_PERIODS: PeriodKey[] = ['7J', '30J', 'Mois', 'An'];
const DEFAULT_PERIOD: PeriodKey = '7J';

type PageProps = {
  searchParams: Promise<{ period?: string; store?: string; type?: string }>;
};

// ── Async server-component wrappers ──────────────────────────────────────────
// Each wrapper fetches its own data independently so Suspense boundaries
// stream each widget as soon as its data resolves (true progressive rendering).

async function KPIGridSection({ userId, storeIds, period }: { userId: string; storeIds: string[]; period: PeriodKey }) {
  const data = await getKPIs(userId, storeIds, period);
  return <KPIGrid data={data} />;
}

async function RevenueChartSection({ userId, storeIds, period }: { userId: string; storeIds: string[]; period: PeriodKey }) {
  const data = await getRevenueSeries(userId, storeIds, period);
  return <RevenueChart data={data} />;
}

async function PeakHoursSection({ userId, storeIds }: { userId: string; storeIds: string[] }) {
  const data = await getPeakHours(userId, storeIds);
  return <PeakHoursCard data={data} />;
}

async function CategoriesSection({ userId, storeIds, period }: { userId: string; storeIds: string[]; period: PeriodKey }) {
  const data = await getCategoryBreakdown(userId, storeIds, period);
  return <CategoriesDonut data={data} />;
}

async function HeatmapSection({ userId, storeIds }: { userId: string; storeIds: string[] }) {
  const data = await getHeatmap(userId, storeIds);
  return <HeatmapCard data={data} />;
}

async function StoresRankingSection({ userId }: { userId: string }) {
  const data = await getStoresRanking(userId);
  return <StoresRankingCard data={data} />;
}

async function TopProductsSection({ userId, storeIds }: { userId: string; storeIds: string[] }) {
  const data = await getTopProducts(userId, storeIds);
  return <TopProductsCard data={data} />;
}

async function StaffSection({ userId, storeIds }: { userId: string; storeIds: string[] }) {
  const data = await getStaffStatus(userId, storeIds);
  return <StaffCard data={data} />;
}

async function AlertsSection({ userId, storeIds }: { userId: string; storeIds: string[] }) {
  const data = await getAlerts(userId, storeIds);
  return <ActiveAlertsCard data={data} />;
}

async function HealthScoresSection({ userId }: { userId: string }) {
  const data = await getHealthScores(userId);
  return <HealthScoresCard data={data} />;
}

async function ForecastSection({ userId, storeIds }: { userId: string; storeIds: string[] }) {
  const data = await getForecast(userId, storeIds);
  return <ForecastCard data={data} />;
}

async function ObjectivesSection({ userId }: { userId: string }) {
  const data = await getObjectives(userId);
  return <MonthObjectivesCard data={data} />;
}

async function QuickSummarySection({ userId, storeIds, period }: { userId: string; storeIds: string[]; period: PeriodKey }) {
  const data = await getQuickSummary(userId, storeIds, period);
  return <QuickSummaryCard data={data} />;
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const resolvedParams = await searchParams;
  const rawPeriod = resolvedParams.period ?? DEFAULT_PERIOD;
  const period: PeriodKey = VALID_PERIODS.includes(rawPeriod as PeriodKey)
    ? (rawPeriod as PeriodKey)
    : DEFAULT_PERIOD;

  const rawStore = resolvedParams.store ?? 'all';
  const storeFilter = rawStore !== 'all' ? rawStore : null;
  const storeIds = storeFilter ? [storeFilter] : [];

  const rawType = resolvedParams.type ?? 'all';
  const typeFilter = rawType !== 'all' ? rawType : null;

  const boutiques = await getBoutiques(user.id);
  const activeStoreName =
    storeIds.length === 1
      ? (boutiques.find((b) => b.id === storeIds[0])?.nom ?? 'Tableau de bord')
      : 'Tableau de bord';

  const centerColumn = (
    <main className="p-4 md:p-6">
      <Suspense fallback={<DashboardLoading />}>
        <div className="xa-dashboard-center">
          <PageHeader storeName={activeStoreName} initialPeriod={period} />

          <div className="xa-center-content">
            <Suspense fallback={<KPIGridSkeleton />}>
              <KPIGridSection userId={user.id} storeIds={storeIds} period={period} />
            </Suspense>

            <Suspense fallback={<RevenueChartSkeleton />}>
              <RevenueChartSection userId={user.id} storeIds={storeIds} period={period} />
            </Suspense>

            <div className="xa-row-2col">
              <Suspense fallback={<GridSkeleton cols={1} height={200} />}>
                <PeakHoursSection userId={user.id} storeIds={storeIds} />
              </Suspense>
              <Suspense fallback={<GridSkeleton cols={1} height={200} />}>
                <CategoriesSection userId={user.id} storeIds={storeIds} period={period} />
              </Suspense>
            </div>

            <Suspense fallback={<GridSkeleton cols={1} height={220} />}>
              <HeatmapSection userId={user.id} storeIds={storeIds} />
            </Suspense>

            <div className="xa-row-2col">
              <Suspense fallback={<GridSkeleton cols={1} height={200} />}>
                <StoresRankingSection userId={user.id} />
              </Suspense>
              <Suspense fallback={<GridSkeleton cols={1} height={200} />}>
                <TopProductsSection userId={user.id} storeIds={storeIds} />
              </Suspense>
            </div>

            <div className="xa-row-2col">
              <Suspense fallback={<GridSkeleton cols={1} height={200} />}>
                <StaffSection userId={user.id} storeIds={storeIds} />
              </Suspense>
              <Suspense fallback={<GridSkeleton cols={1} height={200} />}>
                <AlertsSection userId={user.id} storeIds={storeIds} />
              </Suspense>
            </div>

            <Suspense fallback={<GridSkeleton cols={1} height={180} />}>
              <HealthScoresSection userId={user.id} />
            </Suspense>

            <div className="xa-row-2col">
              <Suspense fallback={<GridSkeleton cols={1} height={180} />}>
                <ForecastSection userId={user.id} storeIds={storeIds} />
              </Suspense>
              <Suspense fallback={<GridSkeleton cols={1} height={180} />}>
                <ObjectivesSection userId={user.id} />
              </Suspense>
            </div>

            <Suspense fallback={<GridSkeleton cols={1} height={160} />}>
              <QuickSummarySection userId={user.id} storeIds={storeIds} period={period} />
            </Suspense>
          </div>
        </div>
      </Suspense>
    </main>
  );

  return (
    <DashboardShell
      boutiques={boutiques}
      leftColumn={
        <Suspense fallback={<LeftColumnSkeleton />}>
          <LeftColumnServer userId={user.id} storeFilter={storeFilter} />
        </Suspense>
      }
      centerColumn={centerColumn}
      rightColumn={
        <Suspense fallback={<RightColumnSkeleton />}>
          <RightColumnServer userId={user.id} storeFilter={storeFilter} typeFilter={typeFilter} />
        </Suspense>
      }
    />
  );
}
