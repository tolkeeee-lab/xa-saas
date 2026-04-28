'use client';

import type { ProduitPublic } from '@/types/database';
import type { CartItem } from '@/features/caisse/v4/hooks/useCart';
import ProductCard from './ProductCard';

interface ProductGridProps {
  produits: ProduitPublic[];
  cartItems: CartItem[];
  onAdd: (p: ProduitPublic) => void;
  fetching?: boolean;
}

const SKELETON_COUNT = 12;

export default function ProductGrid({
  produits,
  cartItems,
  onAdd,
  fetching,
}: ProductGridProps) {
  if (fetching) {
    return (
      <div className="v4-pgrid">
        {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
          <div key={i} className="v4-pc-skeleton" aria-hidden="true" />
        ))}
      </div>
    );
  }

  if (produits.length === 0) {
    return (
      <div className="v4-empty">
        <p>Aucun produit trouvé</p>
      </div>
    );
  }

  return (
    <div className="v4-pgrid">
      {produits.map((p) => {
        const cartItem = cartItems.find((i) => i.produit_id === p.id);
        return (
          <ProductCard
            key={p.id}
            produit={p}
            qty={cartItem?.qty ?? 0}
            onClick={() => onAdd(p)}
          />
        );
      })}
    </div>
  );
}
