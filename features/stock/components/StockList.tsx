'use client';

import type { Produit } from '@/types/database';
import StockProductCard from './StockProductCard';
import StockEmptyState from './StockEmptyState';

type ModalAction = 'reception' | 'sortie' | 'transfert' | 'historique';

type Props = {
  produits: Produit[];
  tab: string;
  onAction: (produit: Produit, action: ModalAction) => void;
  onEditProduit: (produit: Produit) => void;
  onAddProduct: () => void;
};

export default function StockList({ produits, tab, onAction, onEditProduit, onAddProduct }: Props) {
  if (produits.length === 0) {
    return <StockEmptyState tab={tab} onAddProduct={onAddProduct} />;
  }

  return (
    <div className="flex flex-col gap-3 px-4 pb-24">
      {produits.map((p) => (
        <StockProductCard
          key={p.id}
          produit={p}
          onReception={() => onAction(p, 'reception')}
          onSortie={() => onAction(p, 'sortie')}
          onTransfert={() => onAction(p, 'transfert')}
          onHistorique={() => onAction(p, 'historique')}
          onClick={() => onEditProduit(p)}
        />
      ))}
    </div>
  );
}
