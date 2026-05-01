'use client';

import { getCategoryEmoji } from '../utils/categoryEmoji';

interface CategoryChipsProps {
  categories: string[];
  active: string;
  onChange: (c: string) => void;
}

export default function CategoryChips({
  categories,
  active,
  onChange,
}: CategoryChipsProps) {
  return (
    <div className="v4-cat-row" role="tablist" aria-label="Filtrer par catégorie">
      {categories.map((cat) => (
        <button
          key={cat}
          type="button"
          role="tab"
          aria-selected={cat === active}
          className={`v4-cat-chip${cat === active ? ' active' : ''}`}
          onClick={() => onChange(cat)}
          style={{ minHeight: 44 }}
        >
          {cat === 'Tout' ? '🏪 Tout' : `${getCategoryEmoji(cat)} ${cat}`}
        </button>
      ))}
    </div>
  );
}
