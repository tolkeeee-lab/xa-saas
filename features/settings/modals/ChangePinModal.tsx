'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { hashPin } from '@/lib/pinHash';

type ChangePinModalProps = {
  onClose: () => void;
};

export default function ChangePinModal({ onClose }: ChangePinModalProps) {
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);

    if (!/^\d{4,6}$/.test(newPin)) {
      setMsg({ type: 'error', text: 'Le nouveau PIN doit contenir 4 à 6 chiffres.' });
      return;
    }
    if (newPin !== confirmPin) {
      setMsg({ type: 'error', text: 'Les PINs ne correspondent pas.' });
      return;
    }

    setLoading(true);
    const [oldPinHash, newPinHash] = await Promise.all([hashPin(oldPin), hashPin(newPin)]);

    const res = await fetch('/api/settings/pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oldPin: oldPinHash, newPin: newPinHash }),
    });

    const data = (await res.json()) as { ok?: boolean; error?: string };
    setLoading(false);

    if (!res.ok) {
      setMsg({ type: 'error', text: data.error ?? 'Erreur lors du changement de PIN.' });
    } else {
      setMsg({ type: 'success', text: 'PIN mis à jour avec succès !' });
      setTimeout(onClose, 1200);
    }
  }

  return (
    <div className="xa-modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="xa-modal-box" role="dialog" aria-modal="true" aria-label="Changer mon PIN">
        <div className="xa-modal-header">
          <h3 className="text-base font-semibold text-xa-text">Changer mon PIN caisse</h3>
          <button type="button" onClick={onClose} className="xa-modal-close">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="xa-modal-body space-y-4">
          {msg && (
            <div
              className={`p-3 rounded-lg text-sm border ${
                msg.type === 'success'
                  ? 'border-xa-green text-xa-green'
                  : 'border-xa-danger text-xa-danger'
              }`}
            >
              {msg.text}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-xa-text mb-1.5">
              Ancien PIN
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={oldPin}
              onChange={(e) => setOldPin(e.target.value.replace(/\D/g, ''))}
              className="w-full px-3 py-2.5 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-xa-text mb-1.5">
              Nouveau PIN (4-6 chiffres)
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
              className="w-full px-3 py-2.5 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-xa-text mb-1.5">
              Confirmer le nouveau PIN
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
              className="w-full px-3 py-2.5 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary"
              required
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-xa-border text-xa-text text-sm hover:bg-xa-bg2 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-lg text-white text-sm font-semibold transition-opacity disabled:opacity-50"
              style={{ background: 'var(--xa-primary)' }}
            >
              {loading ? 'Changement…' : 'Changer le PIN'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
