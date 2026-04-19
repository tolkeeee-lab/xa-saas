'use client';

import { useState } from 'react';
import { formatFCFA } from '@/lib/format';
import type { Dette } from '@/types/database';
import type { DettesEmployeData } from '@/lib/supabase/getDettesForEmploye';
import type { EmployeSession } from '@/lib/employe-session';

type Props = {
  initialData: DettesEmployeData;
  session: EmployeSession;
};

type ToastState = { message: string; type: 'success' | 'error' } | null;

const STATUT_LABELS: Record<string, string> = {
  en_attente: 'En attente',
  paye: 'Payé',
  en_retard: 'En retard',
};

const STATUT_COLORS: Record<string, { bg: string; text: string }> = {
  en_attente: { bg: 'rgba(245,158,11,.12)', text: '#d97706' },
  paye: { bg: 'rgba(0,200,83,.10)', text: '#00a048' },
  en_retard: { bg: 'rgba(255,51,65,.12)', text: '#ff3341' },
};

export default function EmployeDettesPage({ initialData, session }: Props) {
  const [dettes, setDettes] = useState<Dette[]>(initialData.dettes);
  const [remboursModal, setRemboursModal] = useState<Dette | null>(null);
  const [montant, setMontant] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }

  async function handleRembourser(e: React.FormEvent) {
    e.preventDefault();
    if (!remboursModal || !montant) return;
    const montantNum = parseFloat(montant);
    if (isNaN(montantNum) || montantNum <= 0) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/employe/dettes/${remboursModal.id}/rembourser`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ montant: montantNum }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        showToast(data.error ?? 'Erreur lors du remboursement', 'error');
        return;
      }

      // Update local state
      setDettes((prev) =>
        prev.map((d) => {
          if (d.id !== remboursModal.id) return d;
          const nouveauRembourse = d.montant_rembourse + montantNum;
          return {
            ...d,
            montant_rembourse: nouveauRembourse,
            statut: nouveauRembourse >= d.montant ? 'paye' : d.statut,
          };
        }),
      );

      showToast('Remboursement enregistré ✅', 'success');
      setRemboursModal(null);
      setMontant('');
    } catch {
      showToast('Erreur réseau', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  const totalDu = dettes
    .filter((d) => d.statut !== 'paye')
    .reduce((s, d) => s + (d.montant - d.montant_rembourse), 0);

  return (
    <div style={{ padding: '16px 16px 80px', maxWidth: 1000, margin: '0 auto' }}>
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
      <div style={{ marginBottom: 20 }}>
        <h1
          style={{
            fontFamily: '"Black Han Sans", sans-serif',
            fontSize: 22,
            color: 'var(--c-ink, #0a120a)',
            margin: 0,
          }}
        >
          💸 Dettes clients
        </h1>
        <p
          style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 13,
            color: 'var(--c-muted, #6b7280)',
            margin: '4px 0 0',
          }}
        >
          {session.boutique_nom} · Total dû :{' '}
          <strong style={{ color: totalDu > 0 ? '#ff3341' : '#00a048' }}>
            {formatFCFA(totalDu)}
          </strong>
        </p>
      </div>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {dettes.length === 0 ? (
          <div
            style={{
              padding: 40,
              textAlign: 'center',
              background: 'var(--c-surface, #fff)',
              border: '1px solid var(--c-rule2, #e5e7eb)',
              borderRadius: 16,
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 14,
              color: 'var(--c-muted, #6b7280)',
            }}
          >
            Aucune dette pour cette boutique.
          </div>
        ) : (
          dettes.map((d) => {
            const reste = d.montant - d.montant_rembourse;
            const colors = STATUT_COLORS[d.statut] ?? STATUT_COLORS['en_attente'];
            return (
              <div
                key={d.id}
                style={{
                  background: 'var(--c-surface, #fff)',
                  border: '1px solid var(--c-rule2, #e5e7eb)',
                  borderRadius: 14,
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ flex: 1, minWidth: 160 }}>
                  <p
                    style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: 15,
                      fontWeight: 700,
                      color: 'var(--c-ink, #0a120a)',
                      margin: 0,
                    }}
                  >
                    {d.client_nom}
                  </p>
                  {d.client_telephone && (
                    <p
                      style={{
                        fontFamily: 'Space Mono, monospace',
                        fontSize: 11,
                        color: 'var(--c-muted, #6b7280)',
                        margin: '2px 0 0',
                      }}
                    >
                      {d.client_telephone}
                    </p>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p
                    style={{
                      fontFamily: 'Space Mono, monospace',
                      fontSize: 16,
                      fontWeight: 700,
                      color: d.statut === 'paye' ? '#00a048' : '#ff3341',
                      margin: 0,
                    }}
                  >
                    {formatFCFA(reste)}
                  </p>
                  <p
                    style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: 11,
                      color: 'var(--c-muted, #6b7280)',
                      margin: '2px 0 0',
                    }}
                  >
                    sur {formatFCFA(d.montant)}
                  </p>
                </div>
                <span
                  style={{
                    padding: '3px 10px',
                    borderRadius: 999,
                    background: colors.bg,
                    color: colors.text,
                    fontFamily: 'Space Mono, monospace',
                    fontSize: 9,
                    fontWeight: 700,
                  }}
                >
                  {STATUT_LABELS[d.statut] ?? d.statut}
                </span>
                {d.statut !== 'paye' && (
                  <button
                    type="button"
                    onClick={() => {
                      setRemboursModal(d);
                      setMontant('');
                    }}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 8,
                      border: '1px solid var(--c-accent, #00c853)',
                      background: 'transparent',
                      color: 'var(--c-accent, #00c853)',
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Encaisser remboursement
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Remboursement modal */}
      {remboursModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,.5)',
            zIndex: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setRemboursModal(null)}
        >
          <div
            style={{
              background: 'var(--c-surface, #fff)',
              borderRadius: 20,
              padding: '24px 20px',
              maxWidth: 360,
              width: '100%',
              boxShadow: '0 8px 32px rgba(0,0,0,.15)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              style={{
                fontFamily: '"Black Han Sans", sans-serif',
                fontSize: 18,
                color: 'var(--c-ink, #0a120a)',
                margin: '0 0 4px',
              }}
            >
              Encaisser remboursement
            </h3>
            <p
              style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 13,
                color: 'var(--c-muted, #6b7280)',
                margin: '0 0 18px',
              }}
            >
              {remboursModal.client_nom} · Reste dû :{' '}
              {formatFCFA(remboursModal.montant - remboursModal.montant_rembourse)}
            </p>
            <form
              onSubmit={(e) => void handleRembourser(e)}
              style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
            >
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
                    marginBottom: 6,
                  }}
                >
                  Montant reçu (FCFA)
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={montant}
                  onChange={(e) => setMontant(e.target.value)}
                  placeholder="0"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 12,
                    border: '1px solid var(--c-rule2, #e5e7eb)',
                    background: 'var(--c-bg, #f9fafb)',
                    fontFamily: 'Space Mono, monospace',
                    fontSize: 20,
                    fontWeight: 700,
                    color: 'var(--c-ink, #0a120a)',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setRemboursModal(null)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: 12,
                    border: '1px solid var(--c-rule2, #e5e7eb)',
                    background: 'transparent',
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    color: 'var(--c-muted, #6b7280)',
                  }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={!montant || submitting}
                  style={{
                    flex: 2,
                    padding: '10px',
                    borderRadius: 12,
                    border: 'none',
                    background: 'var(--c-accent, #00c853)',
                    color: '#fff',
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: !montant || submitting ? 'not-allowed' : 'pointer',
                    opacity: !montant || submitting ? 0.6 : 1,
                  }}
                >
                  {submitting ? 'Enregistrement…' : 'Confirmer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
