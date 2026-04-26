'use client';

import { useState, useCallback } from 'react';
import ClotureCard from '@/features/cloture/components/ClotureCard';
import type { ClotureCaisseJour } from '@/types/database';

type Filters = {
  boutique_id: string;
  mois?: string;
  statut?: string;
};

type Props = {
  initialData: ClotureCaisseJour[];
  filters: Filters;
  onSelectCloture: (c: ClotureCaisseJour) => void;
};

const PAGE_SIZE = 30;

export default function ClotureHistoryList({
  initialData,
  filters,
  onSelectCloture,
}: Props) {
  const [items, setItems] = useState<ClotureCaisseJour[]>(initialData);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialData.length === PAGE_SIZE);

  const loadMore = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        boutique_id: filters.boutique_id,
        page: String(page + 1),
      });
      if (filters.mois) params.set('mois', filters.mois);
      if (filters.statut) params.set('statut', filters.statut);

      const res = await fetch(`/api/cloture?${params.toString()}`);
      const json = (await res.json()) as { data?: ClotureCaisseJour[]; error?: string };
      const newItems = json.data ?? [];
      setItems((prev) => [...prev, ...newItems]);
      setPage((p) => p + 1);
      setHasMore(newItems.length === PAGE_SIZE);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  if (items.length === 0) {
    return (
      <p className="text-center text-xa-muted text-sm py-10">Aucune clôture trouvée</p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((c) => (
        <ClotureCard key={c.id} cloture={c} onClick={() => onSelectCloture(c)} />
      ))}
      {hasMore && (
        <button
          type="button"
          onClick={() => void loadMore()}
          disabled={loading}
          className="w-full py-3 text-sm text-xa-primary font-medium rounded-2xl border border-xa-border bg-xa-surface disabled:opacity-50"
        >
          {loading ? 'Chargement…' : 'Voir plus'}
        </button>
      )}
    </div>
  );
}
