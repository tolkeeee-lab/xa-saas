'use client';

import { useState } from 'react';
import type { Boutique } from '@/types/database';
import type { FournisseurAvecCommande } from '@/lib/supabase/getFournisseurs';

interface CommandeModalProps {
  fournisseur: FournisseurAvecCommande;
  boutiques: Boutique[];
  onClose: () => void;
  onCreated: () => void;
}

export default function CommandeModal({
  fournisseur,
  boutiques,
  onClose,
  onCreated,
}: CommandeModalProps) {
  const [boutique_id, setBoutiqueId] = useState(boutiques[0]?.id ?? '');
  const [montant, setMontant] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const montantNum = parseInt(montant, 10);
    if (!boutique_id || isNaN(montantNum) || montantNum <= 0) {
      setError('Veuillez renseigner boutique et montant');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/fournisseurs?action=commande', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fournisseur_id: fournisseur.id,
          boutique_id,
          montant: montantNum,
          note: note || undefined,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? 'Erreur');
        return;
      }
      onCreated();
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-xa-surface border border-xa-border rounded-xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-xa-text">
            Commander — {fournisseur.nom}
          </h2>
          <button onClick={onClose} className="text-xa-muted hover:text-xa-text">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-xa-muted mb-1 block">Boutique *</label>
            <select
              value={boutique_id}
              onChange={(e) => setBoutiqueId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary"
            >
              {boutiques.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nom}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-xa-muted mb-1 block">Montant (FCFA) *</label>
            <input
              type="number"
              min="1"
              value={montant}
              onChange={(e) => setMontant(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary"
              placeholder="0"
            />
          </div>

          <div>
            <label className="text-xs text-xa-muted mb-1 block">Note (optionnel)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary resize-none"
              placeholder="Détails de la commande…"
            />
          </div>

          {error && <p className="text-xa-danger text-xs">{error}</p>}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-xa-border text-xa-text text-sm hover:bg-xa-bg transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 rounded-lg bg-xa-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'Envoi…' : 'Commander'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
