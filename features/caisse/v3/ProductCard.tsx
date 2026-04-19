'use client';

import { useState, useCallback } from 'react';
import type { ProduitPublic } from '@/types/database';
import { formatFCFA } from '@/lib/format';
import { getCategoryEmoji } from './lib/categoryEmoji';

interface ProductCardProps {
  produit: ProduitPublic;
  onAdd: () => void;
}

export default function ProductCard({ produit, onAdd }: ProductCardProps) {
  const [flash, setFlash] = useState(false);
  const isRupture = produit.stock_actuel === 0;
  const isLow = produit.stock_actuel > 0 && produit.stock_actuel <= 5;
  const emoji = getCategoryEmoji(produit.categorie);

  const handleClick = useCallback(() => {
    if (isRupture) return;
    onAdd();
    setFlash(true);
    setTimeout(() => setFlash(false), 280);
  }, [isRupture, onAdd]);

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isRupture}
      className={`c-product-card${isRupture ? ' disabled' : ''}${flash ? ' flash' : ''}`}
      aria-label={`Ajouter ${produit.nom} au panier — ${formatFCFA(produit.prix_vente)}`}
      aria-disabled={isRupture}
    >
      {/* Out-of-stock badge */}
      {isRupture && (
        <span className="badge-rupture" aria-label="Rupture de stock">
          RUPTURE
        </span>
      )}

      {/* Hover add indicator */}
      {!isRupture && (
        <span className="add-btn" aria-hidden="true">+</span>
      )}

      <span className="emoji" aria-hidden="true">{emoji}</span>
      <span className="name">{produit.nom}</span>
      {produit.unite && (
        <span className="unit">{produit.unite}</span>
      )}

      {/* Low stock warning */}
      {isLow && (
        <span className="badge-low" aria-label={`Seulement ${produit.stock_actuel} en stock`}>
          ⚠ {produit.stock_actuel} restant{produit.stock_actuel > 1 ? 's' : ''}
        </span>
      )}

      <span className="price">{formatFCFA(produit.prix_vente)}</span>
    </button>
  );
}
