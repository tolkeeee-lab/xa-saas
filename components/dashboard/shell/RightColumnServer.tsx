import { getActivityEvents } from '@/lib/supabase/dashboard/activity';
import ActivityTimeline from '@/components/dashboard/activity/ActivityTimeline';

type Props = {
  userId: string;
};

export default async function RightColumnServer({ userId }: Props) {
  const initialEvents = await getActivityEvents(userId, { limit: 100 });

  return (
    <ActivityTimeline initialEvents={initialEvents} userId={userId} />
  );
}
