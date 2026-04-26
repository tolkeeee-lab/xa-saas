'use client';

import { Calculator } from 'lucide-react';
import type { Boutique } from '@/types/database';

type Props = {
  boutiques: Boutique[];
  activeBoutiqueId: string;
  onBoutiqueChange: (id: string) => void;
  date: string;
};

export default function ClotureHeader({
  boutiques,
  activeBoutiqueId,
  onBoutiqueChange,
  date,
}: Props) {
  const today = new Date(date);
  const dateLabel = today.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="flex items-center gap-3 p-4 bg-xa-surface border-b border-xa-border">
      <Calculator size={20} className="text-xa-primary flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <span className="font-bold text-xa-text block">Clôture caisse</span>
        <span className="text-xs text-xa-muted capitalize">{dateLabel}</span>
      </div>
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
