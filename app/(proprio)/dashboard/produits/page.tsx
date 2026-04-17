'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase-browser';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatFCFA } from '@/lib/format';
import type { Boutique, Produit } from '@/types/database';

type StockStatus = 'rupture' | 'bas' | 'ok';

function getStockStatus(produit: Produit): StockStatus {
  if (produit.stock_actuel <= 0) return 'rupture';
  if (produit.stock_actuel <= produit.seuil_alerte) return 'bas';
  return 'ok';
}

const STATUS_CONFIG: Record<StockStatus, { label: string; classes: string }> = {
  rupture: { label: 'Rupture', classes: 'bg-cotton-rose-100 text-xa-danger dark:bg-cotton-rose-950' },
  bas: { label: 'Stock bas', classes: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-bright-amber-400' },
  ok: { label: 'OK', classes: 'bg-aquamarine-100 text-aquamarine-700 dark:bg-aquamarine-950' },
};

const EMPTY_FORM = {
  nom: '',
  description: '',
  categorie: '',
  prix_achat: '',
  prix_vente: '',
  stock_actuel: '',
  seuil_alerte: '',
  unite: 'unité',
};

export default function ProduitsPage() {
  const [boutiques, setBoutiques] = useState<Boutique[]>([]);
  const [activeBoutiqueId, setActiveBoutiqueId] = useState<string>('');
  const [produits, setProduits] = useState<Produit[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function loadBoutiques() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('boutiques')
        .select('*')
        .eq('proprietaire_id', user.id)
        .eq('actif', true)
        .order('created_at', { ascending: true });

      const list = data ?? [];
      setBoutiques(list);

      const stored = localStorage.getItem('xa-boutique-active');
      const active = list.find((b) => b.id === stored) ?? list[0];
      if (active) setActiveBoutiqueId(active.id);
    }
    loadBoutiques();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadProduits = useCallback(async () => {
    if (!activeBoutiqueId) return;
    setLoading(true);
    const { data } = await supabase
      .from('produits')
      .select('*')
      .eq('boutique_id', activeBoutiqueId)
      .eq('actif', true)
      .order('nom', { ascending: true });
    setProduits(data ?? []);
    setLoading(false);
  }, [activeBoutiqueId, supabase]);

  useEffect(() => {
    loadProduits();
  }, [loadProduits]);

  const categories = Array.from(
    new Set(produits.map((p) => (p as Produit & { categorie?: string }).categorie ?? 'Général').filter(Boolean)),
  );

  const filtered = produits.filter((p) => {
    const cat = (p as Produit & { categorie?: string }).categorie ?? 'Général';
    return !categoryFilter || cat === categoryFilter;
  });

  async function handleAddProduit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);

    if (!form.nom.trim()) { setFormError('Le nom est obligatoire.'); return; }
    if (!form.prix_vente || isNaN(Number(form.prix_vente))) { setFormError('Prix de vente invalide.'); return; }
    if (!form.prix_achat || isNaN(Number(form.prix_achat))) { setFormError("Prix d'achat invalide."); return; }

    setSubmitting(true);
    const { error } = await supabase.from('produits').insert({
      boutique_id: activeBoutiqueId,
      nom: form.nom.trim(),
      description: form.description.trim() || null,
      prix_achat: Number(form.prix_achat),
      prix_vente: Number(form.prix_vente),
      stock_actuel: Number(form.stock_actuel) || 0,
      seuil_alerte: Number(form.seuil_alerte) || 5,
      unite: form.unite || 'unité',
      actif: true,
    });

    setSubmitting(false);
    if (error) { setFormError(error.message); return; }

    setShowModal(false);
    setForm(EMPTY_FORM);
    await loadProduits();
  }

  const activeBoutique = boutiques.find((b) => b.id === activeBoutiqueId);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Boutique selector */}
        <select
          value={activeBoutiqueId}
          onChange={(e) => {
            setActiveBoutiqueId(e.target.value);
            localStorage.setItem('xa-boutique-active', e.target.value);
          }}
          className="px-3 py-2 rounded-lg border border-xa-border bg-xa-surface text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary"
        >
          {boutiques.map((b) => (
            <option key={b.id} value={b.id}>
              {b.nom}
            </option>
          ))}
        </select>

        {/* Category filter */}
        {categories.length > 0 && (
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-xa-border bg-xa-surface text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary"
          >
            <option value="">Toutes catégories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        )}

        <div className="flex-1" />

        <button
          onClick={() => { setShowModal(true); setFormError(null); setForm(EMPTY_FORM); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-xa-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Ajouter produit
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-xa-surface border border-xa-border rounded-xl p-12 text-center">
          <p className="text-xa-muted">
            {boutiques.length === 0
              ? 'Créez d\'abord une boutique.'
              : 'Aucun produit dans cette boutique.'}
          </p>
        </div>
      ) : (
        <div className="bg-xa-surface border border-xa-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-xa-border bg-xa-bg">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-xa-muted uppercase tracking-wider">
                    Produit
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-xa-muted uppercase tracking-wider">
                    Prix vente
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-xa-muted uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-xa-muted uppercase tracking-wider">
                    Statut
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const status = getStockStatus(p);
                  const cfg = STATUS_CONFIG[status];
                  return (
                    <tr key={p.id} className="border-b border-xa-border last:border-0 hover:bg-xa-bg transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-xa-text">{p.nom}</p>
                        {p.description && (
                          <p className="text-xs text-xa-muted truncate max-w-[200px]">{p.description}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-xa-text">
                        {formatFCFA(p.prix_vente)}
                      </td>
                      <td className="px-4 py-3 text-right text-xa-text">
                        {p.stock_actuel} {p.unite}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.classes}`}>
                          {cfg.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add product modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-xa-surface border border-xa-border rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-xa-border">
              <h2 className="font-semibold text-xa-text">
                Nouveau produit — {activeBoutique?.nom}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-xa-muted hover:text-xa-text transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddProduit} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 rounded-lg border border-xa-danger text-xa-danger text-sm">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-xa-text mb-1">
                  Nom <span className="text-xa-danger">*</span>
                </label>
                <input
                  type="text"
                  value={form.nom}
                  onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-xa-text mb-1">
                    Prix achat (FCFA) <span className="text-xa-danger">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.prix_achat}
                    onChange={(e) => setForm((f) => ({ ...f, prix_achat: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-xa-text mb-1">
                    Prix vente (FCFA) <span className="text-xa-danger">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.prix_vente}
                    onChange={(e) => setForm((f) => ({ ...f, prix_vente: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-xa-text mb-1">Stock initial</label>
                  <input
                    type="number"
                    min="0"
                    value={form.stock_actuel}
                    onChange={(e) => setForm((f) => ({ ...f, stock_actuel: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-xa-text mb-1">Seuil alerte</label>
                  <input
                    type="number"
                    min="0"
                    value={form.seuil_alerte}
                    onChange={(e) => setForm((f) => ({ ...f, seuil_alerte: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-xa-text mb-1">Unité</label>
                  <input
                    type="text"
                    value={form.unite}
                    onChange={(e) => setForm((f) => ({ ...f, unite: e.target.value }))}
                    placeholder="unité, kg, litre…"
                    className="w-full px-3 py-2 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-xa-text mb-1">Catégorie</label>
                  <input
                    type="text"
                    value={form.categorie}
                    onChange={(e) => setForm((f) => ({ ...f, categorie: e.target.value }))}
                    placeholder="Général"
                    className="w-full px-3 py-2 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
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
      )}
    </div>
  );
}
