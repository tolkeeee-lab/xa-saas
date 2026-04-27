'use client';

import { getCategoryEmoji } from '../utils/categoryEmoji';

interface StockCatChipsProps {
  categories: string[];
  active: string;
  onChange: (c: string) => void;
}

export default function StockCatChips({ categories, active, onChange }: StockCatChipsProps) {
  const all = ['Toutes', ...categories];

  return (
    <div className="v4-cat-row" role="tablist" aria-label="Filtrer par catégorie">
      {all.map((cat) => (
        <button
          key={cat}
          type="button"
          role="tab"
          aria-selected={cat === active}
          className={`v4-cat-chip${cat === active ? ' active' : ''}`}
          onClick={() => onChange(cat)}
        >
          {cat === 'Toutes' ? cat : `${getCategoryEmoji(cat)} ${cat}`}
        </button>
      ))}
    </div>
  );
}
