'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import type { ProduitPublic } from '@/types/database';

interface RetireStockModalProps {
  produit: ProduitPublic;
  boutiqueId: string;
  onClose: () => void;
  onSuccess: () => void;
}

type Motif = 'perime' | 'sac_perce' | 'vol' | 'erreur_saisie' | 'autre';

const MOTIFS: { value: Motif; label: string }[] = [
  { value: 'perime', label: 'Péremption' },
  { value: 'sac_perce', label: 'Casse / sac percé' },
  { value: 'vol', label: 'Vol' },
  { value: 'erreur_saisie', label: 'Erreur de saisie' },
  { value: 'autre', label: 'Autre' },
];

export default function RetireStockModal({
  produit,
  boutiqueId,
  onClose,
  onSuccess,
}: RetireStockModalProps) {
  const [quantite, setQuantite] = useState('1');
  const [motif, setMotif] = useState<Motif>('perime');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const qty = parseInt(quantite, 10);
  const isValid = !isNaN(qty) && qty >= 1 && qty <= produit.stock_actuel;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isValid) {
      setError('La quantité doit être entre 1 et le stock actuel.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/pertes/declarer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boutique_id: boutiqueId,
          produit_id: produit.id,
          motif,
          quantite: qty,
          note: note.trim() || undefined,
        }),
      });

      const data = (await res.json()) as { data?: unknown; error?: string };
      if (!res.ok) {
        setError(data.error ?? 'Erreur lors de la déclaration de perte.');
        return;
      }
      onSuccess();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="v4-modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="v4-modal-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="retire-title"
      >
        <div className="v4-modal-handle" />

        <div className="v4-modal-header">
          <span className="v4-modal-title" id="retire-title">
            Retirer du stock
          </span>
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
              Stock actuel :{' '}
              <strong>
                {produit.stock_actuel} {produit.unite}
              </strong>
            </div>
          </div>

          {error && <div className="v4-modal-error">{error}</div>}

          <div className="v4-modal-field">
            <div className="v4-modal-label">Quantité à retirer *</div>
            <input
              type="number"
              min="1"
              max={produit.stock_actuel}
              value={quantite}
              onChange={(e) => setQuantite(e.target.value)}
              required
              autoFocus
              className="v4-modal-input"
              placeholder="1"
              style={{ minHeight: 44 }}
            />
          </div>

          <div className="v4-modal-field">
            <div className="v4-modal-label">Raison *</div>
            <select
              value={motif}
              onChange={(e) => setMotif(e.target.value as Motif)}
              className="v4-modal-input"
              style={{ minHeight: 44 }}
            >
              {MOTIFS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div className="v4-modal-field">
            <div className="v4-modal-label">Note (optionnelle)</div>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Commentaire…"
              className="v4-modal-input"
            />
          </div>

          {isValid && (
            <div
              className="v4-modal-preview"
              style={{ background: 'var(--v4-rl)', color: 'var(--v4-r)' }}
            >
              <span>
                Marquer {qty} unité{qty > 1 ? 's' : ''} de{' '}
                <strong>{produit.nom}</strong> comme perdues ?
              </span>
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
              style={{ background: 'var(--v4-r)' }}
            >
              {loading ? 'Enregistrement…' : 'Confirmer la perte'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
