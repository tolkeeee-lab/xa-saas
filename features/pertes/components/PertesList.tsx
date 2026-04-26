'use client';

import type { PerteDeclaration } from '@/types/database';
import PerteCard from './PerteCard';

type Props = {
  pertes: PerteDeclaration[];
  loading: boolean;
  onSelect: (perte: PerteDeclaration) => void;
};

export default function PertesList({ pertes, loading, onSelect }: Props) {
  if (loading) {
    return (
      <div className="flex flex-col gap-3 p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-2xl bg-xa-surface border border-xa-border animate-pulse" />
        ))}
      </div>
    );
  }

  if (pertes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="text-4xl mb-3">📋</div>
        <p className="text-xa-text font-medium mb-1">Aucune perte déclarée</p>
        <p className="text-xa-muted text-sm">
          Appuyez sur &ldquo;Déclarer une perte&rdquo; pour commencer.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      {pertes.map((p) => (
        <PerteCard key={p.id} perte={p} onClick={() => onSelect(p)} />
      ))}
    </div>
  );
}
