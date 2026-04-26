'use client';

import { Search, SlidersHorizontal, Store } from 'lucide-react';
import type { Boutique } from '@/types/database';

type Props = {
  boutiques: Boutique[];
  activeBoutiqueId: string;
  onBoutiqueChange: (id: string) => void;
  search: string;
  onSearchChange: (v: string) => void;
};

export default function StockHeader({
  boutiques,
  activeBoutiqueId,
  onBoutiqueChange,
  search,
  onSearchChange,
}: Props) {
  const activeBoutique = boutiques.find((b) => b.id === activeBoutiqueId);

  return (
    <div className="flex flex-col gap-3 px-4 pt-4 pb-2">
      {/* Row 1: boutique selector + title */}
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-lg font-bold text-xa-text leading-tight">Stock local</h1>

        {boutiques.length > 1 ? (
          <select
            value={activeBoutiqueId}
            onChange={(e) => onBoutiqueChange(e.target.value)}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-xa-border bg-xa-bg text-xa-text focus:outline-none focus:ring-2 focus:ring-xa-primary"
            style={{ maxWidth: 160 }}
          >
            {boutiques.filter((b) => b.est_actif !== false).map((b) => (
              <option key={b.id} value={b.id}>{b.nom}</option>
            ))}
          </select>
        ) : (
          activeBoutique && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-xa-bg2 text-xa-muted">
              <Store size={13} />
              {activeBoutique.nom}
            </span>
          )
        )}
      </div>

      {/* Row 2: search */}
      <div className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-xa-muted pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Rechercher un produit…"
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary"
            style={{ minHeight: 40 }}
          />
        </div>
        <button
          type="button"
          title="Filtres avancés"
          className="flex items-center justify-center rounded-lg border border-xa-border bg-xa-bg text-xa-muted hover:text-xa-text hover:bg-xa-bg2 transition-colors"
          style={{ width: 40, height: 40 }}
          aria-label="Filtres avancés"
        >
          <SlidersHorizontal size={16} />
        </button>
      </div>
    </div>
  );
}
