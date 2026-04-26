'use client';

import { useState, useEffect } from 'react';
import { Tag, Plus, ChevronUp, ChevronDown, Pencil, Trash2 } from 'lucide-react';
import type { CategorieProduit } from '@/types/database';

export default function CategoriesSection() {
  const [categories, setCategories] = useState<CategorieProduit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New category form
  const [showForm, setShowForm] = useState(false);
  const [newNom, setNewNom] = useState('');
  const [newIcone, setNewIcone] = useState('📦');
  const [newCouleur, setNewCouleur] = useState('#999999');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNom, setEditNom] = useState('');
  const [editIcone, setEditIcone] = useState('');
  const [editCouleur, setEditCouleur] = useState('');
  const [saving, setSaving] = useState(false);

  // Delete confirm
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((d: CategorieProduit[]) => {
        if (Array.isArray(d)) setCategories(d);
        setLoading(false);
      })
      .catch(() => {
        setError('Impossible de charger les catégories.');
        setLoading(false);
      });
  }, []);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCreateError(null);
    if (!newNom.trim()) { setCreateError('Le nom est obligatoire.'); return; }
    setCreating(true);
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom: newNom.trim(), icone: newIcone, couleur: newCouleur }),
      });
      const json = await res.json() as Record<string, unknown>;
      if (!res.ok) {
        setCreateError(typeof json.error === 'string' ? json.error : 'Erreur');
        return;
      }
      const cat = json as unknown as CategorieProduit;
      setCategories((prev) => [...prev, cat]);
      setNewNom('');
      setNewIcone('📦');
      setNewCouleur('#999999');
      setShowForm(false);
    } finally {
      setCreating(false);
    }
  }

  function startEdit(cat: CategorieProduit) {
    setEditingId(cat.id);
    setEditNom(cat.nom);
    setEditIcone(cat.icone);
    setEditCouleur(cat.couleur);
  }

  async function handleSave(id: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom: editNom.trim(), icone: editIcone, couleur: editCouleur }),
      });
      const json = await res.json() as Record<string, unknown>;
      if (!res.ok) {
        setError(typeof json.error === 'string' ? json.error : 'Erreur');
        return;
      }
      const updated = json as unknown as CategorieProduit;
      setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)));
      setEditingId(null);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeleting(true);
    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      const json = await res.json() as Record<string, unknown>;
      if (!res.ok) {
        setError(typeof json.error === 'string' ? json.error : 'Erreur');
        return;
      }
      setCategories((prev) => prev.filter((c) => c.id !== id));
      setDeletingId(null);
    } finally {
      setDeleting(false);
    }
  }

  async function moveOrdre(id: string, direction: 'up' | 'down') {
    const idx = categories.findIndex((c) => c.id === id);
    if (idx === -1) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= categories.length) return;

    const ordreA = categories[idx].ordre;
    const ordreB = categories[swapIdx].ordre;

    const updated = [...categories];
    updated[idx] = { ...categories[idx], ordre: ordreB };
    updated[swapIdx] = { ...categories[swapIdx], ordre: ordreA };
    setCategories(updated);

    try {
      const [resA, resB] = await Promise.all([
        fetch(`/api/categories/${updated[idx].id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ordre: ordreB }),
        }),
        fetch(`/api/categories/${updated[swapIdx].id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ordre: ordreA }),
        }),
      ]);
      if (!resA.ok || !resB.ok) {
        setCategories(categories);
        setError('Impossible de réordonner les catégories.');
      }
    } catch {
      setCategories(categories);
      setError('Impossible de réordonner les catégories.');
    }
  }

  return (
    <section className="bg-xa-surface border border-xa-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-xa-muted uppercase tracking-wider flex items-center gap-2">
          <Tag size={15} />
          Catégories de produits
        </h2>
        <button
          type="button"
          onClick={() => { setShowForm((v) => !v); setCreateError(null); }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90"
          style={{ background: 'var(--xa-primary)', color: '#fff', minHeight: 36 }}
        >
          <Plus size={15} />
          Ajouter
        </button>
      </div>

      {error && (
        <div className="mb-3 p-3 rounded-lg border border-xa-danger text-xa-danger text-sm">{error}</div>
      )}

      {/* New category form */}
      {showForm && (
        <form onSubmit={handleCreate} className="mb-4 p-4 rounded-lg border border-xa-border bg-xa-bg space-y-3">
          <p className="text-sm font-medium text-xa-text">Nouvelle catégorie</p>
          {createError && (
            <p className="text-xs text-xa-danger">{createError}</p>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={newIcone}
              onChange={(e) => setNewIcone(e.target.value)}
              placeholder="📦"
              className="w-14 px-2 py-2 rounded-lg border border-xa-border bg-xa-surface text-xa-text text-sm text-center focus:outline-none focus:ring-1 focus:ring-xa-primary"
            />
            <input
              type="text"
              value={newNom}
              onChange={(e) => setNewNom(e.target.value)}
              placeholder="Nom"
              required
              className="flex-1 px-3 py-2 rounded-lg border border-xa-border bg-xa-surface text-xa-text text-sm focus:outline-none focus:ring-1 focus:ring-xa-primary"
            />
            <input
              type="color"
              value={newCouleur}
              onChange={(e) => setNewCouleur(e.target.value)}
              className="w-10 h-9 rounded-lg border border-xa-border cursor-pointer bg-xa-bg"
              title="Couleur"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-1.5 rounded-lg border border-xa-border text-xa-text text-sm hover:bg-xa-surface transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={creating}
              className="px-4 py-1.5 rounded-lg bg-xa-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {creating ? 'Création…' : 'Créer'}
            </button>
          </div>
        </form>
      )}

      {/* Category list */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 rounded-lg bg-xa-bg2 animate-pulse" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <p className="text-sm text-xa-muted text-center py-4">
          Aucune catégorie. Cliquez sur &quot;Ajouter&quot; pour créer la première.
        </p>
      ) : (
        <ul className="divide-y divide-xa-border">
          {categories.map((cat, idx) => (
            <li key={cat.id} className="py-3">
              {editingId === cat.id ? (
                <div className="flex gap-2 items-center flex-wrap">
                  <input
                    type="text"
                    value={editIcone}
                    onChange={(e) => setEditIcone(e.target.value)}
                    className="w-12 px-2 py-1.5 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-sm text-center focus:outline-none focus:ring-1 focus:ring-xa-primary"
                  />
                  <input
                    type="text"
                    value={editNom}
                    onChange={(e) => setEditNom(e.target.value)}
                    className="flex-1 min-w-[120px] px-3 py-1.5 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-sm focus:outline-none focus:ring-1 focus:ring-xa-primary"
                  />
                  <input
                    type="color"
                    value={editCouleur}
                    onChange={(e) => setEditCouleur(e.target.value)}
                    className="w-9 h-8 rounded-lg border border-xa-border cursor-pointer bg-xa-bg"
                  />
                  <button
                    type="button"
                    onClick={() => handleSave(cat.id)}
                    disabled={saving}
                    className="px-3 py-1.5 rounded-lg bg-xa-primary text-white text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {saving ? '…' : 'OK'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="px-3 py-1.5 rounded-lg border border-xa-border text-xa-muted text-xs hover:text-xa-text transition-colors"
                  >
                    ✕
                  </button>
                </div>
              ) : deletingId === cat.id ? (
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-sm text-xa-text">
                    Supprimer <strong>{cat.icone} {cat.nom}</strong> ? Les produits associés seront basculés vers &quot;Général&quot;.
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDelete(cat.id)}
                    disabled={deleting}
                    className="px-3 py-1.5 rounded-lg bg-xa-danger text-white text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {deleting ? '…' : 'Confirmer'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingId(null)}
                    className="px-3 py-1.5 rounded-lg border border-xa-border text-xa-muted text-xs hover:text-xa-text transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ background: cat.couleur }}
                  />
                  <span className="text-base">{cat.icone}</span>
                  <span className="flex-1 text-sm font-medium text-xa-text">{cat.nom}</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveOrdre(cat.id, 'up')}
                      disabled={idx === 0}
                      className="p-1 rounded text-xa-muted hover:text-xa-text transition-colors disabled:opacity-30"
                      aria-label="Monter"
                    >
                      <ChevronUp size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveOrdre(cat.id, 'down')}
                      disabled={idx === categories.length - 1}
                      className="p-1 rounded text-xa-muted hover:text-xa-text transition-colors disabled:opacity-30"
                      aria-label="Descendre"
                    >
                      <ChevronDown size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => startEdit(cat)}
                      className="p-1 rounded text-xa-muted hover:text-xa-text transition-colors"
                      aria-label="Modifier"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingId(cat.id)}
                      className="p-1 rounded text-xa-muted hover:text-xa-danger transition-colors"
                      aria-label="Supprimer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
