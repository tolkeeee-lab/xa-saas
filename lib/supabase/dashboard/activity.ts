import { cache } from 'react';
import { createClient } from '@/lib/supabase-server';

export type ActivityEvent = {
  id: string;
  type: 'sale' | 'alert' | 'stock' | 'staff' | 'goal' | 'system';
  severity: 'info' | 'success' | 'warning' | 'danger';
  title: string;
  description: string | null;
  amount: number | null;
  boutique: { id: string; name: string } | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export const getActivityEvents = cache(async (
  userId: string,
  filters: { boutiqueIds?: string[]; types?: string[]; limit?: number } = {},
): Promise<ActivityEvent[]> => {
  const supabase = await createClient();

  let query = supabase
    .from('activity_events')
    .select('id, type, severity, title, description, amount, metadata, created_at, boutique_id')
    .eq('proprietaire_id', userId)
    .order('created_at', { ascending: false })
    .limit(filters.limit ?? 100);

  if (filters.boutiqueIds?.length) {
    query = query.in('boutique_id', filters.boutiqueIds);
  }

  if (filters.types?.length) {
    query = query.in('type', filters.types as ActivityEvent['type'][]);
  }

  const { data } = await query;
  if (!data?.length) return [];

  // Resolve boutique names for referenced boutique_ids
  const boutiqueIds = [
    ...new Set(
      data.map((r) => r.boutique_id as string | null).filter((id): id is string => id !== null),
    ),
  ];
  let boutiqueMap = new Map<string, string>();
  if (boutiqueIds.length) {
    const { data: boutiques } = await supabase
      .from('boutiques')
      .select('id, nom')
      .in('id', boutiqueIds);
    boutiqueMap = new Map((boutiques ?? []).map((b) => [b.id as string, b.nom as string]));
  }

  return data.map((row) => {
    const boutiqueId = row.boutique_id as string | null;
    const boutiqueName = boutiqueId ? boutiqueMap.get(boutiqueId) : undefined;
    return {
      id: row.id as string,
      type: row.type as ActivityEvent['type'],
      severity: row.severity as ActivityEvent['severity'],
      title: row.title as string,
      description: row.description as string | null,
      amount: row.amount as number | null,
      boutique: boutiqueId && boutiqueName ? { id: boutiqueId, name: boutiqueName } : null,
      metadata: (row.metadata as Record<string, unknown>) ?? {},
      created_at: row.created_at as string,
    };
  });
});
