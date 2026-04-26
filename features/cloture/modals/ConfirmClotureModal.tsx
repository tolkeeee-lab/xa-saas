'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { formatFCFA } from '@/lib/format';

type Props = {
  boutiqueId: string;
  date: string;
  cashCompte: number;
  cashTheorique: number;
  ecart: number;
  nbTransactions: number;
  caCalcule: number;
  onClose: () => void;
  onSuccess: () => void;
};

export default function ConfirmClotureModal({
  boutiqueId,
  date,
  cashCompte,
  cashTheorique,
  ecart,
  nbTransactions,
  caCalcule,
  onClose,
  onSuccess,
}: Props) {
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ecartSign = ecart > 0 ? '+' : '';
  const ecartColor =
    ecart === 0 ? 'text-green-600' : ecart > 0 ? 'text-amber-500' : 'text-red-500';

  async function handleConfirm() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/cloture/jour', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boutique_id: boutiqueId,
          date,
          cash_compte: cashCompte,
          note: note || undefined,
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(json.error ?? 'Erreur serveur');
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
        <div className="xa-modal-body">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-xa-text text-lg">Confirmer la clôture</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-xa-muted hover:text-xa-text p-1"
              aria-label="Fermer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Summary */}
          <div className="bg-xa-bg rounded-2xl p-4 flex flex-col gap-2 mb-4 border border-xa-border">
            <div className="flex justify-between text-sm">
              <span className="text-xa-muted">Transactions</span>
              <span className="font-medium text-xa-text">{nbTransactions}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-xa-muted">CA calculé</span>
              <span className="font-medium text-xa-text">{formatFCFA(caCalcule)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-xa-muted">Cash théorique</span>
              <span className="font-medium text-xa-text">{formatFCFA(cashTheorique)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-xa-muted">Cash compté</span>
              <span className="font-semibold text-xa-text">{formatFCFA(cashCompte)}</span>
            </div>
            <div className="border-t border-xa-border pt-2 flex justify-between">
              <span className="text-sm font-medium text-xa-text">Écart</span>
              <span className={`text-base font-bold ${ecartColor}`}>
                {ecartSign}
                {formatFCFA(ecart)}
              </span>
            </div>
          </div>

          {/* Note */}
          <div className="flex flex-col gap-1 mb-4">
            <label className="text-sm font-medium text-xa-text" htmlFor="cloture-note">
              Note (optionnel)
            </label>
            <textarea
              id="cloture-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Remarque, anomalie…"
              className="w-full rounded-xl border border-xa-border bg-xa-bg text-xa-text text-sm px-3 py-2 resize-none focus:outline-none focus:border-xa-primary"
            />
          </div>

          {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3 rounded-2xl border border-xa-border text-xa-text text-sm font-medium disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={() => void handleConfirm()}
              disabled={loading}
              className="flex-1 py-3 rounded-2xl bg-xa-primary text-white text-sm font-bold disabled:opacity-50"
            >
              {loading ? 'Clôture…' : 'Confirmer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
