'use client';

/**
 * CaisseLockScreen — full-screen lock overlay for the POS interface.
 *
 * Displayed when:
 *  - the idle timeout fires (reason = 'idle')
 *  - the cashier clicks "Verrouiller" (reason = 'manual')
 *  - the caisse session token has expired (reason = 'expired')
 *
 * The cashier must enter the boutique PIN to resume.  On success the parent
 * receives the new caisse session token + expiry via `onUnlock`.
 */

import { useEffect, useRef, useState } from 'react';
import { hashPin } from '@/lib/pinHash';

export type LockReason = 'idle' | 'manual' | 'expired';

interface CaisseLockScreenProps {
  boutiqueId: string;
  boutiqueNom: string;
  reason: LockReason;
  /** Called with the new caisse session after successful PIN verification. */
  onUnlock: (token: string, expiresAt: string) => void;
}

const REASON_LABELS: Record<LockReason, string> = {
  idle: 'La caisse a été verrouillée après inactivité.',
  manual: 'La caisse a été verrouillée manuellement.',
  expired: 'La session caisse a expiré. Veuillez vous reconnecter.',
};

export default function CaisseLockScreen({
  boutiqueId,
  boutiqueNom,
  reason,
  onUnlock,
}: CaisseLockScreenProps) {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus the PIN field as soon as the overlay appears.
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pin || loading) return;

    // Enforce a minimum of 4 digits to reject accidentally short PINs.
    if (pin.length < 4) {
      setError('Le PIN doit comporter au moins 4 chiffres.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const pin_hash = await hashPin(pin);
      const res = await fetch('/api/caisse/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boutique_id: boutiqueId, pin_hash }),
      });

      const data = (await res.json()) as {
        error?: string;
        session?: { token: string; expires_at: string };
      };

      if (!res.ok) {
        setError(data.error ?? 'PIN incorrect. Réessayez.');
        setPin('');
        inputRef.current?.focus();
        return;
      }

      if (data.session) {
        onUnlock(data.session.token, data.session.expires_at);
      }
    } catch {
      setError('Erreur réseau. Vérifiez votre connexion et réessayez.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    >
      <div className="bg-xa-surface border border-xa-border rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4">
        {/* Header */}
        <div className="text-center mb-6">
          <span className="text-5xl" role="img" aria-label="Caisse verrouillée">
            🔒
          </span>
          <h2 className="text-lg font-bold text-xa-titre mt-3 mb-1">Caisse verrouillée</h2>
          <p className="text-sm text-xa-muted">{REASON_LABELS[reason]}</p>
          <p className="text-xs text-xa-boutique font-medium mt-2">{boutiqueNom}</p>
        </div>

        {/* PIN form */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label
              htmlFor="caisse-lock-pin"
              className="block text-xs font-semibold text-xa-muted mb-1"
            >
              PIN caisse
            </label>
            <input
              id="caisse-lock-pin"
              ref={inputRef}
              type="password"
              inputMode="numeric"
              autoComplete="current-password"
              maxLength={8}
              value={pin}
              onChange={(e) => {
                setPin(e.target.value.replace(/\D/g, ''));
                setError('');
              }}
              placeholder="••••"
              disabled={loading}
              className="w-full px-4 py-3 rounded-xl border border-xa-border bg-xa-bg text-xa-text text-center text-xl tracking-widest focus:outline-none focus:ring-2 focus:ring-xa-primary disabled:opacity-60"
            />
          </div>

          {error && (
            <p className="text-xs font-medium text-center" style={{ color: '#ff3341' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!pin || loading}
            className="w-full py-3 rounded-xl bg-xa-primary text-white font-semibold text-sm transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Vérification…' : 'Déverrouiller'}
          </button>
        </form>
      </div>
    </div>
  );
}
