import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { getBoutiques } from '@/lib/supabase/getBoutiques';
import { getActivityJournal } from '@/lib/supabase/getActivityJournal';
import ActivityJournalPage from '@/features/activite/ActivityJournalPage';

export const metadata = { title: "Journal d'activité — xà" };

type SearchParams = {
  boutique?: string;
  type?: string;
  from?: string;
  to?: string;
  q?: string;
  page?: string;
};

const PAGE_SIZE = 50;

export default async function ActivitePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? '1', 10) || 1);

  const [boutiques, journal] = await Promise.all([
    getBoutiques(user.id),
    getActivityJournal(user.id, {
      boutiqueId: params.boutique && params.boutique !== 'all' ? params.boutique : null,
      type: params.type && params.type !== 'all' ? params.type : null,
      from: params.from ?? null,
      to: params.to ?? null,
      search: params.q ?? null,
      page,
      pageSize: PAGE_SIZE,
    }),
  ]);

  return (
    <ActivityJournalPage
      boutiques={boutiques}
      events={journal.events}
      totalCount={journal.totalCount}
      page={page}
      pageSize={PAGE_SIZE}
      filters={{
        boutique: params.boutique ?? 'all',
        type: params.type ?? 'all',
        from: params.from ?? '',
        to: params.to ?? '',
        q: params.q ?? '',
      }}
    />
  );
}
