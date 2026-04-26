'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Boutique, Livraison } from '@/types/database';
import LivraisonsHeader from '@/features/livraisons/components/LivraisonsHeader';
import LivraisonsTabs, { type LivraisonsTab } from '@/features/livraisons/components/LivraisonsTabs';
import LivraisonsList from '@/features/livraisons/components/LivraisonsList';
import LivraisonDetailModal from '@/features/livraisons/modals/LivraisonDetailModal';

type Counts = {
  en_cours: number;
  livrees: number;
  retournees: number;
};

type Props = {
  boutiques: Boutique[];
  initialBoutiqueId: string;
};

export default function LivraisonsScreen({ boutiques, initialBoutiqueId }: Props) {
  const [tab, setTab] = useState<LivraisonsTab>('en_cours');
  const [activeBoutiqueId, setActiveBoutiqueId] = useState(initialBoutiqueId);
  const [search, setSearch] = useState('');

  const [livraisons, setLivraisons] = useState<Livraison[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [counts, setCounts] = useState<Counts>({ en_cours: 0, livrees: 0, retournees: 0 });

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const loadLivraisons = useCallback(
    async (currentTab: LivraisonsTab, boutiqueId: string, q: string, p: number) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ tab: currentTab, page: String(p) });
        if (boutiqueId) params.set('boutique_id', boutiqueId);
        if (q) params.set('search', q);

        const res = await fetch(`/api/livraisons?${params.toString()}`);
        const json = (await res.json()) as {
          data?: Livraison[];
          total?: number;
          error?: string;
        };

        if (p === 1) {
          setLivraisons(json.data ?? []);
        } else {
          setLivraisons((prev: Livraison[]) => [...prev, ...(json.data ?? [])]);
        }
        setTotal(json.total ?? 0);
      } catch {
        setLivraisons([]);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const loadCounts = useCallback(async (boutiqueId: string) => {
    try {
      const params = new URLSearchParams();
      if (boutiqueId) params.set('boutique_id', boutiqueId);
      const res = await fetch(`/api/livraisons/stats?${params.toString()}`);
      const json = (await res.json()) as Counts & { error?: string };
      if (!json.error) setCounts(json);
    } catch {
      // ignore
    }
  }, []);

  // Reload on tab/boutique/search change
  useEffect(() => {
    setPage(1);
    void loadLivraisons(tab, activeBoutiqueId, search, 1);
    void loadCounts(activeBoutiqueId);
  }, [tab, activeBoutiqueId, search, loadLivraisons, loadCounts]);

  function handleLoadMore() {
    const nextPage = page + 1;
    setPage(nextPage);
    void loadLivraisons(tab, activeBoutiqueId, search, nextPage);
  }

  function handleModalClose() {
    setSelectedId(null);
    // Refresh counts after closing modal (statut may have changed)
    void loadCounts(activeBoutiqueId);
    setPage(1);
    void loadLivraisons(tab, activeBoutiqueId, search, 1);
  }

  return (
    <div className="flex flex-col min-h-screen bg-xa-bg">
      <LivraisonsHeader
        boutiques={boutiques}
        activeBoutiqueId={activeBoutiqueId}
        search={search}
        onBoutiqueChange={(v) => { setActiveBoutiqueId(v); }}
        onSearchChange={(v) => { setSearch(v); }}
      />

      <LivraisonsTabs active={tab} onChange={setTab} counts={counts} />

      <div className="flex-1 overflow-y-auto pb-24">
        <LivraisonsList
          livraisons={livraisons}
          loading={loading}
          total={total}
          onSelect={(l) => setSelectedId(l.id)}
          onLoadMore={handleLoadMore}
        />
      </div>

      {selectedId && (
        <LivraisonDetailModal livraisonId={selectedId} onClose={handleModalClose} />
      )}
    </div>
  );
}
