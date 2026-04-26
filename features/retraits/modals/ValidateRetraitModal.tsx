'use client';

import { useState } from 'react';
import { X, CheckCircle } from 'lucide-react';
import type { RetraitClient } from '@/types/database';

type Props = {
  retrait: RetraitClient;
  employeId: string;
  onClose: () => void;
  onSuccess: () => void;
};

export default function ValidateRetraitModal({ retrait, employeId, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/retraits/${retrait.id}/mark-retired`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employe_id: employeId }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        setError(data.error ?? 'Erreur lors de la validation');
        return;
      }
      onSuccess();
    } catch {
      setError('Erreur réseau');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="xa-modal-backdrop">
      <div className="xa-modal-box">
        <div className="xa-modal-header">
          <h2 className="font-bold text-xa-text">Confirmer le retrait</h2>
          <button
            type="button"
            className="xa-modal-close"
            onClick={onClose}
            aria-label="Fermer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="xa-modal-body flex flex-col gap-4">
          <div className="rounded-xl bg-xa-bg border border-xa-border p-4 flex flex-col gap-1">
            <p className="text-xs text-xa-muted">Client</p>
            <p className="font-semibold text-xa-text">{retrait.client_nom}</p>
            <p className="text-xa-muted text-sm">{retrait.client_telephone}</p>
          </div>

          <div className="flex justify-between items-center font-bold text-xa-text">
            <span>Total à valider</span>
            <span>{retrait.total.toLocaleString('fr-FR')} FCFA</span>
          </div>

          <p className="text-xa-muted text-sm text-center">
            Confirmez que le client a bien récupéré sa commande.
          </p>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="flex items-center justify-center gap-2 bg-xa-primary text-white rounded-xl px-4 py-3 font-semibold text-base w-full min-h-[44px] disabled:opacity-50"
          >
            <CheckCircle size={20} />
            {loading ? 'Validation…' : 'Confirmer le retrait'}
          </button>
        </div>
      </div>
    </div>
  );
}
