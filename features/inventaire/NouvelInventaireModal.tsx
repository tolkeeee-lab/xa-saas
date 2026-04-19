'use client';

import { useState, useEffect } from 'react';
import type { Boutique } from '@/types/database';

type Props = {
  boutiques: Boutique[];
  onClose: () => void;
  onCreated: (inv: { id: string }) => void;
};

type Perimetre = 'complet' | 'categorie';
// TODO: ajouter 'selection' (picker de produits) dans une version future

export default function NouvelInventaireModal({ boutiques, onClose, onCreated }: Props) {
  const [boutiqueId, setBoutiqueId] = useState(boutiques[0]?.id ?? '');
  const [perimetre, setPerimetre] = useState<Perimetre>('complet');
  const [categorie, setCategorie] = useState('');
  const [note, setNote] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [loadingCats, setLoadingCats] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Charger les catégories quand la boutique change et périmètre = 'categorie'
  useEffect(() => {
    if (perimetre !== 'categorie' || !boutiqueId) return;

    setLoadingCats(true);
    setCategorie('');
    fetch(`/api/produits/categories?boutique_id=${boutiqueId}`)
      .then((r) => r.json())
      .then((data: string[]) => setCategories(data))
      .catch(() => setCategories([]))
      .finally(() => setLoadingCats(false));
  }, [perimetre, boutiqueId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!boutiqueId) {
      setError('Veuillez sélectionner une boutique');
      return;
    }
    if (perimetre === 'categorie' && !categorie) {
      setError('Veuillez sélectionner une catégorie');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/inventaires', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boutique_id: boutiqueId,
          perimetre,
          categorie: perimetre === 'categorie' ? categorie : undefined,
          note: note || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Erreur lors de la création');
        return;
      }
      onCreated(data as { id: string });
    } catch {
      setError('Erreur réseau');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-xa-surface border border-xa-border shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-xa-border">
          <h2 className="text-base font-semibold text-xa-ink" style={{ fontFamily: 'var(--font-familjen), sans-serif' }}>
            Nouvel inventaire
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-xa-muted hover:text-xa-ink hover:bg-xa-bg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Boutique */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-xa-muted uppercase tracking-wider">
              Boutique <span className="text-xa-danger">*</span>
            </label>
            <select
              value={boutiqueId}
              onChange={(e) => setBoutiqueId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-xa-border bg-xa-bg text-xa-ink text-sm focus:outline-none focus:ring-1 focus:ring-xa-primary"
              required
            >
              {boutiques.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nom}
                </option>
              ))}
            </select>
          </div>

          {/* Périmètre */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-xa-muted uppercase tracking-wider">
              Périmètre <span className="text-xa-danger">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['complet', 'categorie'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPerimetre(p)}
                  className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    perimetre === p
                      ? 'border-xa-primary bg-xa-primary/10 text-xa-primary'
                      : 'border-xa-border bg-xa-bg text-xa-muted hover:text-xa-ink hover:border-xa-ink/30'
                  }`}
                >
                  {p === 'complet' ? 'Complet' : 'Catégorie'}
                </button>
              ))}
            </div>
            <p className="text-xs text-xa-muted">
              {perimetre === 'complet'
                ? 'Tous les produits actifs de la boutique'
                : 'Uniquement les produits d\'une catégorie'}
            </p>
          </div>

          {/* Catégorie (si périmètre = categorie) */}
          {perimetre === 'categorie' && (
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-xa-muted uppercase tracking-wider">
                Catégorie <span className="text-xa-danger">*</span>
              </label>
              {loadingCats ? (
                <div className="px-3 py-2 text-sm text-xa-muted">Chargement…</div>
              ) : (
                <select
                  value={categorie}
                  onChange={(e) => setCategorie(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-xa-border bg-xa-bg text-xa-ink text-sm focus:outline-none focus:ring-1 focus:ring-xa-primary"
                  required
                >
                  <option value="">— Sélectionner une catégorie —</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Note */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-xa-muted uppercase tracking-wider">
              Note (optionnel)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Ex : Inventaire mensuel de janvier…"
              className="w-full px-3 py-2 rounded-lg border border-xa-border bg-xa-bg text-xa-ink text-sm resize-none focus:outline-none focus:ring-1 focus:ring-xa-primary placeholder:text-xa-muted/60"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs text-xa-danger bg-xa-danger/10 px-3 py-2 rounded-lg border border-xa-danger/20">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-xl border border-xa-border text-xa-muted text-sm font-medium hover:text-xa-ink hover:border-xa-ink/30 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 rounded-xl bg-xa-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {submitting ? 'Démarrage…' : 'Démarrer l\'inventaire'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
