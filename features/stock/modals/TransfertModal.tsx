'use client';

import { useState } from 'react';
import { X, ArrowLeftRight } from 'lucide-react';
import type { Produit, Boutique } from '@/types/database';

type Props = {
  produit: Produit;
  boutiqueSource: Boutique;
  autresBoutiques: Boutique[];
  onClose: () => void;
  onSuccess: (newStock: number) => void;
};

export default function TransfertModal({
  produit,
  boutiqueSource,
  autresBoutiques,
  onClose,
  onSuccess,
}: Props) {
  const destinationOptions = autresBoutiques.filter(
    (b) => b.id !== boutiqueSource.id && b.est_actif !== false,
  );

  const [destinationId, setDestinationId] = useState(destinationOptions[0]?.id ?? '');
  const [quantite, setQuantite] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const qty = Number(quantite);
  const newStock = isNaN(qty) || qty <= 0 ? produit.stock_actuel : produit.stock_actuel - qty;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!qty || qty < 1) { setError('La quantité doit être ≥ 1.'); return; }
    if (qty > produit.stock_actuel) {
      setError('Quantité supérieure au stock disponible.');
      return;
    }
    if (!destinationId) { setError('Sélectionnez une boutique de destination.'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/stock/transferts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          produit_id: produit.id,
          boutique_source_id: boutiqueSource.id,
          boutique_destination_id: destinationId,
          quantite: qty,
          note: note.trim() || undefined,
        }),
      });

      const data = (await res.json()) as { ok?: boolean; stock_source?: number; error?: string };
      if (!res.ok) {
        setError(data.error ?? 'Erreur lors du transfert.');
        return;
      }
      onSuccess(data.stock_source ?? newStock);
    } finally {
      setLoading(false);
    }
  }

  if (destinationOptions.length === 0) {
    return (
      <div className="xa-modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="xa-modal-box" role="dialog" aria-modal="true">
          <div className="xa-modal-header">
            <h3 className="text-base font-semibold text-xa-text">Transfert de stock</h3>
            <button type="button" onClick={onClose} className="xa-modal-close"><X size={20} /></button>
          </div>
          <div className="xa-modal-body">
            <p className="text-sm text-xa-muted">
              Aucune autre boutique disponible pour le transfert.
              Créez une autre boutique dans les paramètres.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 w-full px-4 py-2.5 rounded-lg border border-xa-border text-xa-text text-sm hover:bg-xa-bg2 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="xa-modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="xa-modal-box" role="dialog" aria-modal="true" aria-labelledby="transfert-title">
        <div className="xa-modal-header">
          <div className="flex items-center gap-2">
            <ArrowLeftRight size={18} style={{ color: 'var(--xa-amber)' }} />
            <h3 id="transfert-title" className="text-base font-semibold text-xa-text">Transfert</h3>
          </div>
          <button type="button" onClick={onClose} className="xa-modal-close"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="xa-modal-body space-y-4">
          <p className="text-sm text-xa-muted">
            <span className="font-semibold text-xa-text">{produit.nom}</span>
            {' · '}<span className="font-semibold text-xa-text">{produit.stock_actuel} {produit.unite}</span>
            {' '}disponible dans <span className="font-semibold text-xa-text">{boutiqueSource.nom}</span>
          </p>

          {error && (
            <div className="p-3 rounded-lg border border-xa-danger text-xa-danger text-sm">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-xa-text mb-1.5">
              Boutique destination <span style={{ color: 'var(--xa-danger)' }}>*</span>
            </label>
            <select
              value={destinationId}
              onChange={(e) => setDestinationId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary"
            >
              {destinationOptions.map((b) => (
                <option key={b.id} value={b.id}>{b.nom}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-xa-text mb-1.5">
              Quantité <span style={{ color: 'var(--xa-danger)' }}>*</span>
            </label>
            <input
              type="number"
              min="1"
              max={produit.stock_actuel}
              value={quantite}
              onChange={(e) => setQuantite(e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary"
              style={{ minHeight: 44 }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-xa-text mb-1.5">Note (optionnelle)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary"
            />
          </div>

          {qty > 0 && qty <= produit.stock_actuel && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-xa-bg2 text-sm">
              <span className="text-xa-muted">{boutiqueSource.nom} :</span>
              <span className="font-semibold text-xa-text">{produit.stock_actuel}</span>
              <span className="text-xa-muted">→</span>
              <span className="font-bold" style={{ color: newStock === 0 ? 'var(--xa-danger)' : newStock <= produit.seuil_alerte ? 'var(--xa-amber)' : 'var(--xa-green)' }}>
                {newStock}
              </span>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-xa-border text-xa-text text-sm hover:bg-xa-bg2 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-lg text-white text-sm font-semibold transition-opacity disabled:opacity-50"
              style={{ background: 'var(--xa-amber)' }}
            >
              {loading ? 'Transfert…' : 'Transférer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
