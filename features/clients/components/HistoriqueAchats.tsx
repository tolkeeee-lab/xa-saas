'use client';

import { useState, useEffect } from 'react';
import { ShoppingBag } from 'lucide-react';
import { formatFCFA } from '@/lib/format';
import type { Transaction } from '@/types/database';

type Props = {
  clientId: string;
};

type HistoriqueResponse = {
  data: Transaction[];
  total: number;
  page: number;
  perPage: number;
};

const MODE_LABELS: Record<string, string> = {
  especes: 'Espèces',
  momo: 'Mobile Money',
  carte: 'Carte',
  credit: 'Crédit',
};

export default function HistoriqueAchats({ clientId }: Props) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    setTransactions([]);
    setPage(1);
    load(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  async function load(p: number, append: boolean) {
    if (p === 1) setLoading(true);
    else setLoadingMore(true);
    try {
      const res = await fetch(`/api/clients/${clientId}/historique?page=${p}&per_page=10`);
      const json = (await res.json()) as HistoriqueResponse;
      setTransactions((prev) => (append ? [...prev, ...(json.data ?? [])] : (json.data ?? [])));
      setTotal(json.total ?? 0);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  function loadMore() {
    const next = page + 1;
    setPage(next);
    load(next, true);
  }

  const hasMore = transactions.length < total;

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-12 rounded-lg bg-xa-border/30 animate-pulse" />
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <p className="text-xs text-xa-muted text-center py-4">
        Aucune transaction trouvée pour ce client.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {transactions.map((tx) => (
        <div
          key={tx.id}
          className="flex items-center justify-between py-2 border-b border-xa-border last:border-0"
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-xa-primary/10 flex items-center justify-center flex-shrink-0">
              <ShoppingBag size={14} className="text-xa-primary" />
            </div>
            <div>
              <p className="text-xs font-semibold text-xa-text">
                {MODE_LABELS[tx.mode_paiement] ?? tx.mode_paiement}
              </p>
              <p className="text-xs text-xa-muted">
                {new Date(tx.created_at).toLocaleDateString('fr-FR')}
              </p>
            </div>
          </div>
          <p className="text-sm font-bold text-xa-text">{formatFCFA(tx.montant_total)}</p>
        </div>
      ))}
      {hasMore && (
        <button
          type="button"
          onClick={loadMore}
          disabled={loadingMore}
          className="w-full py-2 text-xs text-xa-primary font-semibold hover:underline disabled:opacity-40"
        >
          {loadingMore ? 'Chargement…' : 'Voir plus'}
        </button>
      )}
    </div>
  );
}
