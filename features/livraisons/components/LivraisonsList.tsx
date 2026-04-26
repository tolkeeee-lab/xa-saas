'use client';

import { Package } from 'lucide-react';
import type { Livraison } from '@/types/database';
import LivraisonCard from '@/features/livraisons/components/LivraisonCard';

type Props = {
  livraisons: Livraison[];
  loading: boolean;
  total: number;
  onSelect: (l: Livraison) => void;
  onLoadMore: () => void;
};

export default function LivraisonsList({
  livraisons,
  loading,
  total,
  onSelect,
  onLoadMore,
}: Props) {
  if (loading && livraisons.length === 0) {
    return (
      <div className="flex flex-col gap-3 p-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="animate-pulse bg-xa-surface rounded-2xl h-20" />
        ))}
      </div>
    );
  }

  if (livraisons.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-xa-muted gap-3">
        <Package size={40} className="opacity-40" />
        <p className="text-sm">Aucune livraison</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      {livraisons.map((l) => (
        <LivraisonCard key={l.id} livraison={l} onClick={() => onSelect(l)} />
      ))}
      {livraisons.length < total && (
        <button
          type="button"
          onClick={onLoadMore}
          disabled={loading}
          className="w-full py-3 text-sm text-xa-primary font-medium border border-xa-border rounded-2xl hover:bg-xa-surface transition-colors disabled:opacity-50 min-h-[44px]"
        >
          {loading ? 'Chargement…' : 'Voir plus'}
        </button>
      )}
    </div>
  );
}
