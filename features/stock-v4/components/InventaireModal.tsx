'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import type { Boutique } from '@/types/database';
import type { BoutiqueActiveId } from '../types';

interface InventaireModalProps {
  boutiques: Boutique[];
  boutiqueActive: BoutiqueActiveId;
  onClose: () => void;
  onSuccess: () => void;
}

type Perimetre = 'complet' | 'categorie' | 'selection';

export default function InventaireModal({
  boutiques,
  boutiqueActive,
  onClose,
  onSuccess,
}: InventaireModalProps) {
  const defaultBoutique =
    boutiqueActive !== 'all'
      ? boutiqueActive
      : (boutiques[0]?.id ?? '');

  const [boutiqueId, setBoutiqueId] = useState(defaultBoutique);
  const [perimetre, setPerimetre] = useState<Perimetre>('complet');
  const [categorie, setCategorie] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!boutiqueId) {
      setError('Sélectionnez une boutique.');
      return;
    }
    if (perimetre === 'categorie' && !categorie.trim()) {
      setError('Saisissez le nom de la catégorie.');
      return;
    }

    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        boutique_id: boutiqueId,
        perimetre,
        note: note.trim() || undefined,
      };
      if (perimetre === 'categorie') body.categorie = categorie.trim();

      const res = await fetch('/api/inventaires', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? 'Erreur lors de la création.');
        return;
      }
      onSuccess();
    } finally {
      setLoading(false);
    }
  }

  const boutiqueNom = boutiques.find((b) => b.id === boutiqueId)?.nom ?? '';

  return (
    <div
      className="v4-modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="v4-modal-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="inv-modal-title"
      >
        <div className="v4-modal-handle" />

        <div className="v4-modal-header">
          <span className="v4-modal-title" id="inv-modal-title">
            Nouvel inventaire
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

        <form onSubmit={(e) => { void handleSubmit(e); }} className="v4-modal-body">
          {error && <div className="v4-modal-error">{error}</div>}

          {boutiques.length > 1 && (
            <div className="v4-modal-field">
              <div className="v4-modal-label">Boutique *</div>
              <select
                value={boutiqueId}
                onChange={(e) => setBoutiqueId(e.target.value)}
                className="v4-modal-input"
                style={{ minHeight: 44 }}
              >
                <option value="">Choisir…</option>
                {boutiques.map((b) => (
                  <option key={b.id} value={b.id}>{b.nom}</option>
                ))}
              </select>
            </div>
          )}

          {boutiques.length === 1 && boutiqueNom && (
            <div className="v4-modal-produit-info" style={{ marginBottom: 12 }}>
              <div className="v4-modal-produit-nom">{boutiqueNom}</div>
            </div>
          )}

          <div className="v4-modal-field">
            <div className="v4-modal-label">Périmètre *</div>
            <select
              value={perimetre}
              onChange={(e) => setPerimetre(e.target.value as Perimetre)}
              className="v4-modal-input"
              style={{ minHeight: 44 }}
            >
              <option value="complet">Complet — tous les produits actifs</option>
              <option value="categorie">Par catégorie</option>
              <option value="selection">Sélection manuelle</option>
            </select>
          </div>

          {perimetre === 'categorie' && (
            <div className="v4-modal-field">
              <div className="v4-modal-label">Catégorie *</div>
              <input
                type="text"
                value={categorie}
                onChange={(e) => setCategorie(e.target.value)}
                placeholder="Ex : Boissons"
                className="v4-modal-input"
                style={{ minHeight: 44 }}
                autoFocus
              />
            </div>
          )}

          {perimetre === 'selection' && (
            <div className="v4-modal-produit-info" style={{ marginBottom: 12 }}>
              <div className="v4-modal-produit-stock">
                La sélection manuelle est disponible depuis la page Inventaires.
              </div>
            </div>
          )}

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

          <div className="v4-modal-actions">
            <button type="button" className="v4-btn-cancel" onClick={onClose}>
              Annuler
            </button>
            <button
              type="submit"
              className="v4-btn-confirm"
              disabled={loading || !boutiqueId || perimetre === 'selection'}
            >
              {loading ? 'Création…' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
