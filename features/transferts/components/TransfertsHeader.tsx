'use client';

import { ArrowLeftRight } from 'lucide-react';
import type { Boutique } from '@/types/database';

type Props = {
  boutiques: Boutique[];
  sourceFilter: string;
  destFilter: string;
  search: string;
  onSourceChange: (v: string) => void;
  onDestChange: (v: string) => void;
  onSearchChange: (v: string) => void;
};

export default function TransfertsHeader({
  boutiques,
  sourceFilter,
  destFilter,
  search,
  onSourceChange,
  onDestChange,
  onSearchChange,
}: Props) {
  return (
    <div className="bg-xa-surface border-b border-xa-border">
      <div className="flex items-center gap-3 p-4 pb-2">
        <ArrowLeftRight size={20} className="text-xa-primary flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="font-bold text-xa-text block">Transferts</span>
          <span className="text-xs text-xa-muted">Transferts de stock inter-boutiques</span>
        </div>
      </div>
      <div className="flex flex-col gap-2 px-4 pb-3">
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Rechercher un produit…"
          className="w-full rounded-xl border border-xa-border bg-xa-bg text-xa-text text-sm px-3 py-2"
        />
        {boutiques.length > 1 && (
          <div className="flex gap-2">
            <select
              value={sourceFilter}
              onChange={(e) => onSourceChange(e.target.value)}
              className="flex-1 min-w-0 rounded-xl border border-xa-border bg-xa-bg text-xa-text text-sm px-3 py-2"
            >
              <option value="">Toutes sources</option>
              {boutiques.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nom}
                </option>
              ))}
            </select>
            <select
              value={destFilter}
              onChange={(e) => onDestChange(e.target.value)}
              className="flex-1 min-w-0 rounded-xl border border-xa-border bg-xa-bg text-xa-text text-sm px-3 py-2"
            >
              <option value="">Toutes dest.</option>
              {boutiques.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nom}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
