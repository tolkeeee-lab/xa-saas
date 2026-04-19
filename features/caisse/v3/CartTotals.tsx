'use client';

import { formatFCFA } from '@/lib/format';

const REMISE_PRESETS = [5, 10, 15] as const;

interface CartTotalsProps {
  sousTotal: number;
  remisePct: number;
  onRemisePctChange: (v: number) => void;
}

export default function CartTotals({
  sousTotal,
  remisePct,
  onRemisePctChange,
}: CartTotalsProps) {
  const remiseMontant = remisePct > 0 ? Math.round(sousTotal * remisePct / 100) : 0;
  const total = sousTotal - remiseMontant;

  return (
    <div className="c-totals">
      {/* Sous-total */}
      <div className="c-total-row">
        <span>Sous-total</span>
        <span style={{ fontFamily: 'Space Mono, monospace' }}>{formatFCFA(sousTotal)}</span>
      </div>

      {/* Remise presets + custom */}
      <div style={{ marginBottom: remiseMontant > 0 ? 0 : 4 }}>
        <div className="c-remise-row" aria-label="Remise">
          <span style={{ fontSize: 10, color: 'var(--c-muted)', fontWeight: 600, flexShrink: 0 }}>
            🎟️ Remise
          </span>
          {REMISE_PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              className={`c-remise-preset${remisePct === p ? ' active' : ''}`}
              onClick={() => onRemisePctChange(remisePct === p ? 0 : p)}
              aria-label={`Remise ${p}%`}
              aria-pressed={remisePct === p}
            >
              {p}%
            </button>
          ))}
          <div className="c-remise-custom-wrap">
            <input
              type="number"
              className="c-remise-input"
              min={0}
              max={100}
              step={1}
              value={remisePct === 0 ? '' : remisePct}
              onChange={(e) => {
                const v = Math.min(100, Math.max(0, Number(e.target.value)));
                onRemisePctChange(v);
              }}
              aria-label="Remise personnalisée en pourcentage"
              placeholder="0"
            />
            <span style={{ fontSize: 10, color: 'var(--c-muted)' }}>%</span>
          </div>
        </div>
      </div>

      {/* Remise line */}
      {remiseMontant > 0 && (
        <div className="c-total-row remise">
          <span>Remise ({remisePct}%)</span>
          <span style={{ fontFamily: 'Space Mono, monospace' }}>− {formatFCFA(remiseMontant)}</span>
        </div>
      )}

      <div style={{ height: 1, background: 'var(--c-rule2)', margin: '6px 0' }} />

      {/* Grand total */}
      <div className="c-total-row grand-total">
        <span>TOTAL</span>
        <span style={{ fontFamily: 'Space Mono, monospace' }}>{formatFCFA(total)}</span>
      </div>
    </div>
  );
}
