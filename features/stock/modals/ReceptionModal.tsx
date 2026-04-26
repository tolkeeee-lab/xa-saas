'use client';

import { useState } from 'react';
import { X, PackagePlus } from 'lucide-react';
import type { Produit } from '@/types/database';
import type { MouvementStockMotif } from '@/types/database';

type Props = {
  produit: Produit;
  boutiqueId: string;
  onClose: () => void;
  onSuccess: (newStock: number) => void;
};

const MOTIFS: { value: MouvementStockMotif; label: string }[] = [
  { value: 'livraison_fournisseur', label: 'Livraison fournisseur' },
  { value: 'livraison_mafro', label: 'Livraison MAFRO' },
  { value: 'autre', label: 'Autre' },
];

export default function ReceptionModal({ produit, boutiqueId, onClose, onSuccess }: Props) {
  const [quantite, setQuantite] = useState('');
  const [motif, setMotif] = useState<MouvementStockMotif>('livraison_fournisseur');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const qty = Number(quantite);
  const newStock = isNaN(qty) || qty <= 0 ? produit.stock_actuel : produit.stock_actuel + qty;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!qty || qty < 1) {
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
          motif,
          quantite: qty,
          note: note.trim() || undefined,
        }),
      });

      const data = (await res.json()) as { ok?: boolean; stock_apres?: number; error?: string };
      if (!res.ok) {
        setError(data.error ?? 'Erreur lors de la réception.');
        return;
      }
      onSuccess(data.stock_apres ?? newStock);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="xa-modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="xa-modal-box" role="dialog" aria-modal="true" aria-labelledby="reception-title">
        <div className="xa-modal-header">
          <div className="flex items-center gap-2">
            <PackagePlus size={18} style={{ color: 'var(--xa-green)' }} />
            <h3 id="reception-title" className="text-base font-semibold text-xa-text">
              Réceptionner
            </h3>
          </div>
          <button type="button" onClick={onClose} className="xa-modal-close"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="xa-modal-body space-y-4">
          <p className="text-sm text-xa-muted">
            <span className="font-semibold text-xa-text">{produit.nom}</span>
            {' · '}Stock actuel :
            {' '}<span className="font-semibold text-xa-text">{produit.stock_actuel} {produit.unite}</span>
          </p>

          {error && (
            <div className="p-3 rounded-lg border border-xa-danger text-xa-danger text-sm">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-xa-text mb-1.5">
              Quantité reçue <span style={{ color: 'var(--xa-danger)' }}>*</span>
            </label>
            <input
              type="number"
              min="1"
              value={quantite}
              onChange={(e) => setQuantite(e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary"
              style={{ minHeight: 44 }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-xa-text mb-1.5">Motif</label>
            <select
              value={motif}
              onChange={(e) => setMotif(e.target.value as MouvementStockMotif)}
              className="w-full px-3 py-2.5 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary"
            >
              {MOTIFS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-xa-text mb-1.5">Note (optionnelle)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="N° bon de livraison, commentaire…"
              className="w-full px-3 py-2.5 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary"
            />
          </div>

          {qty > 0 && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-xa-bg2 text-sm">
              <span className="text-xa-muted">Stock actuel :</span>
              <span className="font-semibold text-xa-text">{produit.stock_actuel}</span>
              <span className="text-xa-muted">→</span>
              <span className="font-bold" style={{ color: 'var(--xa-green)' }}>{newStock} {produit.unite}</span>
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
              style={{ background: 'var(--xa-green)' }}
            >
              {loading ? 'Enregistrement…' : 'Réceptionner'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
