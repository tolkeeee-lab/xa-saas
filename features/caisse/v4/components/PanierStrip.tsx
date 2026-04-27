'use client';

import { X } from 'lucide-react';
import type { CartItem } from '@/features/caisse/v3/useCart';

interface PanierStripProps {
  items: CartItem[];
  onRemove: (id: string) => void;
  onClear: () => void;
}

export default function PanierStrip({ items, onRemove, onClear }: PanierStripProps) {
  if (items.length === 0) return null;

  return (
    <div className="v4-panier-strip show">
      <div className="v4-panier-pills">
        {items.map((item) => (
          <button
            key={item.produit_id}
            type="button"
            className="v4-panier-pill"
            onClick={() => onRemove(item.produit_id)}
            aria-label={`Retirer ${item.nom} du panier`}
            style={{ minHeight: 44 }}
          >
            <span>{item.emoji}</span>
            <span className="v4-pill-name">{item.nom}</span>
            {item.qty > 1 && <span className="v4-pill-qty">×{item.qty}</span>}
            <X size={10} />
          </button>
        ))}
      </div>
      <button
        type="button"
        className="v4-panier-clear"
        onClick={onClear}
        aria-label="Vider le panier"
        style={{ minHeight: 44 }}
      >
        Vider
      </button>
    </div>
  );
}
