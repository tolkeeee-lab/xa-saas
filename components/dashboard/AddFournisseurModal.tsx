'use client';

import { useState } from 'react';

interface AddFournisseurModalProps {
  onClose: () => void;
  onCreated: () => void;
}

export default function AddFournisseurModal({ onClose, onCreated }: AddFournisseurModalProps) {
  const [nom, setNom] = useState('');
  const [specialite, setSpecialite] = useState('');
  const [delai_livraison, setDelaiLivraison] = useState('');
  const [telephone, setTelephone] = useState('');
  const [note, setNote] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nom.trim()) { setError('Le nom est obligatoire'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/fournisseurs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom, specialite, delai_livraison, telephone, note }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? 'Erreur');
        return;
      }
      onCreated();
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-xa-surface border border-xa-border rounded-xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-xa-text">Nouveau fournisseur</h2>
          <button onClick={onClose} className="text-xa-muted hover:text-xa-text">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-xa-muted mb-1 block">Nom *</label>
            <input
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary"
              placeholder="Nom du fournisseur"
            />
          </div>

          <div>
            <label className="text-xs text-xa-muted mb-1 block">Spécialité</label>
            <input
              value={specialite}
              onChange={(e) => setSpecialite(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary"
              placeholder="Ex: Épicerie, Boissons…"
            />
          </div>

          <div>
            <label className="text-xs text-xa-muted mb-1 block">Délai de livraison</label>
            <input
              value={delai_livraison}
              onChange={(e) => setDelaiLivraison(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary"
              placeholder="Ex: 2-3 jours"
            />
          </div>

          <div>
            <label className="text-xs text-xa-muted mb-1 block">Téléphone</label>
            <input
              value={telephone}
              onChange={(e) => setTelephone(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary"
              placeholder="+229…"
            />
          </div>

          <div>
            <label className="text-xs text-xa-muted mb-1 block">Note</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setNote(star)}
                  className={`text-xl ${star <= note ? 'text-xa-accent' : 'text-xa-muted'}`}
                >
                  {star <= note ? '★' : '☆'}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-xa-danger text-xs">{error}</p>}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-xa-border text-xa-text text-sm hover:bg-xa-bg transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 rounded-lg bg-xa-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'Création…' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
