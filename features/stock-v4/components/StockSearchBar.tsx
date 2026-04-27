'use client';

import { Search, ArrowUpDown } from 'lucide-react';
import type { SortMode } from '../types';

interface StockSearchBarProps {
  value: string;
  onChange: (v: string) => void;
  sortMode: SortMode;
  onSortChange: (s: SortMode) => void;
}

const SORT_CYCLE: SortMode[] = ['az', 'stock', 'valeur'];
const SORT_LABELS: Record<SortMode, string> = {
  az: 'A-Z',
  stock: 'Stock',
  valeur: 'Valeur',
};

export default function StockSearchBar({
  value,
  onChange,
  sortMode,
  onSortChange,
}: StockSearchBarProps) {
  function cycleSort() {
    const idx = SORT_CYCLE.indexOf(sortMode);
    onSortChange(SORT_CYCLE[(idx + 1) % SORT_CYCLE.length]);
  }

  return (
    <div className="v4-search-wrap">
      <div className="v4-search-inner">
        <Search size={14} strokeWidth={2} />
        <input
          type="search"
          placeholder="Rechercher un produit…"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label="Rechercher un produit"
        />
        <button
          type="button"
          className="v4-sort-pill"
          onClick={cycleSort}
          aria-label={`Trier par ${SORT_LABELS[sortMode]}`}
        >
          <ArrowUpDown size={10} />
          {SORT_LABELS[sortMode]}
        </button>
      </div>
    </div>
  );
}
