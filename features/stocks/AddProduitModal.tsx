'use client';

import { useState } from 'react';
import type { Boutique } from '@/types/database';
import type { ProduitPublic } from '@/types/database';
import type { CategorieProduit } from '@/types/database';

interface AddProduitModalProps {
  boutiques: Boutique[];
  defaultBoutiqueId?: string;
  onClose: () => void;
  onSuccess: (produit: ProduitPublic) => void;
  categories?: CategorieProduit[];
  onCategoryCreated?: (cat: CategorieProduit) => void;
}

const DEFAULT_CATEGORIES = ['Épicerie', 'Boissons', 'Hygiène', 'Frais', 'Boulangerie', 'Général', 'Autre'];

const EMPTY_FORM = {
  nom: '',
  categorie: 'Général',
  prix_achat: '',
  prix_vente: '',
  stock_actuel: '',
  seuil_alerte: '5',
  unite: 'unité',
  boutique_id: '',
};

export default function AddProduitModal({
  boutiques,
  defaultBoutiqueId,
  onClose,
  onSuccess,
  categories,
  onCategoryCreated,
}: AddProduitModalProps) {
  const [form, setForm] = useState({ ...EMPTY_FORM, boutique_id: defaultBoutiqueId ?? boutiques[0]?.id ?? '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Inline new category creation
  const [showNewCat, setShowNewCat] = useState(false);
  const [newCatNom, setNewCatNom] = useState('');
  const [newCatIcone, setNewCatIcone] = useState('📦');
  const [creatingCat, setCreatingCat] = useState(false);
  const [catError, setCatError] = useState<string | null>(null);

  function setField(key: keyof typeof EMPTY_FORM, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleCreateCategory() {
    if (!newCatNom.trim()) { setCatError('Le nom est obligatoire.'); return; }
    setCatError(null);
    setCreatingCat(true);
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom: newCatNom.trim(), icone: newCatIcone }),
      });
      const json = await res.json() as Record<string, unknown>;
      if (!res.ok) {
        setCatError(typeof json.error === 'string' ? json.error : 'Erreur lors de la création');
        return;
      }
      const cat = json as unknown as CategorieProduit;
      onCategoryCreated?.(cat);
      setForm((f) => ({ ...f, categorie: cat.nom }));
      setShowNewCat(false);
      setNewCatNom('');
      setNewCatIcone('📦');
    } finally {
      setCreatingCat(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!form.nom.trim()) { setError('Le nom est obligatoire.'); return; }
    if (!form.boutique_id) { setError('Sélectionnez une boutique.'); return; }

    const pa = Number(form.prix_achat);
    const pv = Number(form.prix_vente);

    if (isNaN(pa) || pa <= 0) { setError("Prix d'achat invalide."); return; }
    if (isNaN(pv) || pv <= 0) { setError('Prix de vente invalide.'); return; }
    if (pv <= pa) { setError('Le prix de vente doit être supérieur au prix d\'achat.'); return; }

    setSubmitting(true);
    try {
      const res = await fetch('/api/produits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boutique_id: form.boutique_id,
          nom: form.nom.trim(),
          categorie: form.categorie || 'Général',
          prix_achat: pa,
          prix_vente: pv,
          stock_actuel: Number(form.stock_actuel) || 0,
          seuil_alerte: Number(form.seuil_alerte) || 5,
          unite: form.unite || 'unité',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Erreur lors de la création');
        return;
      }

      onSuccess(data as ProduitPublic);
    } finally {
      setSubmitting(false);
    }
  }

  const categoryOptions = categories && categories.length > 0
    ? categories.map((c) => c.nom)
    : DEFAULT_CATEGORIES;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-xa-surface border border-xa-border rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-xa-border">
          <h2 className="font-semibold text-xa-text">Nouveau produit</h2>
          <button onClick={onClose} className="text-xa-muted hover:text-xa-text transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-lg border border-xa-danger text-xa-danger text-sm">{error}</div>
          )}

          {/* Boutique */}
          <div>
            <label className="block text-sm font-medium text-xa-text mb-1">
              Boutique <span className="text-xa-danger">*</span>
            </label>
            <select
              value={form.boutique_id}
              onChange={(e) => setField('boutique_id', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary"
            >
              {boutiques.map((b) => (
                <option key={b.id} value={b.id}>{b.nom}</option>
              ))}
            </select>
          </div>

          {/* Nom */}
          <div>
            <label className="block text-sm font-medium text-xa-text mb-1">
              Nom <span className="text-xa-danger">*</span>
            </label>
            <input
              type="text"
              value={form.nom}
              onChange={(e) => setField('nom', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary"
            />
          </div>

          {/* Catégorie */}
          <div>
            <label className="block text-sm font-medium text-xa-text mb-1">Catégorie</label>
            <div className="flex gap-2">
              <select
                value={form.categorie}
                onChange={(e) => setField('categorie', e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary"
              >
                {categoryOptions.map((c) => (
                  <option key={c} value={c}>
                    {categories
                      ? (categories.find((cat) => cat.nom === c)?.icone ?? '') + ' ' + c
                      : c}
                  </option>
                ))}
              </select>
              {categories !== undefined && (
                <button
                  type="button"
                  onClick={() => { setShowNewCat((v) => !v); setCatError(null); }}
                  className="px-3 py-2 rounded-lg border border-xa-border bg-xa-bg text-xa-muted text-sm hover:text-xa-text transition-colors whitespace-nowrap"
                  title="Ajouter une catégorie"
                >
                  ➕
                </button>
              )}
            </div>

            {/* Inline new category form */}
            {showNewCat && (
              <div className="mt-2 p-3 rounded-lg border border-xa-border bg-xa-bg space-y-2">
                {catError && (
                  <p className="text-xs text-xa-danger">{catError}</p>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCatIcone}
                    onChange={(e) => setNewCatIcone(e.target.value)}
                    placeholder="📦"
                    className="w-14 px-2 py-1.5 rounded-lg border border-xa-border bg-xa-surface text-xa-text text-sm text-center focus:outline-none focus:ring-1 focus:ring-xa-primary"
                  />
                  <input
                    type="text"
                    value={newCatNom}
                    onChange={(e) => setNewCatNom(e.target.value)}
                    placeholder="Nom de la catégorie"
                    className="flex-1 px-3 py-1.5 rounded-lg border border-xa-border bg-xa-surface text-xa-text text-sm focus:outline-none focus:ring-1 focus:ring-xa-primary"
                  />
                  <button
                    type="button"
                    onClick={handleCreateCategory}
                    disabled={creatingCat}
                    className="px-3 py-1.5 rounded-lg bg-xa-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {creatingCat ? '…' : 'OK'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Prix */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-xa-text mb-1">
                Prix achat (F) <span className="text-xa-danger">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={form.prix_achat}
                onChange={(e) => setField('prix_achat', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-xa-text mb-1">
                Prix vente (F) <span className="text-xa-danger">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={form.prix_vente}
                onChange={(e) => setField('prix_vente', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary"
              />
            </div>
          </div>

          {/* Stock + seuil */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-xa-text mb-1">Stock initial</label>
              <input
                type="number"
                min="0"
                value={form.stock_actuel}
                onChange={(e) => setField('stock_actuel', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-xa-text mb-1">Seuil alerte</label>
              <input
                type="number"
                min="0"
                value={form.seuil_alerte}
                onChange={(e) => setField('seuil_alerte', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary"
              />
            </div>
          </div>

          {/* Unité */}
          <div>
            <label className="block text-sm font-medium text-xa-text mb-1">Unité</label>
            <input
              type="text"
              value={form.unite}
              onChange={(e) => setField('unite', e.target.value)}
              placeholder="unité, kg, litre…"
              className="w-full px-3 py-2 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-xa-border text-xa-text text-sm font-medium hover:bg-xa-bg transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2.5 rounded-lg bg-xa-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {submitting ? 'Ajout…' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
