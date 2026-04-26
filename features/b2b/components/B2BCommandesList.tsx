'use client';

import { useEffect, useState, useCallback } from 'react';
import { Package } from 'lucide-react';
import type { Boutique, CommandeB2B } from '@/types/database';
import B2BCommandeCard from '@/features/b2b/components/B2BCommandeCard';

type Props = {
  boutiques: Boutique[];
  activeBoutiqueId: string;
  onSelectCommande: (id: string) => void;
};

export default function B2BCommandesList({
  boutiques: _boutiques,
  activeBoutiqueId,
  onSelectCommande,
}: Props) {
  const [commandes, setCommandes] = useState<CommandeB2B[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchCommandes = useCallback(
    async (p: number) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ page: String(p) });
        if (activeBoutiqueId) params.set('boutique_id', activeBoutiqueId);
        const res = await fetch(`/api/b2b/commandes?${params.toString()}`);
        if (!res.ok) {
          const d = (await res.json()) as { error?: string };
          setError(d.error ?? 'Erreur de chargement');
          return;
        }
        const d = (await res.json()) as {
          data: CommandeB2B[];
          total: number;
          page: number;
        };
        if (p === 1) setCommandes(d.data);
        else setCommandes((prev) => [...prev, ...d.data]);
        setTotal(d.total);
      } catch {
        setError('Erreur réseau');
      } finally {
        setLoading(false);
      }
    },
    [activeBoutiqueId],
  );

  useEffect(() => {
    setPage(1);
    setCommandes([]);
    fetchCommandes(1);
  }, [fetchCommandes]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchCommandes(nextPage);
  };

  if (loading && commandes.length === 0) {
    return (
      <div className="flex flex-col gap-3 p-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="animate-pulse bg-xa-surface rounded-2xl h-20" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-xa-muted gap-3">
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }

  if (commandes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-xa-muted gap-3">
        <Package size={40} className="opacity-40" />
        <p className="text-sm">Aucune commande</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      {commandes.map((commande) => (
        <B2BCommandeCard
          key={commande.id}
          commande={commande}
          onClick={() => onSelectCommande(commande.id)}
        />
      ))}
      {commandes.length < total && (
        <button
          type="button"
          onClick={loadMore}
          disabled={loading}
          className="bg-xa-bg border border-xa-border rounded-xl py-2 text-sm text-xa-muted hover:text-xa-text transition-colors disabled:opacity-50"
        >
          {loading ? 'Chargement…' : 'Voir plus'}
        </button>
      )}
    </div>
  );
}
