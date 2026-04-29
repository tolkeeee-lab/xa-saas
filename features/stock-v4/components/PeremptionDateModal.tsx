'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import type { ProduitPublic } from '@/types/database';

interface PeremptionDateModalProps {
  produit: ProduitPublic;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PeremptionDateModal({
  produit,
  onClose,
  onSuccess,
}: PeremptionDateModalProps) {
  const [dateValue, setDateValue] = useState(
    produit.date_peremption ? produit.date_peremption.substring(0, 10) : '',
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/produits/${produit.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date_peremption: dateValue || null }),
    });

    setLoading(false);

    if (res.ok) {
      onSuccess();
    } else {
      const err = await res.json();
      setError(err.error ?? 'Erreur lors de la mise à jour.');
    }
  }

  return (
    <div className="v4-modal-backdrop" onClick={onClose}>
      <div className="v4-modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="v4-modal-handle" />

        <div className="v4-modal-header">
          <span className="v4-modal-title">Date de péremption</span>
          <button type="button" className="v4-modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="v4-modal-body">
          <div className="v4-modal-produit-info">
            <div className="v4-modal-produit-nom">{produit.nom}</div>
            <div className="v4-modal-produit-stock">
              Stock : {produit.stock_actuel} {produit.unite ?? ''}
            </div>
          </div>

          <div className="v4-modal-field">
            <label className="v4-modal-label">Date d&apos;expiration</label>
            <input
              type="date"
              value={dateValue}
              onChange={(e) => setDateValue(e.target.value)}
              className="v4-modal-input"
            />
          </div>

          {error && <p className="v4-modal-error">{error}</p>}

          <div className="v4-modal-actions">
            <button type="button" className="v4-btn-cancel" onClick={onClose}>
              Annuler
            </button>
            <button
              type="button"
              className="v4-btn-confirm"
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? '…' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
