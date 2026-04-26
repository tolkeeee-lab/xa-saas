'use client';

import { Clock, Minus, Plus } from 'lucide-react';
import type { ProduitCatalogueAdmin } from '@/types/database';

type Props = {
  produit: ProduitCatalogueAdmin;
  qty: number;
  onAdd: () => void;
  onRemove: () => void;
};

export default function B2BProductCard({ produit, qty, onAdd, onRemove }: Props) {
  return (
    <div className="bg-xa-surface border border-xa-border rounded-2xl p-3 flex flex-col gap-2">
      <div className="flex flex-col gap-1">
        <span className="text-2xl">{produit.emoji}</span>
        <span className="font-medium text-sm text-xa-text leading-tight">{produit.nom}</span>
      </div>

      <div className="flex flex-col gap-0.5">
        <span className="font-bold text-sm text-xa-text">
          {produit.prix_b2b.toLocaleString('fr-FR')} FCFA
        </span>
        {produit.prix_conseille !== null && (
          <span className="line-through text-xa-muted text-xs">
            {produit.prix_conseille.toLocaleString('fr-FR')} FCFA
          </span>
        )}
      </div>

      <div className="flex items-center gap-1">
        <Clock size={12} className="text-xa-muted" />
        <span className="text-xa-muted text-xs">{produit.delai_livraison_h}h</span>
        {produit.stock_central > 0 && (
          <span
            className="ml-auto text-xs px-1.5 py-0.5 rounded-full"
            style={{ background: 'var(--xa-green)', color: '#fff' }}
          >
            En stock
          </span>
        )}
      </div>

      {/* Qty controls */}
      <div className="mt-auto flex items-center justify-end">
        {qty === 0 ? (
          <button
            type="button"
            onClick={onAdd}
            className="bg-xa-primary text-white rounded-full w-9 h-9 flex items-center justify-center"
            aria-label={`Ajouter ${produit.nom}`}
          >
            <Plus size={18} />
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRemove}
              className="bg-xa-primary text-white rounded-full w-8 h-8 flex items-center justify-center"
              aria-label="Diminuer"
            >
              <Minus size={16} />
            </button>
            <span className="font-semibold text-xa-text text-sm w-5 text-center">{qty}</span>
            <button
              type="button"
              onClick={onAdd}
              className="bg-xa-primary text-white rounded-full w-8 h-8 flex items-center justify-center"
              aria-label="Augmenter"
            >
              <Plus size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
