'use client';

import { formatFCFA } from '@/lib/format';

export type PayMode = 'especes' | 'momo' | 'credit';

const PAY_MODES: { value: PayMode; label: string; icon: string }[] = [
  { value: 'especes', label: 'ESPÈCES', icon: '💵' },
  { value: 'momo',   label: 'MOBILE',  icon: '📱' },
  { value: 'credit', label: 'CRÉDIT',  icon: '🏦' },
];

const CASH_PRESETS = [1000, 2000, 5000, 10000, 20000] as const;

interface PaymentSectionProps {
  payMode: PayMode;
  onPayModeChange: (mode: PayMode) => void;
  total: number;
  montantRecu: number;
  onMontantRecuChange: (v: number) => void;
  cashInputRef?: { current: HTMLInputElement | null };
}

export default function PaymentSection({
  payMode,
  onPayModeChange,
  total,
  montantRecu,
  onMontantRecuChange,
  cashInputRef,
}: PaymentSectionProps) {
  const rendu = montantRecu - total;
  const isInsuffisant = montantRecu > 0 && rendu < 0;
  const isSuffisant = montantRecu > 0 && rendu >= 0;

  return (
    <div className="c-payment">
      <p className="c-payment-label" aria-label="Mode de paiement">
        MODE DE PAIEMENT
      </p>

      {/* Pay mode grid */}
      <div className="c-pay-grid" role="radiogroup" aria-label="Choisir le mode de paiement">
        {PAY_MODES.map((m) => (
          <button
            key={m.value}
            type="button"
            role="radio"
            aria-checked={payMode === m.value}
            className={`c-pay-btn${payMode === m.value ? ' active' : ''}`}
            onClick={() => onPayModeChange(m.value)}
            aria-label={`Paiement ${m.label}`}
          >
            <span className="pay-icon" aria-hidden="true">{m.icon}</span>
            <span>{m.label}</span>
          </button>
        ))}
      </div>

      {/* Cash row — only visible when payMode === 'especes' */}
      {payMode === 'especes' && (
        <div className="c-cash-row" aria-label="Montant reçu en espèces">
          {/* Cash presets */}
          <div className="c-cash-presets" aria-label="Montants rapides">
            {CASH_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                className="c-cash-preset"
                onClick={() => onMontantRecuChange(preset)}
                aria-label={`Montant reçu : ${formatFCFA(preset)}`}
              >
                {preset >= 1000 ? `${preset / 1000}k` : preset}
              </button>
            ))}
          </div>

          {/* Cash input */}
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 10, color: 'var(--c-muted)', fontWeight: 600 }}>
              Montant reçu (F)
            </span>
            <div className="c-cash-input-wrap">
              <span aria-hidden="true" style={{ color: 'var(--c-muted)', fontSize: 12 }}>F</span>
              <input
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ref={cashInputRef as any}
                type="number"
                min={0}
                className="c-cash-input"
                value={montantRecu > 0 ? montantRecu : ''}
                onChange={(e) => onMontantRecuChange(Number(e.target.value) || 0)}
                placeholder={String(total)}
                aria-label="Montant reçu en espèces"
                id="cash-input"
              />
            </div>
          </label>

          {/* Rendu pill */}
          {(isSuffisant || isInsuffisant) && (
            <div
              className={`c-rendu-pill${isSuffisant ? ' ok' : ' insufficient'}`}
              aria-live="polite"
              aria-label={
                isSuffisant
                  ? `Rendu : ${formatFCFA(rendu)}`
                  : `Insuffisant — manque ${formatFCFA(-rendu)}`
              }
            >
              {isInsuffisant ? (
                <>⚠ Insuffisant ({formatFCFA(-rendu)} manquant)</>
              ) : (
                <>Rendu : {formatFCFA(rendu)}</>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
