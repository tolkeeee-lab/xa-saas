'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Client } from '@/types/database';
import ClientsHeader from '@/features/clients/components/ClientsHeader';
import ClientsTabs, {
  type ClientsTab,
  computeTabCounts,
} from '@/features/clients/components/ClientsTabs';
import ClientStats from '@/features/clients/components/ClientStats';
import ClientsList from '@/features/clients/components/ClientsList';
import ClientFormModal from '@/features/clients/modals/ClientFormModal';
import ClientDetailModal from '@/features/clients/modals/ClientDetailModal';

type SortField = 'nom' | 'derniere_visite_at' | 'total_achats';

type ClientsResponse = {
  data: Client[];
  total: number;
  page: number;
  pageSize: number;
};

type StatsResponse = {
  tous: number;
  avec_credit: number;
  opt_in_whatsapp: number;
  inactifs: number;
};

export default function ClientsScreen() {
  const [clients, setClients] = useState<Client[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [tab, setTab] = useState<ClientsTab>('tous');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortField>('nom');
  const [stats, setStats] = useState<StatsResponse>({
    tous: 0,
    avec_credit: 0,
    opt_in_whatsapp: 0,
    inactifs: 0,
  });

  const [formModal, setFormModal] = useState<{ mode: 'create' | 'edit'; client?: Client } | null>(
    null,
  );
  const [detailClient, setDetailClient] = useState<Client | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  // Debounce search
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [search]);

  const loadClients = useCallback(
    async (currentTab: ClientsTab, q: string, currentSort: SortField, p: number, append: boolean) => {
      if (!append) setLoading(true);
      try {
        const params = new URLSearchParams({
          tab: currentTab,
          sort: currentSort,
          page: String(p),
        });
        if (q) params.set('q', q);
        const res = await fetch(`/api/clients?${params.toString()}`);
        const json = (await res.json()) as ClientsResponse;
        setClients((prev: Client[]) => (append ? [...prev, ...(json.data ?? [])] : (json.data ?? [])));
        setTotal(json.total ?? 0);
      } catch {
        if (!append) setClients([]);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const loadStats = useCallback(async () => {
    try {
      const res = await fetch('/api/clients/stats');
      const json = (await res.json()) as StatsResponse;
      setStats(json);
    } catch {
      // ignore
    }
  }, []);

  // Reset page and reload on filter changes
  useEffect(() => {
    setPage(1);
    setClients([]);
    loadClients(tab, debouncedSearch, sort, 1, false);
  }, [tab, debouncedSearch, sort, loadClients]);

  // Load stats on mount
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  function handleLoadMore() {
    const next = page + 1;
    setPage(next);
    loadClients(tab, debouncedSearch, sort, next, true);
  }

  function handleTabChange(t: ClientsTab) {
    setTab(t);
  }

  function handleClientSaved(saved: Client) {
    setFormModal(null);
    if (formModal?.mode === 'create') {
      setClients((prev: Client[]) => [saved, ...prev]);
      setTotal((n: number) => n + 1);
      showToast('Client créé avec succès', 'success');
    } else {
      setClients((prev: Client[]) => prev.map((c: Client) => (c.id === saved.id ? saved : c)));
      if (detailClient?.id === saved.id) setDetailClient(saved);
      showToast('Client modifié', 'success');
    }
    loadStats();
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/clients/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const j = (await res.json()) as { error?: string };
        showToast(j.error ?? 'Erreur', 'error');
        return;
      }
      setClients((prev: Client[]) => prev.filter((c: Client) => c.id !== id));
      setTotal((n: number) => n - 1);
      if (detailClient?.id === id) setDetailClient(null);
      showToast('Client supprimé', 'success');
      loadStats();
    } finally {
      setConfirmDeleteId(null);
    }
  }

  const tabCounts = computeTabCounts(clients);
  // Use stats from API when loaded, fallback to local counts only if null/undefined
  const finalCounts: Record<ClientsTab, number> = {
    tous: stats.tous ?? tabCounts.tous,
    avec_credit: stats.avec_credit ?? tabCounts.avec_credit,
    opt_in_whatsapp: stats.opt_in_whatsapp ?? tabCounts.opt_in_whatsapp,
    inactifs: stats.inactifs ?? tabCounts.inactifs,
  };

  const hasMore = clients.length < total;

  return (
    <>
      {/* Toast */}
      {toast && (
        <div
          className="fixed top-4 right-4 z-[60] px-4 py-3 rounded-lg font-semibold text-sm text-white shadow-lg"
          style={{ background: toast.type === 'success' ? '#00d68f' : '#ff3341' }}
        >
          {toast.type === 'success' ? '✅' : '❌'} {toast.message}
        </div>
      )}

      <div className="min-h-screen bg-xa-bg">
        {/* Header */}
        <ClientsHeader
          search={search}
          onSearchChange={setSearch}
          sort={sort}
          onSortChange={setSort}
          onNewClient={() => setFormModal({ mode: 'create' })}
        />

        {/* Tabs */}
        <ClientsTabs active={tab} onChange={handleTabChange} counts={finalCounts} />

        {/* Stats strip */}
        <ClientStats
          total={stats.tous}
          opt_in={stats.opt_in_whatsapp}
          avec_credit={stats.avec_credit}
          inactifs={stats.inactifs}
        />

        {/* List */}
        <ClientsList
          clients={clients}
          loading={loading}
          onClientClick={(c) => setDetailClient(c)}
          onLoadMore={handleLoadMore}
          hasMore={hasMore}
        />
      </div>

      {/* Form modal */}
      {formModal && (
        <ClientFormModal
          mode={formModal.mode}
          client={formModal.client}
          onClose={() => setFormModal(null)}
          onSaved={handleClientSaved}
        />
      )}

      {/* Detail modal */}
      {detailClient && !formModal && confirmDeleteId !== detailClient.id && (
        <ClientDetailModal
          client={detailClient}
          onClose={() => setDetailClient(null)}
          onEdit={() => setFormModal({ mode: 'edit', client: detailClient })}
          onDelete={() => {
            setDetailClient(null);
            setConfirmDeleteId(detailClient.id);
          }}
        />
      )}

      {/* Confirm delete */}
      {confirmDeleteId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setConfirmDeleteId(null);
          }}
        >
          <div className="bg-xa-surface border border-xa-border rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <h3 className="text-base font-bold text-xa-text mb-2">Supprimer ce client ?</h3>
            <p className="text-sm text-xa-muted mb-5">
              Cette action est irréversible. L&apos;historique d&apos;achats sera conservé.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 py-2.5 rounded-xl border border-xa-border text-xa-text text-sm font-medium"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => handleDelete(confirmDeleteId)}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
