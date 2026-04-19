import { getActivityEvents } from '@/lib/supabase/dashboard/activity';
import { dbTypeFromChip } from '@/lib/dashboard/filters';
import ActivityTimeline from '@/components/dashboard/activity/ActivityTimeline';

type Props = {
  userId: string;
  storeFilter?: string | null;
  typeFilter?: string | null;
};

export default async function RightColumnServer({ userId, storeFilter, typeFilter }: Props) {
  const dbType = dbTypeFromChip(typeFilter);
  const initialEvents = await getActivityEvents(userId, {
    boutiqueIds: storeFilter ? [storeFilter] : undefined,
    types: dbType ? [dbType] : undefined,
    limit: 100,
  });

  return (
    <ActivityTimeline initialEvents={initialEvents} userId={userId} />
  );
}
