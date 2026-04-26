'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

type Props = {
  perteId: string;
  produitNom: string;
  onClose: () => void;
  onSuccess: () => void;
};

export default function ContesterPerteModal({ perteId, produitNom, onClose, onSuccess }: Props) {
  const [raison, setRaison] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (raison.trim().length < 5) {
      setError('Veuillez saisir une raison (min 5 caractères)');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/pertes/${perteId}/contester`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raison: raison.trim() }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? 'Erreur serveur');
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inattendue');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="xa-modal-backdrop">
      <div className="xa-modal-box">
        <div className="xa-modal-body">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-xa-text text-lg">Contester la perte</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-xa-muted hover:text-xa-text p-1"
              aria-label="Fermer"
            >
              <X size={20} />
            </button>
          </div>

          <p className="text-sm text-xa-muted mb-4">
            Perte déclarée sur : <strong className="text-xa-text">{produitNom}</strong>
          </p>

          <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm text-xa-muted mb-1">Raison de la contestation *</label>
              <textarea
                value={raison}
                onChange={(e) => setRaison(e.target.value)}
                rows={4}
                placeholder="Expliquez pourquoi vous contestez cette déclaration…"
                className="w-full rounded-xl border border-xa-border bg-xa-bg text-xa-text text-sm px-3 py-3 resize-none"
                autoFocus
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={loading || raison.trim().length < 5}
              className="w-full py-4 rounded-2xl bg-red-500 text-white text-base font-bold disabled:opacity-40 transition-opacity"
            >
              {loading ? 'Contestation en cours…' : 'Contester la perte'}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 rounded-2xl border border-xa-border text-xa-text text-sm font-medium"
            >
              Annuler
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
