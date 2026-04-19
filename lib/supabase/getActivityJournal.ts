import { createClient } from '@/lib/supabase-server';
import { dbTypeFromChip } from '@/lib/dashboard/filters';

export type ActivityEventJournal = {
  id: string;
  proprietaire_id: string;
  boutique_id: string | null;
  type: 'sale' | 'alert' | 'stock' | 'staff' | 'goal' | 'system';
  severity: 'info' | 'success' | 'warning' | 'danger';
  title: string;
  description: string | null;
  amount: number | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  boutiques?: { nom: string } | null;
};

export type JournalFilters = {
  boutiqueId?: string | null;
  type?: string | null;
  from?: string | null;
  to?: string | null;
  search?: string | null;
  page?: number;
  pageSize?: number;
};

export async function getActivityJournal(
  userId: string,
  filters: JournalFilters = {},
): Promise<{ events: ActivityEventJournal[]; totalCount: number }> {
  const supabase = await createClient();
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = filters.pageSize ?? 50;
  const offset = (page - 1) * pageSize;

  let q = supabase
    .from('activity_events')
    .select('*, boutiques(nom)', { count: 'exact' })
    .eq('proprietaire_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (filters.boutiqueId) q = q.eq('boutique_id', filters.boutiqueId);

  if (filters.type) {
    const dbType = dbTypeFromChip(filters.type);
    if (dbType) q = q.eq('type', dbType as 'sale' | 'alert' | 'stock' | 'staff' | 'goal' | 'system');
  }

  if (filters.from) q = q.gte('created_at', `${filters.from}T00:00:00`);
  if (filters.to) q = q.lte('created_at', `${filters.to}T23:59:59.999`);

  if (filters.search && filters.search.trim()) {
    const s = filters.search.trim().replace(/[%_]/g, '\\$&');
    q = q.or(`title.ilike.%${s}%,description.ilike.%${s}%`);
  }

  const { data, count, error } = await q;
  if (error) {
    console.error('[getActivityJournal] error', error);
    return { events: [], totalCount: 0 };
  }

  return {
    events: (data ?? []) as unknown as ActivityEventJournal[],
    totalCount: count ?? 0,
  };
}
