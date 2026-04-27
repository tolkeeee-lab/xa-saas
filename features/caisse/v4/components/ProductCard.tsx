'use client';

import { useState, useCallback } from 'react';
import type { ProduitPublic } from '@/types/database';
import { formatFCFA } from '@/lib/format';
import { getCategoryEmoji } from '@/features/caisse/v3/lib/categoryEmoji';

interface ProductCardProps {
  produit: ProduitPublic;
  qty: number;
  onClick: () => void;
}

export default function ProductCard({ produit, qty, onClick }: ProductCardProps) {
  const [flash, setFlash] = useState(false);
  const isRupture = produit.stock_actuel === 0;
  const isLow = produit.stock_actuel > 0 && produit.stock_actuel <= 3;
  const emoji = getCategoryEmoji(produit.categorie);

  const handleClick = useCallback(() => {
    if (isRupture) return;
    onClick();
    setFlash(true);
    setTimeout(() => setFlash(false), 280);
  }, [isRupture, onClick]);

  const classNames = [
    'v4-pc',
    isRupture ? 'out' : '',
    qty > 0 ? 'sel' : '',
    flash ? 'flash' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type="button"
      className={classNames}
      onClick={handleClick}
      disabled={isRupture}
      aria-label={`${produit.nom} — ${formatFCFA(produit.prix_vente)}`}
      aria-disabled={isRupture}
      style={{ minHeight: 44 }}
    >
      {isRupture && <span className="v4-badge-rupture">RUPTURE</span>}
      {isLow && !isRupture && (
        <span className="v4-badge-low">⚠ {produit.stock_actuel}</span>
      )}
      {qty > 0 && <span className="v4-badge-qty">{qty}</span>}

      <span className="v4-pc-emoji" aria-hidden="true">
        {emoji}
      </span>
      <span className="v4-pc-name">{produit.nom}</span>
      <span className="v4-pc-price">{formatFCFA(produit.prix_vente)}</span>
    </button>
  );
}
