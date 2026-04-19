'use client';

import type { CartItem } from './useCart';
import { formatFCFA } from '@/lib/format';

interface CartItemRowProps {
  item: CartItem;
  onUpdate: (produit_id: string, delta: number) => void;
  onRemove: (produit_id: string) => void;
}

export default function CartItemRow({ item, onUpdate, onRemove }: CartItemRowProps) {
  return (
    <div className="c-cart-item" role="listitem">
      <span className="ci-emoji" aria-hidden="true">{item.emoji}</span>

      <div className="ci-info">
        <p className="ci-name" title={item.nom}>{item.nom}</p>
        <p className="ci-unit-price">
          {item.unite} · {formatFCFA(item.prix_vente)} /u
        </p>
      </div>

      {/* Qty controls */}
      <div className="c-qty-row" aria-label={`Quantité de ${item.nom}`}>
        <button
          type="button"
          className="c-qty-btn"
          onClick={() => onUpdate(item.produit_id, -1)}
          aria-label={`Diminuer la quantité de ${item.nom}`}
        >
          −
        </button>
        <span className="c-qty-val">{item.qty}</span>
        <button
          type="button"
          className="c-qty-btn"
          onClick={() => onUpdate(item.produit_id, 1)}
          disabled={item.qty >= item.stock_actuel}
          aria-label={`Augmenter la quantité de ${item.nom}`}
        >
          +
        </button>
      </div>

      <span className="ci-total">{formatFCFA(item.prix_vente * item.qty)}</span>

      <button
        type="button"
        className="c-remove-btn"
        onClick={() => onRemove(item.produit_id)}
        aria-label={`Retirer ${item.nom} du panier`}
      >
        ×
      </button>
    </div>
  );
}
