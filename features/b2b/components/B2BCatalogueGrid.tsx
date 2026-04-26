'use client';

import { Package } from 'lucide-react';
import type { ProduitCatalogueAdmin } from '@/types/database';
import B2BProductCard from '@/features/b2b/components/B2BProductCard';

type Props = {
  produits: ProduitCatalogueAdmin[];
  panier: Map<string, number>;
  onAdd: (id: string) => void;
  onRemove: (id: string) => void;
  loading: boolean;
};

export default function B2BCatalogueGrid({
  produits,
  panier,
  onAdd,
  onRemove,
  loading,
}: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="animate-pulse bg-xa-surface rounded-2xl h-40" />
        ))}
      </div>
    );
  }

  if (produits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-xa-muted gap-3">
        <Package size={40} className="opacity-40" />
        <p className="text-sm">Aucun produit trouvé</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 p-4">
      {produits.map((produit) => (
        <B2BProductCard
          key={produit.id}
          produit={produit}
          qty={panier.get(produit.id) ?? 0}
          onAdd={() => onAdd(produit.id)}
          onRemove={() => onRemove(produit.id)}
        />
      ))}
    </div>
  );
}
