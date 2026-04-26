'use client';

import { X, Minus, Plus } from 'lucide-react';
import type { ProduitCatalogueAdmin } from '@/types/database';

type Props = {
  panier: Map<string, number>;
  catalogue: ProduitCatalogueAdmin[];
  onClose: () => void;
  onQtyChange: (id: string, qty: number) => void;
  onConfirm: () => void;
  boutiqueName: string;
};

export default function B2BPanier({
  panier,
  catalogue,
  onClose,
  onQtyChange,
  onConfirm,
  boutiqueName,
}: Props) {
  const produitMap = new Map(catalogue.map((p) => [p.id, p]));

  const items = Array.from(panier.entries())
    .map(([id, qty]) => ({ id, qty, produit: produitMap.get(id) }))
    .filter(
      (item): item is { id: string; qty: number; produit: ProduitCatalogueAdmin } =>
        item.produit !== undefined,
    );

  const total = items.reduce((sum, { qty, produit }) => sum + qty * produit.prix_b2b, 0);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-30 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Bottom sheet */}
      <div className="fixed inset-x-0 bottom-0 z-40 max-h-[85vh] bg-xa-surface rounded-t-2xl shadow-xl overflow-y-auto">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-xa-border">
          <div className="flex-1">
            <h2 className="font-bold text-xa-text">Panier</h2>
            <p className="text-xs text-xa-muted">{boutiqueName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xa-muted hover:text-xa-text"
            aria-label="Fermer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Items */}
        <div className="p-4 flex flex-col gap-3">
          {items.length === 0 ? (
            <p className="text-xa-muted text-sm text-center py-8">Votre panier est vide</p>
          ) : (
            items.map(({ id, qty, produit }) => (
              <div key={id} className="flex items-center gap-3">
                <span className="text-xl">{produit.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-xa-text truncate">{produit.nom}</p>
                  <p className="text-xs text-xa-muted">
                    {(qty * produit.prix_b2b).toLocaleString('fr-FR')} FCFA
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onQtyChange(id, qty - 1)}
                    className="bg-xa-primary text-white rounded-full w-7 h-7 flex items-center justify-center"
                    aria-label="Diminuer"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-5 text-center text-sm font-semibold text-xa-text">{qty}</span>
                  <button
                    type="button"
                    onClick={() => onQtyChange(id, qty + 1)}
                    className="bg-xa-primary text-white rounded-full w-7 h-7 flex items-center justify-center"
                    aria-label="Augmenter"
                  >
                    <Plus size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onQtyChange(id, 0)}
                    className="ml-1 text-xa-muted hover:text-xa-text"
                    aria-label="Supprimer"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-xa-border bg-xa-surface">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xa-muted text-sm">Total</span>
            <span className="font-bold text-xa-text">{total.toLocaleString('fr-FR')} FCFA</span>
          </div>
          <button
            type="button"
            onClick={onConfirm}
            disabled={items.length === 0}
            className="bg-xa-primary text-white rounded-xl px-4 py-3 w-full font-semibold disabled:opacity-50"
          >
            Confirmer la commande
          </button>
        </div>
      </div>
    </>
  );
}
