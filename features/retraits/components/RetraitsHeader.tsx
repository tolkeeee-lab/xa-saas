'use client';

import { Package } from 'lucide-react';
import type { Boutique } from '@/types/database';

type Props = {
  boutiques: Boutique[];
  activeBoutiqueId: string;
  onBoutiqueChange: (id: string) => void;
};

export default function RetraitsHeader({
  boutiques,
  activeBoutiqueId,
  onBoutiqueChange,
}: Props) {
  return (
    <div className="flex items-center gap-3 p-4 bg-xa-surface border-b border-xa-border">
      <Package size={20} className="text-xa-primary flex-shrink-0" />
      <span className="font-bold text-xa-text flex-1">Retraits clients</span>
      {boutiques.length > 1 && (
        <select
          value={activeBoutiqueId}
          onChange={(e) => onBoutiqueChange(e.target.value)}
          className="rounded-xl border border-xa-border bg-xa-bg text-xa-text px-3 py-2 text-sm"
        >
          {boutiques.map((b) => (
            <option key={b.id} value={b.id}>
              {b.nom}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
