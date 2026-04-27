'use client';

import { Search } from 'lucide-react';
import type { SortMode } from '../types';

interface StockSearchBarProps {
  value: string;
  onChange: (v: string) => void;
  sortMode: SortMode;
  onSortChange: (s: SortMode) => void;
}

const SORT_OPTIONS: { id: SortMode; label: string }[] = [
  { id: 'az', label: 'A-Z' },
  { id: 'stock', label: 'Stock' },
  { id: 'valeur', label: 'Valeur' },
];

export default function StockSearchBar({
  value,
  onChange,
  sortMode,
  onSortChange,
}: StockSearchBarProps) {
  return (
    <>
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
        </div>
      </div>
      <div className="v4-sort-row">
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            className={`v4-sort-btn${sortMode === opt.id ? ' active' : ''}`}
            onClick={() => onSortChange(opt.id)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </>
  );
}
