'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import type { ProduitPublic } from '@/types/database';

interface EntreeStockModalProps {
  produit: ProduitPublic;
  boutiqueId: string;
  onClose: () => void;
  onSuccess: (newStock: number) => void;
}

export default function EntreeStockModal({
  produit,
  boutiqueId,
  onClose,
  onSuccess,
}: EntreeStockModalProps) {
  const [quantite, setQuantite] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const qty = Number(quantite);
  const isValid = !isNaN(qty) && qty > 0;
  const newStock = isValid ? produit.stock_actuel + qty : produit.stock_actuel;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isValid) {
      setError('La quantité doit être ≥ 1.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/stock/mouvements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          produit_id: produit.id,
          boutique_id: boutiqueId,
          type: 'reception',
          motif: 'autre',
          quantite: qty,
          note: note.trim() || undefined,
        }),
      });

      const data = (await res.json()) as { ok?: boolean; stock_apres?: number; error?: string };
      if (!res.ok) {
        setError(data.error ?? 'Erreur lors de la mise à jour.');
        return;
      }
      onSuccess(data.stock_apres ?? newStock);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="v4-modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="v4-modal-sheet" role="dialog" aria-modal="true" aria-labelledby="entree-title">
        <div className="v4-modal-handle" />

        <div className="v4-modal-header">
          <span className="v4-modal-title" id="entree-title">Entrée stock</span>
          <button
            type="button"
            className="v4-modal-close"
            onClick={onClose}
            aria-label="Fermer"
          >
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="v4-modal-body">
          <div className="v4-modal-produit-info">
            <div className="v4-modal-produit-nom">{produit.nom}</div>
            <div className="v4-modal-produit-stock">
              Stock actuel : <strong>{produit.stock_actuel} {produit.unite}</strong>
            </div>
          </div>

          {error && <div className="v4-modal-error">{error}</div>}

          <div className="v4-modal-field">
            <div className="v4-modal-label">Quantité à ajouter *</div>
            <input
              type="number"
              min="1"
              value={quantite}
              onChange={(e) => setQuantite(e.target.value)}
              required
              autoFocus
              className="v4-modal-input"
              placeholder="0"
              style={{ minHeight: 44 }}
            />
          </div>

          <div className="v4-modal-field">
            <div className="v4-modal-label">Note (optionnelle)</div>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="N° bon de livraison, commentaire…"
              className="v4-modal-input"
            />
          </div>

          {isValid && (
            <div className="v4-modal-preview">
              <span>{produit.stock_actuel}</span>
              <span>→</span>
              <strong>{newStock} {produit.unite}</strong>
            </div>
          )}

          <div className="v4-modal-actions">
            <button type="button" className="v4-btn-cancel" onClick={onClose}>
              Annuler
            </button>
            <button
              type="submit"
              className="v4-btn-confirm"
              disabled={loading || !isValid}
            >
              {loading ? 'Enregistrement…' : 'Confirmer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
