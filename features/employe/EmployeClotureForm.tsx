'use client';

import { useState, useCallback, useEffect } from 'react';
import { formatFCFA } from '@/lib/format';
import type { EmployeSession } from '@/lib/employe-session';

type Props = {
  session: EmployeSession;
};

type LiveData = {
  ca_theorique: number;
  cash_theorique: number;
  par_mode: Record<string, number>;
  nb_transactions: number;
  cloture_existante: {
    id: string;
    cash_reel: number;
    ecart: number;
    note: string | null;
  } | null;
};

type ToastState = { message: string; type: 'success' | 'error' } | null;

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function EmployeClotureForm({ session }: Props) {
  const [date] = useState(todayISO());
  const [liveData, setLiveData] = useState<LiveData | null>(null);
  const [loadingLive, setLoadingLive] = useState(false);
  const [cashReel, setCashReel] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }

  const fetchLiveData = useCallback(async () => {
    setLoadingLive(true);
    try {
      const res = await fetch(
        `/api/employe/cloture?date=${encodeURIComponent(date)}`,
      );
      if (!res.ok) {
        const json = (await res.json()) as { error?: string };
        throw new Error(json.error ?? 'Erreur serveur');
      }
      const json = (await res.json()) as LiveData;
      setLiveData(json);
      if (json.cloture_existante) {
        setCashReel(String(json.cloture_existante.cash_reel));
        setNote(json.cloture_existante.note ?? '');
      }
    } catch {
      setLiveData(null);
    } finally {
      setLoadingLive(false);
    }
  }, [date]);

  useEffect(() => {
    void fetchLiveData();
  }, [fetchLiveData]);

  const cashReelNum = parseFloat(cashReel) || 0;
  const cashTheorique = liveData?.cash_theorique ?? 0;
  const ecart = cashReelNum - cashTheorique;
  const showEcart = cashReel !== '' && liveData !== null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (cashReel === '') return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/employe/cloture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          cash_reel: cashReelNum,
          note: note || undefined,
        }),
      });

      if (!res.ok) {
        const json = (await res.json()) as { error?: string };
        throw new Error(json.error ?? 'Erreur serveur');
      }

      showToast(
        liveData?.cloture_existante
          ? 'Clôture mise à jour ✅'
          : 'Clôture validée ✅',
        'success',
      );
      await fetchLiveData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur inconnue', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ padding: '16px 16px 80px', maxWidth: 700, margin: '0 auto' }}>
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: 16,
            right: 16,
            zIndex: 300,
            padding: '12px 18px',
            borderRadius: 12,
            background: toast.type === 'success' ? '#00c853' : '#ff3341',
            color: '#fff',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 13,
            fontWeight: 600,
            boxShadow: '0 4px 16px rgba(0,0,0,.15)',
          }}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{
            fontFamily: '"Black Han Sans", sans-serif',
            fontSize: 22,
            color: 'var(--c-ink, #0a120a)',
            margin: 0,
          }}
        >
          🔒 Clôture de caisse
        </h1>
        <p
          style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 13,
            color: 'var(--c-muted, #6b7280)',
            margin: '4px 0 0',
          }}
        >
          {session.boutique_nom} · {date}
        </p>
      </div>

      <form
        onSubmit={(e) => void handleSubmit(e)}
        style={{
          background: 'var(--c-surface, #fff)',
          border: '1px solid var(--c-rule2, #e5e7eb)',
          borderRadius: 20,
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        {/* KPI cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 12,
          }}
        >
          {[
            {
              label: 'Espèces théoriques',
              value: loadingLive ? '…' : formatFCFA(liveData?.cash_theorique ?? 0),
            },
            {
              label: 'Mobile Money',
              value: loadingLive ? '…' : formatFCFA(liveData?.par_mode['momo'] ?? 0),
            },
            {
              label: 'Carte',
              value: loadingLive ? '…' : formatFCFA(liveData?.par_mode['carte'] ?? 0),
            },
            {
              label: 'CA Total',
              value: loadingLive ? '…' : formatFCFA(liveData?.ca_theorique ?? 0),
              sub: loadingLive ? '' : `${liveData?.nb_transactions ?? 0} transaction(s)`,
            },
          ].map((card) => (
            <div
              key={card.label}
              style={{
                background: 'var(--c-bg, #f9fafb)',
                border: '1px solid var(--c-rule2, #e5e7eb)',
                borderRadius: 14,
                padding: '14px 16px',
              }}
            >
              <p
                style={{
                  fontFamily: 'Space Mono, monospace',
                  fontSize: 10,
                  fontWeight: 700,
                  color: 'var(--c-muted, #6b7280)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  margin: '0 0 6px',
                }}
              >
                {card.label}
              </p>
              <p
                style={{
                  fontFamily: '"Black Han Sans", sans-serif',
                  fontSize: 18,
                  color: 'var(--c-ink, #0a120a)',
                  margin: 0,
                }}
              >
                {card.value}
              </p>
              {card.sub && (
                <p
                  style={{
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: 11,
                    color: 'var(--c-muted, #6b7280)',
                    margin: '3px 0 0',
                  }}
                >
                  {card.sub}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Cash réel */}
        <div>
          <label
            style={{
              display: 'block',
              fontFamily: 'Space Mono, monospace',
              fontSize: 10,
              fontWeight: 700,
              color: 'var(--c-muted, #6b7280)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 8,
            }}
          >
            Cash réel compté (FCFA)
          </label>
          <input
            type="number"
            min="0"
            step="1"
            value={cashReel}
            onChange={(e) => setCashReel(e.target.value)}
            placeholder="0"
            style={{
              width: '100%',
              padding: '14px 18px',
              borderRadius: 14,
              border: '1px solid var(--c-rule2, #e5e7eb)',
              background: 'var(--c-bg, #f9fafb)',
              fontFamily: 'Space Mono, monospace',
              fontSize: 28,
              fontWeight: 700,
              color: 'var(--c-ink, #0a120a)',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Ecart */}
        {showEcart && (
          <div>
            {ecart === 0 ? (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 16px',
                  borderRadius: 999,
                  background: 'rgba(0,200,83,.12)',
                  color: '#00a048',
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                ✅ Caisse équilibrée
              </span>
            ) : ecart > 0 ? (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 16px',
                  borderRadius: 999,
                  background: 'rgba(59,130,246,.12)',
                  color: '#1d4ed8',
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                📈 Surplus +{formatFCFA(ecart)}
              </span>
            ) : (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 16px',
                  borderRadius: 999,
                  background: 'rgba(255,51,65,.12)',
                  color: '#ff3341',
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                📉 Manque {formatFCFA(Math.abs(ecart))}
              </span>
            )}
          </div>
        )}

        {/* Note */}
        <div>
          <label
            style={{
              display: 'block',
              fontFamily: 'Space Mono, monospace',
              fontSize: 10,
              fontWeight: 700,
              color: 'var(--c-muted, #6b7280)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 8,
            }}
          >
            Note (optionnelle)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Observations…"
            rows={2}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 12,
              border: '1px solid var(--c-rule2, #e5e7eb)',
              background: 'var(--c-bg, #f9fafb)',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 13,
              color: 'var(--c-ink, #0a120a)',
              outline: 'none',
              resize: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <button
          type="submit"
          disabled={submitting || cashReel === ''}
          style={{
            padding: '12px 24px',
            borderRadius: 14,
            border: 'none',
            background: 'var(--c-accent, #00c853)',
            color: '#fff',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 15,
            fontWeight: 700,
            cursor: submitting || cashReel === '' ? 'not-allowed' : 'pointer',
            opacity: submitting || cashReel === '' ? 0.6 : 1,
            transition: 'all .15s',
          }}
        >
          {submitting
            ? 'Enregistrement…'
            : liveData?.cloture_existante
            ? 'Mettre à jour la clôture'
            : 'Valider la clôture'}
        </button>
      </form>
    </div>
  );
}
