'use client';

import { Search, ScanLine } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (v: string) => void;
  onScan?: () => void;
}

export default function SearchBar({ value, onChange, onScan }: SearchBarProps) {
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
        {onScan && (
          <button
            type="button"
            className="v4-scan-btn"
            onClick={onScan}
            aria-label="Scanner un code-barres"
            style={{ minHeight: 44 }}
          >
            <ScanLine size={11} strokeWidth={2} />
            SCAN
          </button>
        )}
      </div>
    </div>
  );
}
