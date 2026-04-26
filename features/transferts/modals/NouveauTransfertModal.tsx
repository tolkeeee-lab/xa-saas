'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { X, ArrowRight } from 'lucide-react';
import type { Boutique } from '@/types/database';

type Produit = {
  id: string;
  nom: string;
  stock_actuel: number;
  unite?: string | null;
  categorie?: string | null;
};

type Props = {
  boutiques: Boutique[];
  onClose: () => void;
  onSuccess: () => void;
};

export default function NouveauTransfertModal({ boutiques, onClose, onSuccess }: Props) {
  const [sourceId, setSourceId] = useState('');
  const [destId, setDestId] = useState('');

  const [produits, setProduits] = useState<Produit[]>([]);
  const [produitSearch, setProduitSearch] = useState('');
  const [selectedProduit, setSelectedProduit] = useState<Produit | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  const [quantite, setQuantite] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup search timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, []);

  const destBoutiques = boutiques.filter((b) => b.id !== sourceId);

  const stockApresSource = selectedProduit
    ? Math.max(0, selectedProduit.stock_actuel - (parseInt(quantite, 10) || 0))
    : null;

  const searchProduits = useCallback(async (boutiqueId: string, q: string) => {
    if (!boutiqueId || q.length < 1) {
      setProduits([]);
      return;
    }
    setSearchLoading(true);
    try {
      const res = await fetch(
        `/api/stock/produits?boutique_id=${encodeURIComponent(boutiqueId)}&q=${encodeURIComponent(q)}&tab=tous&page=1`,
      );
      const json = (await res.json()) as { data?: Produit[] };
      setProduits(json.data ?? []);
    } catch {
      setProduits([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  function handleSearchChange(v: string) {
    setProduitSearch(v);
    setSelectedProduit(null);
    setShowSuggestions(true);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      void searchProduits(sourceId, v);
    }, 300);
  }

  function handleSelectProduit(p: Produit) {
    setSelectedProduit(p);
    setProduitSearch(p.nom);
    setShowSuggestions(false);
    setProduits([]);
  }

  function handleSourceChange(id: string) {
    setSourceId(id);
    if (id === destId) setDestId('');
    setSelectedProduit(null);
    setProduitSearch('');
    setProduits([]);
    setQuantite('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!sourceId) { setError('Sélectionnez la boutique source.'); return; }
    if (!destId) { setError('Sélectionnez la boutique destination.'); return; }
    if (sourceId === destId) { setError('Source et destination doivent être différentes.'); return; }
    if (!selectedProduit) { setError('Sélectionnez un produit.'); return; }

    const qty = parseInt(quantite, 10);
    if (!qty || qty <= 0) { setError('La quantité doit être ≥ 1.'); return; }
    if (qty > selectedProduit.stock_actuel) {
      setError(`Stock insuffisant (disponible : ${selectedProduit.stock_actuel}).`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/transferts/creer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_id: sourceId,
          dest_id: destId,
          produit_id: selectedProduit.id,
          quantite: qty,
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? 'Erreur lors du transfert');
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inattendue');
    } finally {
      setSubmitting(false);
    }
  }

  const sourceBoutique = boutiques.find((b) => b.id === sourceId);
  const destinationBoutique = boutiques.find((b) => b.id === destId);

  return (
    <div className="xa-modal-backdrop">
      <div className="xa-modal-box">
        <div className="xa-modal-body">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-xa-text text-lg">Nouveau transfert</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-xa-muted hover:text-xa-text p-1"
              aria-label="Fermer"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={(e) => { void handleSubmit(e); }} className="flex flex-col gap-4">
            {/* Boutique source */}
            <div>
              <label className="block text-sm font-medium text-xa-text mb-1">
                Boutique source
              </label>
              <select
                value={sourceId}
                onChange={(e) => handleSourceChange(e.target.value)}
                className="w-full rounded-xl border border-xa-border bg-xa-bg text-xa-text px-3 py-2 text-sm"
                required
              >
                <option value="">Choisir…</option>
                {boutiques.map((b) => (
                  <option key={b.id} value={b.id}>{b.nom}</option>
                ))}
              </select>
            </div>

            {/* Boutique destination */}
            <div>
              <label className="block text-sm font-medium text-xa-text mb-1">
                Boutique destination
              </label>
              <select
                value={destId}
                onChange={(e) => setDestId(e.target.value)}
                className="w-full rounded-xl border border-xa-border bg-xa-bg text-xa-text px-3 py-2 text-sm"
                required
                disabled={!sourceId}
              >
                <option value="">Choisir…</option>
                {destBoutiques.map((b) => (
                  <option key={b.id} value={b.id}>{b.nom}</option>
                ))}
              </select>
            </div>

            {/* Preview boutiques */}
            {sourceBoutique && destinationBoutique && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-xa-bg border border-xa-border">
                <span
                  className="text-xs font-semibold px-2 py-1 rounded-full border"
                  style={{
                    backgroundColor: sourceBoutique.couleur_theme + '22',
                    borderColor: sourceBoutique.couleur_theme + '55',
                    color: sourceBoutique.couleur_theme,
                  }}
                >
                  {sourceBoutique.nom}
                </span>
                <ArrowRight size={14} className="text-xa-muted" />
                <span
                  className="text-xs font-semibold px-2 py-1 rounded-full border"
                  style={{
                    backgroundColor: destinationBoutique.couleur_theme + '22',
                    borderColor: destinationBoutique.couleur_theme + '55',
                    color: destinationBoutique.couleur_theme,
                  }}
                >
                  {destinationBoutique.nom}
                </span>
              </div>
            )}

            {/* Produit autocomplete */}
            <div className="relative">
              <label className="block text-sm font-medium text-xa-text mb-1">
                Produit
              </label>
              <input
                type="text"
                value={produitSearch}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => { if (produitSearch.length >= 1) setShowSuggestions(true); }}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                placeholder={sourceId ? 'Rechercher un produit…' : 'Choisir la boutique source d\'abord'}
                disabled={!sourceId}
                className="w-full rounded-xl border border-xa-border bg-xa-bg text-xa-text px-3 py-2 text-sm disabled:opacity-50"
              />
              {showSuggestions && (produits.length > 0 || searchLoading) && (
                <div className="absolute z-10 w-full mt-1 bg-xa-surface border border-xa-border rounded-xl shadow-lg overflow-hidden">
                  {searchLoading ? (
                    <div className="p-3 text-xa-muted text-sm">Recherche…</div>
                  ) : (
                    produits.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onMouseDown={() => handleSelectProduit(p)}
                        className="w-full text-left px-3 py-2 hover:bg-xa-bg text-sm flex items-center justify-between"
                      >
                        <span className="text-xa-text truncate">{p.nom}</span>
                        <span className="text-xa-muted text-xs ml-2 flex-shrink-0">
                          Stock: {p.stock_actuel} {p.unite ?? ''}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Quantite */}
            <div>
              <label className="block text-sm font-medium text-xa-text mb-1">
                Quantité
                {selectedProduit && (
                  <span className="font-normal text-xa-muted ml-1">
                    (max: {selectedProduit.stock_actuel})
                  </span>
                )}
              </label>
              <input
                type="number"
                min={1}
                max={selectedProduit?.stock_actuel ?? undefined}
                value={quantite}
                onChange={(e) => setQuantite(e.target.value)}
                className="w-full rounded-xl border border-xa-border bg-xa-bg text-xa-text px-3 py-2 text-sm"
                disabled={!selectedProduit}
              />
            </div>

            {/* Preview stock avant/après */}
            {selectedProduit && quantite && parseInt(quantite, 10) > 0 && (
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border border-xa-border bg-xa-bg text-center">
                  <div className="text-xs text-xa-muted mb-1">Source (avant → après)</div>
                  <div className="text-sm font-bold text-xa-text">
                    <span className="text-xa-muted">{selectedProduit.stock_actuel}</span>
                    <span className="mx-1">→</span>
                    <span className={stockApresSource === 0 ? 'text-red-600' : 'text-green-600'}>
                      {stockApresSource}
                    </span>
                  </div>
                </div>
                <div className="p-3 rounded-xl border border-xa-border bg-xa-bg text-center">
                  <div className="text-xs text-xa-muted mb-1">Destination (après réception)</div>
                  <div className="text-sm font-bold text-xa-text">
                    <span className="text-xa-muted">?</span>
                    <span className="mx-1">+</span>
                    <span className="text-green-600">{parseInt(quantite, 10) || 0}</span>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl p-3">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-xa-primary text-white font-semibold rounded-xl py-3 text-sm disabled:opacity-50 transition-opacity min-h-[44px]"
            >
              {submitting ? 'Envoi…' : 'Envoyer le transfert'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
