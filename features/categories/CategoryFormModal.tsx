'use client';

import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import type { CategorieProduit } from '@/types/database';

const EMOJIS = [
  '📦', '🍚', '🥤', '🧼', '🥗', '🥖', '📌', '🍞',
  '🥛', '🧃', '🍷', '🍺', '☕', '🫖', '🍫', '🍬',
  '🍪', '🍝', '🍕', '🍔', '💄', '🧴', '🧻', '🧽',
  '🧹', '🪥', '💊', '🩹', '📱', '🔌', '📚', '✏️',
  '🖊', '📞', '💡', '🔋', '🪒', '🧦', '👕', '🩴',
];

const COLORS = [
  '#999999', '#EF4444', '#F59E0B', '#EAB308',
  '#10B981', '#06B6D4', '#3B82F6', '#6366F1',
  '#8B5CF6', '#EC4899', '#F97316', '#84CC16',
];

type CategoryFormModalProps = {
  cat: CategorieProduit | null;
  onClose: () => void;
  onSaved: (cat: CategorieProduit) => void;
};

export default function CategoryFormModal({ cat, onClose, onSaved }: CategoryFormModalProps) {
  const isEdit = cat !== null;
  const [nom, setNom] = useState(cat?.nom ?? '');
  const [icone, setIcone] = useState(cat?.icone ?? '📦');
  const [couleur, setCouleur] = useState(cat?.couleur ?? '#999999');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nomRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nomRef.current?.focus();
  }, []);

  const isUnchanged =
    isEdit &&
    nom.trim() === cat.nom &&
    icone === cat.icone &&
    couleur === cat.couleur;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const trimmed = nom.trim();
    if (!trimmed || trimmed.length > 50) {
      setError('Le nom doit faire entre 1 et 50 caractères.');
      return;
    }

    setSaving(true);
    try {
      const url = isEdit ? `/api/categories/${cat.id}` : '/api/categories';
      const method = isEdit ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom: trimmed, icone, couleur }),
      });

      const json = (await res.json()) as Record<string, unknown>;

      if (!res.ok) {
        if (res.status === 409) {
          setError('Cette catégorie existe déjà.');
        } else {
          setError(typeof json.error === 'string' ? json.error : 'Une erreur est survenue.');
        }
        return;
      }

      onSaved(json as unknown as CategorieProduit);
    } catch {
      setError('Impossible de contacter le serveur.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="xa-modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="xa-modal-box" role="dialog" aria-modal="true" aria-label={isEdit ? 'Modifier la catégorie' : 'Nouvelle catégorie'}>
        <div className="xa-modal-header">
          <h3 className="text-base font-semibold text-xa-text">
            {isEdit ? `Modifier : ${cat.icone} ${cat.nom}` : 'Nouvelle catégorie'}
          </h3>
          <button type="button" onClick={onClose} className="xa-modal-close" aria-label="Fermer">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="xa-modal-body space-y-5">
          {error && (
            <p className="p-3 rounded-lg border border-xa-danger text-xa-danger text-sm">{error}</p>
          )}

          {/* Nom */}
          <div>
            <label className="block text-sm font-medium text-xa-text mb-1.5">
              Nom <span className="text-xa-danger">*</span>
            </label>
            <input
              ref={nomRef}
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              maxLength={50}
              required
              placeholder="ex : Cosmétiques"
              className="w-full px-3 py-2.5 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary"
            />
            <p className="text-xs text-xa-muted mt-1 text-right">{nom.length}/50</p>
          </div>

          {/* Icône picker */}
          <div>
            <label className="block text-sm font-medium text-xa-text mb-2">Icône</label>
            <div className="grid grid-cols-8 gap-1.5">
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIcone(emoji)}
                  className="h-9 w-full rounded-lg text-lg flex items-center justify-center transition-transform hover:scale-110"
                  style={
                    icone === emoji
                      ? { background: 'var(--xa-primary)', border: '2px solid var(--xa-primary)', opacity: 1 }
                      : { background: 'var(--xa-bg2)', border: '2px solid transparent' }
                  }
                  aria-label={emoji}
                  aria-pressed={icone === emoji}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Couleur picker */}
          <div>
            <label className="block text-sm font-medium text-xa-text mb-2">Couleur</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCouleur(c)}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                  style={{
                    background: c,
                    border: couleur === c ? '2px solid #000' : '2px solid transparent',
                    outline: couleur === c ? '2px solid rgba(0,0,0,0.2)' : 'none',
                  }}
                  aria-label={c}
                  aria-pressed={couleur === c}
                >
                  {couleur === c && (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2 7l3.5 3.5L12 3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-xa-border text-xa-text text-sm hover:bg-xa-surface transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving || !nom.trim() || isUnchanged}
              className="px-5 py-2 rounded-lg bg-xa-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
