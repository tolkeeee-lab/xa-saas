import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { getActivityJournal } from '@/lib/supabase/getActivityJournal';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  const url = new URL(req.url);
  const boutique = url.searchParams.get('boutique');
  const type = url.searchParams.get('type');

  const filters = {
    boutiqueId: boutique && boutique !== 'all' ? boutique : null,
    type: type && type !== 'all' ? type : null,
    from: url.searchParams.get('from'),
    to: url.searchParams.get('to'),
    search: url.searchParams.get('q'),
    page: 1,
    pageSize: 10000,
  };

  const { events } = await getActivityJournal(user.id, filters);

  const headers = ['Date', 'Heure', 'Type', 'Boutique', 'Titre', 'Description', 'Montant (FCFA)'];
  const rows = events.map((e) => {
    const d = new Date(e.created_at);
    const boutiqueName = e.boutiques?.nom ?? '';
    return [
      d.toISOString().slice(0, 10),
      d.toISOString().slice(11, 19),
      e.type,
      boutiqueName,
      e.title,
      (e.description ?? '').replace(/"/g, '""'),
      e.amount?.toString() ?? '',
    ];
  });

  const csv = [
    headers.join(','),
    ...rows.map((r) => r.map((c) => `"${c}"`).join(',')),
  ].join('\n');

  return new Response('\uFEFF' + csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="xa-activite-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
