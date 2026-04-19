'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { hashPin } from '@/lib/pinHash';
import { EMPLOYE_STORAGE_KEY } from '@/lib/employe-session';

interface EmployeLockScreenProps {
  /** Optional boutique_id pre-selected on the device. */
  defaultBoutiqueId?: string;
  boutiques: { id: string; nom: string }[];
}

export default function EmployeLockScreen({ defaultBoutiqueId, boutiques }: EmployeLockScreenProps) {
  const router = useRouter();
  const [boutiqueId, setBoutiqueId] = useState<string>(
    defaultBoutiqueId ?? boutiques[0]?.id ?? '',
  );
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!pin || !boutiqueId || loading) return;
      setLoading(true);
      setError('');

      try {
        const pin_hash = await hashPin(pin);
        const res = await fetch('/api/employe/verify-pin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ boutique_id: boutiqueId, pin_hash }),
        });

        type VerifyResponse = {
          success?: boolean;
          error?: string;
          session?: { token: string; expires_at: string };
        };
        const data = (await res.json()) as VerifyResponse;

        if (!res.ok || !data.success || !data.session) {
          setError(data.error ?? 'PIN incorrect. Réessayez.');
          setPin('');
          inputRef.current?.focus();
          return;
        }

        // Store in localStorage (best-effort)
        if (typeof window !== 'undefined') {
          localStorage.setItem(EMPLOYE_STORAGE_KEY, data.session.token);
        }

        // Set HttpOnly cookie via API route
        await fetch('/api/employe/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: data.session.token }),
        });

        // Navigate to employee caisse
        router.push('/caisse');
        router.refresh();
      } catch {
        setError('Erreur réseau. Vérifiez votre connexion et réessayez.');
      } finally {
        setLoading(false);
      }
    },
    [pin, boutiqueId, loading, router],
  );

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--c-bg, #f9fafb)',
        padding: '16px',
      }}
    >
      <div
        style={{
          background: 'var(--c-surface, #fff)',
          border: '1px solid var(--c-rule2, #e5e7eb)',
          borderRadius: 20,
          boxShadow: '0 8px 32px rgba(0,0,0,.10)',
          padding: '32px 28px',
          width: '100%',
          maxWidth: 360,
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <span style={{ fontSize: 48 }} role="img" aria-label="Caisse employé">
            👤
          </span>
          <h2
            style={{
              fontFamily: '"Black Han Sans", sans-serif',
              fontSize: 22,
              color: 'var(--c-ink, #0a120a)',
              margin: '10px 0 4px',
            }}
          >
            Accès employé
          </h2>
          <p
            style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 13,
              color: 'var(--c-muted, #6b7280)',
            }}
          >
            Saisissez votre code PIN pour continuer
          </p>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Boutique selector */}
          {boutiques.length > 1 && (
            <div>
              <label
                htmlFor="employe-boutique"
                style={{
                  display: 'block',
                  fontFamily: 'Space Mono, monospace',
                  fontSize: 10,
                  fontWeight: 700,
                  color: 'var(--c-muted, #6b7280)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: 6,
                }}
              >
                Boutique
              </label>
              <select
                id="employe-boutique"
                value={boutiqueId}
                onChange={(e) => setBoutiqueId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 12,
                  border: '1px solid var(--c-rule2, #e5e7eb)',
                  background: 'var(--c-bg, #f9fafb)',
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: 14,
                  color: 'var(--c-ink, #0a120a)',
                  outline: 'none',
                }}
              >
                {boutiques.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.nom}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* PIN input */}
          <div>
            <label
              htmlFor="employe-pin"
              style={{
                display: 'block',
                fontFamily: 'Space Mono, monospace',
                fontSize: 10,
                fontWeight: 700,
                color: 'var(--c-muted, #6b7280)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 6,
              }}
            >
              PIN
            </label>
            <input
              id="employe-pin"
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
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 12,
                border: `1px solid ${error ? '#ff3341' : 'var(--c-rule2, #e5e7eb)'}`,
                background: 'var(--c-bg, #f9fafb)',
                fontFamily: 'Space Mono, monospace',
                fontSize: 24,
                textAlign: 'center',
                letterSpacing: '0.3em',
                color: 'var(--c-ink, #0a120a)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {error && (
            <p
              style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 12,
                fontWeight: 600,
                color: '#ff3341',
                textAlign: 'center',
                margin: 0,
              }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!pin || !boutiqueId || loading}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: 12,
              border: 'none',
              background: 'var(--c-accent, #00c853)',
              color: '#fff',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 15,
              fontWeight: 700,
              cursor: loading || !pin || !boutiqueId ? 'not-allowed' : 'pointer',
              opacity: loading || !pin || !boutiqueId ? 0.6 : 1,
              transition: 'all .15s',
            }}
          >
            {loading ? 'Vérification…' : 'Accéder'}
          </button>
        </form>

        {/* Link to owner login */}
        <p
          style={{
            textAlign: 'center',
            marginTop: 20,
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 12,
            color: 'var(--c-muted, #6b7280)',
          }}
        >
          Propriétaire ?{' '}
          <a
            href="/login"
            style={{ color: 'var(--c-accent, #00c853)', fontWeight: 600, textDecoration: 'none' }}
          >
            Connexion propriétaire
          </a>
        </p>
      </div>
    </div>
  );
}
