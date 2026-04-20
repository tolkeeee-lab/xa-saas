'use client';

/**
 * EmployeLockScreenClient — PIN authentication screen for employees.
 *
 * Modes:
 *  - "invite": employee arrives via personal invite link (/e/[code]).
 *    The employee is pre-selected; only the PIN pad is shown.
 *  - "list": tablet/shared device — shows employee selector then PIN pad.
 *
 * On successful PIN: calls POST /api/employe/verify-pin, which sets the
 * 30-day session cookie, then redirects to /caisse.
 */

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { hashPin } from '@/lib/pinHash';
import type { Employe, Boutique } from '@/types/database';

type EmployeMinimal = Pick<Employe, 'id' | 'nom' | 'prenom' | 'role' | 'boutique_id'>;
type BoutiqueMinimal = Pick<Boutique, 'id' | 'nom' | 'ville' | 'couleur_theme'>;

interface EmployeLockScreenClientProps {
  mode: 'invite' | 'list';
  preselectedEmploye?: EmployeMinimal;
  boutique?: BoutiqueMinimal | null;
}

const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '✓'];

export default function EmployeLockScreenClient({
  mode,
  preselectedEmploye,
  boutique,
}: EmployeLockScreenClientProps) {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const employe = preselectedEmploye;

  function handleDigit(digit: string) {
    if (digit === '⌫') {
      setPin((p) => p.slice(0, -1));
      setError('');
      return;
    }
    if (digit === '✓') {
      void handleSubmit();
      return;
    }
    if (pin.length >= 4) return;
    const next = pin + digit;
    setPin(next);
    if (next.length === 4) {
      void submitPin(next);
    }
  }

  async function handleSubmit() {
    if (pin.length < 4) {
      setError('Le PIN doit comporter 4 chiffres.');
      return;
    }
    await submitPin(pin);
  }

  async function submitPin(pinValue: string) {
    if (!employe) return;
    if (loading) return;

    setLoading(true);
    setError('');

    try {
      const pin_hash = await hashPin(pinValue);
      const res = await fetch('/api/employe/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employe_id: employe.id, pin_hash }),
      });

      const data = (await res.json()) as {
        error?: string;
        success?: boolean;
        locked_until?: string;
      };

      if (!res.ok) {
        if (res.status === 423 && data.locked_until) {
          const minutes = Math.ceil(
            (new Date(data.locked_until).getTime() - Date.now()) / 60000,
          );
          setError(`⏰ Trop de tentatives. Réessaye dans ${minutes} min.`);
        } else {
          setError(data.error ?? 'PIN incorrect. Réessaye.');
        }
        setPin('');
        inputRef.current?.focus();
        return;
      }

      if (data.success) {
        router.push('/caisse');
      }
    } catch {
      setError('Erreur réseau. Vérifie ta connexion et réessaye.');
    } finally {
      setLoading(false);
    }
  }

  const themeColor = boutique?.couleur_theme ?? '#1c5d7d';
  const initials = employe
    ? `${employe.prenom.charAt(0)}${employe.nom.charAt(0)}`.toUpperCase()
    : '?';

  if (mode === 'invite' && !employe) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-xa-bg">
        <p className="text-xa-muted">Employé introuvable.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-xa-bg px-4">
      <div className="w-full max-w-sm">
        {/* Boutique / Employee info */}
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-3"
            style={{ backgroundColor: themeColor }}
          >
            {initials}
          </div>
          {employe && (
            <h1 className="text-xl font-bold text-xa-text">
              {employe.prenom} {employe.nom}
            </h1>
          )}
          {boutique && (
            <p className="text-sm text-xa-muted mt-0.5">{boutique.nom} · {boutique.ville}</p>
          )}
          <p className="text-xs text-xa-muted mt-3">Entre ton PIN à 4 chiffres</p>
        </div>

        {/* PIN dots */}
        <div className="flex justify-center gap-4 mb-6">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full border-2 transition-all ${
                i < pin.length
                  ? 'border-xa-primary bg-xa-primary'
                  : 'border-xa-border bg-transparent'
              }`}
            />
          ))}
        </div>

        {/* Hidden input for keyboard input */}
        <input
          ref={inputRef}
          type="tel"
          inputMode="numeric"
          maxLength={4}
          value={pin}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, '').slice(0, 4);
            setPin(val);
            setError('');
            if (val.length === 4) void submitPin(val);
          }}
          className="sr-only"
          aria-label="PIN"
        />

        {/* PIN pad */}
        <div className="grid grid-cols-3 gap-3">
          {DIGITS.map((digit) => {
            const isBackspace = digit === '⌫';
            const isConfirm = digit === '✓';
            return (
              <button
                key={digit}
                type="button"
                onClick={() => handleDigit(digit)}
                disabled={loading || (isConfirm && pin.length < 4)}
                className={`h-14 rounded-xl text-lg font-semibold transition-all select-none ${
                  isConfirm
                    ? 'bg-xa-primary text-white disabled:opacity-40'
                    : isBackspace
                      ? 'bg-xa-surface border border-xa-border text-xa-muted hover:bg-xa-bg'
                      : 'bg-xa-surface border border-xa-border text-xa-text hover:bg-xa-bg active:scale-95'
                } disabled:cursor-not-allowed`}
              >
                {loading && isConfirm ? (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  digit
                )}
              </button>
            );
          })}
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm text-center">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
