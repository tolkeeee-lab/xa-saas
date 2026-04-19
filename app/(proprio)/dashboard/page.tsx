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

const VALID_PERIODS: PeriodKey[] = ['7J', '30J', 'Mois', 'An'];
const DEFAULT_PERIOD: PeriodKey = '7J';

type PageProps = {
  searchParams: Promise<{ period?: string; store?: string }>;
};

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
  const storeIds = rawStore !== 'all' ? [rawStore] : [];

  const boutiques = await getBoutiques(user.id);
  const activeStoreName =
    storeIds.length === 1
      ? (boutiques.find((b) => b.id === storeIds[0])?.nom ?? 'Tableau de bord')
      : 'Tableau de bord';

  const [
    kpiData,
    revenueData,
    peakHoursData,
    categoryData,
    heatmapData,
    storesRankingData,
    topProductsData,
    staffData,
    alertsData,
    healthScoresData,
    forecastData,
    objectivesData,
    quickSummaryData,
  ] = await Promise.all([
    getKPIs(user.id, storeIds, period),
    getRevenueSeries(user.id, storeIds, period),
    getPeakHours(user.id, storeIds),
    getCategoryBreakdown(user.id, storeIds, period),
    getHeatmap(user.id, storeIds),
    getStoresRanking(user.id),
    getTopProducts(user.id, storeIds),
    getStaffStatus(user.id, storeIds),
    getAlerts(user.id, storeIds),
    getHealthScores(user.id),
    getForecast(user.id, storeIds),
    getObjectives(user.id),
    getQuickSummary(user.id, storeIds, period),
  ]);

  return (
    <div className="xa-dashboard-center">
      <Suspense fallback={null}>
        <PageHeader storeName={activeStoreName} initialPeriod={period} />
      </Suspense>

      <div className="xa-center-content">
        <Suspense fallback={<KPIGridSkeleton />}>
          <KPIGrid data={kpiData} />
        </Suspense>

        <Suspense fallback={<RevenueChartSkeleton />}>
          <RevenueChart data={revenueData} />
        </Suspense>

        <div className="xa-row-2col">
          <Suspense fallback={<GridSkeleton cols={1} height={200} />}>
            <PeakHoursCard data={peakHoursData} />
          </Suspense>
          <Suspense fallback={<GridSkeleton cols={1} height={200} />}>
            <CategoriesDonut data={categoryData} />
          </Suspense>
        </div>

        <Suspense fallback={<GridSkeleton cols={1} height={220} />}>
          <HeatmapCard data={heatmapData} />
        </Suspense>

        <div className="xa-row-2col">
          <Suspense fallback={<GridSkeleton cols={1} height={200} />}>
            <StoresRankingCard data={storesRankingData} />
          </Suspense>
          <Suspense fallback={<GridSkeleton cols={1} height={200} />}>
            <TopProductsCard data={topProductsData} />
          </Suspense>
        </div>

        <div className="xa-row-2col">
          <Suspense fallback={<GridSkeleton cols={1} height={200} />}>
            <StaffCard data={staffData} />
          </Suspense>
          <Suspense fallback={<GridSkeleton cols={1} height={200} />}>
            <ActiveAlertsCard data={alertsData} />
          </Suspense>
        </div>

        <Suspense fallback={<GridSkeleton cols={1} height={180} />}>
          <HealthScoresCard data={healthScoresData} />
        </Suspense>

        <div className="xa-row-2col">
          <Suspense fallback={<GridSkeleton cols={1} height={180} />}>
            <ForecastCard data={forecastData} />
          </Suspense>
          <Suspense fallback={<GridSkeleton cols={1} height={180} />}>
            <MonthObjectivesCard data={objectivesData} />
          </Suspense>
        </div>

        <Suspense fallback={<GridSkeleton cols={1} height={160} />}>
          <QuickSummaryCard data={quickSummaryData} />
        </Suspense>
      </div>
    </div>
  );
}
