import { getBoutiquesSummary, getGlobalSummary } from '@/lib/supabase/dashboard/hero';
import { getActivityEvents } from '@/lib/supabase/dashboard/activity';
import LeftColumnClient from '@/components/dashboard/hero/LeftColumnClient';

type Props = {
  userId: string;
};

export default async function LeftColumnServer({ userId }: Props) {
  const [boutiques, globalSummary, activityEvents] = await Promise.all([
    getBoutiquesSummary(userId),
    getGlobalSummary(userId),
    getActivityEvents(userId, { types: ['alert', 'stock'], limit: 20 }),
  ]);

  return (
    <LeftColumnClient
      boutiques={boutiques}
      globalSummary={globalSummary}
      activityEvents={activityEvents}
    />
  );
}
