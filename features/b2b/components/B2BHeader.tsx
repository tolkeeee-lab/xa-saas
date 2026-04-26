'use client';

import { Search, ShoppingBag } from 'lucide-react';
import type { Boutique } from '@/types/database';

type Props = {
  boutiques: Boutique[];
  activeBoutiqueId: string;
  onBoutiqueChange: (id: string) => void;
  search: string;
  onSearchChange: (s: string) => void;
  filterCategorie: string;
  onFilterCategorie: (c: string) => void;
  categories: string[];
  panierCount: number;
  onPanierOpen: () => void;
};

export default function B2BHeader({
  boutiques,
  activeBoutiqueId,
  onBoutiqueChange,
  search,
  onSearchChange,
  filterCategorie,
  onFilterCategorie,
  categories,
  panierCount,
  onPanierOpen,
}: Props) {
  return (
    <div className="flex flex-col gap-3 p-4 bg-xa-surface border-b border-xa-border">
      {/* Row 1: title + boutique selector + cart */}
      <div className="flex items-center gap-3">
        <span className="font-bold text-xa-text flex-1">Commander MAFRO</span>
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
        <button
          type="button"
          onClick={onPanierOpen}
          className="relative p-2 rounded-xl bg-xa-bg border border-xa-border text-xa-text"
          aria-label="Ouvrir le panier"
        >
          <ShoppingBag size={20} />
          {panierCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-xa-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
              {panierCount}
            </span>
          )}
        </button>
      </div>

      {/* Row 2: search */}
      <div className="flex items-center gap-2 rounded-xl border border-xa-border bg-xa-bg px-3 py-2">
        <Search size={16} className="text-xa-muted flex-shrink-0" />
        <input
          type="text"
          placeholder="Rechercher un produit…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="flex-1 bg-transparent text-xa-text text-sm outline-none placeholder:text-xa-muted"
        />
      </div>

      {/* Row 3: category pills */}
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {(['', ...categories] as string[]).map((cat) => (
          <button
            key={cat || '__all__'}
            type="button"
            onClick={() => onFilterCategorie(cat)}
            className={`flex-shrink-0 rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              filterCategorie === cat
                ? 'bg-xa-primary text-white'
                : 'bg-xa-bg text-xa-muted border border-xa-border'
            }`}
          >
            {cat || 'Tous'}
          </button>
        ))}
      </div>
    </div>
  );
}
