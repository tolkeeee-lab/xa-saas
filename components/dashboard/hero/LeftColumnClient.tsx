'use client';

import { useDashboardFilter } from '@/context/DashboardFilterContext';
import type { BoutiqueSummary, GlobalSummary } from '@/lib/supabase/dashboard/hero';
import type { ActivityEvent } from '@/lib/supabase/dashboard/activity';
import HeroBoutique from './HeroBoutique';
import GlobalHero from './GlobalHero';
import BoutiquesList from './BoutiquesList';

type Props = {
  boutiques: BoutiqueSummary[];
  globalSummary: GlobalSummary;
  activityEvents: ActivityEvent[];
};

export default function LeftColumnClient({ boutiques, globalSummary, activityEvents }: Props) {
  const { activeStoreId } = useDashboardFilter();

  return (
    <>
      {activeStoreId !== 'all' ? (
        <HeroBoutique boutiques={boutiques} activityEvents={activityEvents} />
      ) : (
        <GlobalHero summary={globalSummary} />
      )}
      <BoutiquesList boutiques={boutiques} />
    </>
  );
}
