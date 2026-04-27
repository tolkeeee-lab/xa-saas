'use client';

import { useState, useRef } from 'react';
import { X } from 'lucide-react';
import type { Boutique, ProduitsDemandes } from '@/types/database';
import type { BoutiqueActiveId } from '../types';

interface AjouterDemandeModalProps {
  boutiques: Boutique[];
  boutiqueActive: BoutiqueActiveId;
  onClose: () => void;
  onSuccess: (created: boolean) => void;
}

export default function AjouterDemandeModal({
  boutiques,
  boutiqueActive,
  onClose,
  onSuccess,
}: AjouterDemandeModalProps) {
  const defaultBoutique =
    boutiqueActive !== 'all' ? boutiqueActive : (boutiques[0]?.id ?? '');

  const [boutiqueId, setBoutiqueId] = useState(defaultBoutique);
  const [nomProduit, setNomProduit] = useState('');
  const [categorie, setCategorie] = useState('');
  const [prixIndicatif, setPrixIndicatif] = useState('');
  const [clientNom, setClientNom] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const nomRef = useRef<HTMLInputElement>(null);

  const isValid = !!boutiqueId && !!nomProduit.trim();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!boutiqueId) { setError('Sélectionnez une boutique.'); return; }
    if (!nomProduit.trim()) { setError('Le nom du produit est requis.'); return; }

    const prix = prixIndicatif ? parseFloat(prixIndicatif) : undefined;
    if (prixIndicatif && (isNaN(prix!) || prix! < 0)) {
      setError('Le prix indicatif doit être un nombre positif.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/produits-demandes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boutique_id: boutiqueId,
          nom_produit: nomProduit.trim(),
          categorie: categorie.trim() || undefined,
          prix_indicatif: prix,
          client_nom: clientNom.trim() || undefined,
          note: note.trim() || undefined,
        }),
      });

      const data = (await res.json()) as { data?: ProduitsDemandes; created?: boolean; error?: string };
      if (!res.ok) {
        setError(data.error ?? 'Erreur lors de l\'enregistrement.');
        return;
      }

      const wasCreated = data.created ?? true;
      setSuccessMsg(wasCreated ? 'Demande enregistrée ✓' : 'Demande déjà notée +1 ✓');

      setTimeout(() => {
        onSuccess(wasCreated);
      }, 800);
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
        aria-labelledby="ajouter-demande-title"
      >
        <div className="v4-modal-handle" />

        <div className="v4-modal-header">
          <span className="v4-modal-title" id="ajouter-demande-title">
            📥 Noter une demande
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
          {successMsg && (
            <div className="v4-modal-preview" style={{ background: 'var(--v4-gl)', color: 'var(--v4-gd)' }}>
              {successMsg}
            </div>
          )}

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

          <div className="v4-modal-field">
            <div className="v4-modal-label">Nom du produit *</div>
            <input
              ref={nomRef}
              type="text"
              value={nomProduit}
              onChange={(e) => setNomProduit(e.target.value)}
              placeholder="Ex: Coca Zero, Shampoing Dop…"
              required
              autoFocus
              className="v4-modal-input"
              style={{ minHeight: 44 }}
            />
          </div>

          <div className="v4-modal-field">
            <div className="v4-modal-label">Catégorie (optionnelle)</div>
            <input
              type="text"
              value={categorie}
              onChange={(e) => setCategorie(e.target.value)}
              placeholder="Ex: Boissons, Hygiène…"
              className="v4-modal-input"
              style={{ minHeight: 44 }}
            />
          </div>

          <div className="v4-modal-field">
            <div className="v4-modal-label">Prix indicatif (optionnel)</div>
            <input
              type="number"
              min="0"
              step="1"
              value={prixIndicatif}
              onChange={(e) => setPrixIndicatif(e.target.value)}
              placeholder="Prix que le client était prêt à payer"
              className="v4-modal-input"
              style={{ minHeight: 44 }}
            />
          </div>

          <div className="v4-modal-field">
            <div className="v4-modal-label">Nom du client (optionnel)</div>
            <input
              type="text"
              value={clientNom}
              onChange={(e) => setClientNom(e.target.value)}
              placeholder="Ex: Mme Adjobi…"
              className="v4-modal-input"
              style={{ minHeight: 44 }}
            />
          </div>

          <div className="v4-modal-field">
            <div className="v4-modal-label">Note (optionnelle)</div>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Précisions sur la demande…"
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
              disabled={loading || !isValid}
            >
              {loading ? 'Enregistrement…' : 'Enregistrer la demande'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
