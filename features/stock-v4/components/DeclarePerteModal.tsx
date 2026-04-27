'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Boutique } from '@/types/database';
import type { BoutiqueActiveId } from '../types';

interface DeclarePerteModalProps {
  boutiques: Boutique[];
  boutiqueActive: BoutiqueActiveId;
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

type ProduitSuggestion = {
  id: string;
  nom: string;
  stock_actuel: number;
  unite?: string | null;
};

export default function DeclarePerteModal({
  boutiques,
  boutiqueActive,
  onClose,
  onSuccess,
}: DeclarePerteModalProps) {
  const defaultBoutique =
    boutiqueActive !== 'all' ? boutiqueActive : (boutiques[0]?.id ?? '');

  const [boutiqueId, setBoutiqueId] = useState(defaultBoutique);
  const [produitSearch, setProduitSearch] = useState('');
  const [suggestions, setSuggestions] = useState<ProduitSuggestion[]>([]);
  const [selectedProduit, setSelectedProduit] = useState<ProduitSuggestion | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  const [quantite, setQuantite] = useState('1');
  const [motif, setMotif] = useState<Motif>('perime');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, []);

  const searchProduits = useCallback(async (bId: string, q: string) => {
    if (!bId || q.length < 1) {
      setSuggestions([]);
      return;
    }
    setSearchLoading(true);
    try {
      const res = await fetch(
        `/api/stock/produits?boutique_id=${encodeURIComponent(bId)}&q=${encodeURIComponent(q)}&tab=tous&page=1`,
      );
      const json = (await res.json()) as { data?: ProduitSuggestion[] };
      setSuggestions(json.data ?? []);
    } catch {
      setSuggestions([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  function handleBoutiqueChange(id: string) {
    setBoutiqueId(id);
    setSelectedProduit(null);
    setProduitSearch('');
    setSuggestions([]);
  }

  function handleSearchChange(v: string) {
    setProduitSearch(v);
    setSelectedProduit(null);
    setShowSuggestions(true);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      void searchProduits(boutiqueId, v);
    }, 300);
  }

  function handleSelectProduit(p: ProduitSuggestion) {
    setSelectedProduit(p);
    setProduitSearch(p.nom);
    setShowSuggestions(false);
    setSuggestions([]);
  }

  const qty = parseInt(quantite, 10);
  const isValid =
    !!boutiqueId &&
    !!selectedProduit &&
    !isNaN(qty) &&
    qty >= 1 &&
    qty <= selectedProduit.stock_actuel;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!boutiqueId) { setError('Sélectionnez une boutique.'); return; }
    if (!selectedProduit) { setError('Sélectionnez un produit.'); return; }
    if (!isValid) { setError('La quantité doit être entre 1 et le stock actuel.'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/pertes/declarer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boutique_id: boutiqueId,
          produit_id: selectedProduit.id,
          motif,
          quantite: qty,
          note: note.trim() || undefined,
        }),
      });

      const data = (await res.json()) as { data?: unknown; error?: string };
      if (!res.ok) {
        setError(data.error ?? 'Erreur lors de la déclaration.');
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
        aria-labelledby="perte-declare-title"
      >
        <div className="v4-modal-handle" />

        <div className="v4-modal-header">
          <span className="v4-modal-title" id="perte-declare-title">
            Déclarer une perte
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
                onChange={(e) => handleBoutiqueChange(e.target.value)}
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

          <div className="v4-modal-field" style={{ position: 'relative' }}>
            <div className="v4-modal-label">Produit *</div>
            <input
              type="text"
              value={produitSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => { if (produitSearch.length >= 1) setShowSuggestions(true); }}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              placeholder={boutiqueId ? 'Rechercher un produit…' : 'Choisir la boutique d\'abord'}
              disabled={!boutiqueId}
              className="v4-modal-input"
              style={{ minHeight: 44 }}
            />
            {showSuggestions && (suggestions.length > 0 || searchLoading) && (
              <div
                style={{
                  position: 'absolute',
                  zIndex: 10,
                  width: '100%',
                  marginTop: 2,
                  background: 'var(--v4-card)',
                  border: '1.5px solid var(--v4-brd)',
                  borderRadius: 10,
                  overflow: 'hidden',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                }}
              >
                {searchLoading ? (
                  <div style={{ padding: '10px 12px', fontSize: 13, color: 'var(--v4-mu)' }}>
                    Recherche…
                  </div>
                ) : (
                  suggestions.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onMouseDown={() => handleSelectProduit(p)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '9px 12px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: 13,
                      }}
                    >
                      <span style={{ color: 'var(--v4-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.nom}
                      </span>
                      <span style={{ color: 'var(--v4-mu)', fontSize: 11, flexShrink: 0, marginLeft: 8 }}>
                        Stock: {p.stock_actuel}{p.unite ? ` ${p.unite}` : ''}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="v4-modal-field">
            <div className="v4-modal-label">Quantité *</div>
            <input
              type="number"
              min="1"
              max={selectedProduit?.stock_actuel ?? undefined}
              value={quantite}
              onChange={(e) => setQuantite(e.target.value)}
              required
              className="v4-modal-input"
              style={{ minHeight: 44 }}
              placeholder="1"
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
                <option key={m.value} value={m.value}>{m.label}</option>
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
                <strong>{selectedProduit?.nom}</strong> comme perdues ?
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
