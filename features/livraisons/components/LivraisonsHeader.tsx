'use client';

import { Truck } from 'lucide-react';
import type { Boutique } from '@/types/database';

type Props = {
  boutiques: Boutique[];
  activeBoutiqueId: string;
  search: string;
  onBoutiqueChange: (v: string) => void;
  onSearchChange: (v: string) => void;
};

export default function LivraisonsHeader({
  boutiques,
  activeBoutiqueId,
  search,
  onBoutiqueChange,
  onSearchChange,
}: Props) {
  return (
    <div className="bg-xa-surface border-b border-xa-border">
      <div className="flex items-center gap-3 p-4 pb-2">
        <Truck size={20} className="text-xa-primary flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="font-bold text-xa-text block">Livraisons</span>
          <span className="text-xs text-xa-muted">Suivi des livraisons MAFRO</span>
        </div>
      </div>
      <div className="flex flex-col gap-2 px-4 pb-3">
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Rechercher une livraison…"
          className="w-full rounded-xl border border-xa-border bg-xa-bg text-xa-text text-sm px-3 py-2"
        />
        {boutiques.length > 1 && (
          <select
            value={activeBoutiqueId}
            onChange={(e) => onBoutiqueChange(e.target.value)}
            className="w-full rounded-xl border border-xa-border bg-xa-bg text-xa-text text-sm px-3 py-2"
          >
            <option value="">Toutes les boutiques</option>
            {boutiques.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nom}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}
