'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Tag, Plus, Pencil, Trash2, X } from 'lucide-react';
import type { CategorieProduit } from '@/types/database';
import CategoryFormModal from './CategoryFormModal';

// ─── Toast ────────────────────────────────────────────────────────────────────

type ToastItem = { id: number; message: string; type: 'success' | 'error' };

function ToastContainer({ items, onRemove }: { items: ToastItem[]; onRemove: (id: number) => void }) {
  if (items.length === 0) return null;
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {items.map((t) => (
        <div
          key={t.id}
          onClick={() => onRemove(t.id)}
          className="pointer-events-auto flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium cursor-pointer"
          style={{
            background: t.type === 'success' ? 'var(--xa-primary)' : 'var(--xa-danger, #EF4444)',
            color: '#fff',
            minWidth: 220,
          }}
        >
          <span>{t.type === 'success' ? '✓' : '✕'}</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Delete confirm dialog ────────────────────────────────────────────────────

type DeleteDialogProps = {
  cat: CategorieProduit;
  deleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

function DeleteDialog({ cat, deleting, onConfirm, onCancel }: DeleteDialogProps) {
  return (
    <div
      className="xa-modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="xa-modal-box" role="alertdialog" aria-modal="true" aria-label="Confirmer la suppression">
        <div className="xa-modal-header">
          <h3 className="text-base font-semibold text-xa-text">Supprimer la catégorie</h3>
          <button type="button" onClick={onCancel} className="xa-modal-close" aria-label="Fermer">
            <X size={20} />
          </button>
        </div>
        <div className="xa-modal-body space-y-4">
          <p className="text-sm text-xa-text">
            Supprimer la catégorie <strong>{cat.icone} {cat.nom}</strong> ?
          </p>
          <p className="text-sm text-xa-muted">
            Les produits associés ne seront pas supprimés mais devront être recatégorisés.
          </p>
          <div className="flex gap-2 justify-end pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-lg border border-xa-border text-xa-text text-sm hover:bg-xa-surface transition-colors"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={deleting}
              className="px-5 py-2 rounded-lg text-white text-sm font-semibold transition-opacity disabled:opacity-50"
              style={{ background: 'var(--xa-danger, #EF4444)' }}
            >
              {deleting ? 'Suppression…' : 'Supprimer définitivement'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CategoriesManager() {
  const [categories, setCategories] = useState<CategorieProduit[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Modal state
  const [formTarget, setFormTarget] = useState<CategorieProduit | null | undefined>(undefined);
  // undefined = closed, null = create, CategorieProduit = edit
  const [deleteTarget, setDeleteTarget] = useState<CategorieProduit | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    const timers = toastTimers.current;
    return () => { timers.forEach((t) => clearTimeout(t)); };
  }, []);

  function showToast(message: string, type: 'success' | 'error') {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    const timer = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      toastTimers.current.delete(id);
    }, 3000);
    toastTimers.current.set(id, timer);
  }

  function removeToast(id: number) {
    const timer = toastTimers.current.get(id);
    if (timer) { clearTimeout(timer); toastTimers.current.delete(id); }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  const loadCategories = useCallback(() => {
    setFetchError(null);
    fetch('/api/categories')
      .then((r) => r.json())
      .then((d: CategorieProduit[]) => {
        if (Array.isArray(d)) setCategories(d);
        setLoading(false);
      })
      .catch(() => {
        setFetchError('Impossible de charger les catégories.');
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  function handleSaved(saved: CategorieProduit) {
    setFormTarget(undefined);
    loadCategories();
    showToast(
      formTarget === null
        ? `Catégorie "${saved.nom}" créée.`
        : `Catégorie "${saved.nom}" mise à jour.`,
      'success',
    );
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/categories/${deleteTarget.id}`, { method: 'DELETE' });
      if (res.status === 400) {
        showToast('Général ne peut pas être supprimée.', 'error');
        setDeleteTarget(null);
        return;
      }
      if (!res.ok) {
        const json = (await res.json()) as Record<string, unknown>;
        showToast(typeof json.error === 'string' ? json.error : 'Erreur lors de la suppression.', 'error');
        return;
      }
      setCategories((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      showToast(`Catégorie "${deleteTarget.nom}" supprimée.`, 'success');
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <ToastContainer items={toasts} onRemove={removeToast} />

      <section className="bg-xa-surface border border-xa-border rounded-xl p-5 relative">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-xa-muted uppercase tracking-wider flex items-center gap-2">
            <Tag size={15} />
            Catégories de produits
          </h2>
        </div>

        {fetchError && (
          <div className="mb-3 p-3 rounded-lg border border-xa-danger text-xa-danger text-sm">
            {fetchError}
          </div>
        )}

        {/* Category list */}
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 rounded-lg bg-xa-bg2 animate-pulse" />
            ))}
          </div>
        ) : (
          <ul className="divide-y divide-xa-border">
            {categories.map((cat) => (
              <li key={cat.id} className="flex items-center gap-3 py-3">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ background: cat.couleur }}
                />
                <span className="text-lg leading-none">{cat.icone}</span>
                <span className="flex-1 text-sm font-medium text-xa-text truncate">{cat.nom}</span>
                {cat.nom !== 'Général' && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => setFormTarget(cat)}
                      className="p-1.5 rounded-lg text-xa-muted hover:text-xa-text hover:bg-xa-bg2 transition-colors"
                      aria-label={`Modifier ${cat.nom}`}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(cat)}
                      className="p-1.5 rounded-lg text-xa-muted hover:text-xa-danger hover:bg-xa-bg2 transition-colors"
                      aria-label={`Supprimer ${cat.nom}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        {/* Add button */}
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setFormTarget(null)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-xa-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <Plus size={16} />
            Ajouter une catégorie
          </button>
        </div>
      </section>

      {/* Form modal (add / edit) */}
      {formTarget !== undefined && (
        <CategoryFormModal
          cat={formTarget}
          onClose={() => setFormTarget(undefined)}
          onSaved={handleSaved}
        />
      )}

      {/* Delete confirmation dialog */}
      {deleteTarget && (
        <DeleteDialog
          cat={deleteTarget}
          deleting={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
}
