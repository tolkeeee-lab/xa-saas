'use client';

import type { GlobalSummary } from '@/lib/supabase/dashboard/hero';
import { formatFCFA } from '@/lib/format';

type Props = {
  summary: GlobalSummary;
};

export default function GlobalHero({ summary }: Props) {
  const delta =
    summary.ca_yesterday > 0
      ? ((summary.ca_today - summary.ca_yesterday) / summary.ca_yesterday) * 100
      : null;

  return (
    <div className="xa-hero">
      <div className="xa-hero-title">Toutes boutiques</div>
      <div className="xa-hero-sub">Vue globale du jour</div>

      <div className="xa-hero-ca">{formatFCFA(summary.ca_today)}</div>
      {delta !== null && (
        <div
          className="xa-hero-delta"
          style={{ color: delta >= 0 ? 'var(--xa-green)' : 'var(--xa-red)' }}
        >
          {delta >= 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(1)}% vs hier
        </div>
      )}

      <div style={{ marginTop: '.9rem', display: 'flex', gap: 8 }}>
        <div className="xa-hero-kpi" style={{ flex: 1 }}>
          <div className="xa-hero-kpi-lbl">Commandes</div>
          <div className="xa-hero-kpi-val">{summary.orders_today}</div>
        </div>
        <div className="xa-hero-kpi" style={{ flex: 1 }}>
          <div className="xa-hero-kpi-lbl">Boutiques</div>
          <div className="xa-hero-kpi-val">{summary.top3.length > 0 ? summary.top3.length : '—'}</div>
        </div>
      </div>

      {summary.top3.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <div
            style={{
              fontFamily: 'var(--font-plex-mono), monospace',
              fontSize: 9,
              letterSpacing: '.1em',
              color: 'var(--xa-muted)',
              textTransform: 'uppercase',
              marginBottom: 6,
            }}
          >
            Top boutiques
          </div>
          {summary.top3.map((b, i) => (
            <div
              key={b.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '0.3rem 0',
                borderBottom: '1px solid var(--xa-rule)',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-plex-mono), monospace',
                  fontSize: 9,
                  color: 'var(--xa-faint)',
                  width: 12,
                }}
              >
                {i + 1}
              </span>
              <div
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: b.color || 'var(--xa-accent)',
                  flexShrink: 0,
                }}
              />
              <span style={{ flex: 1, fontSize: 12, color: 'var(--xa-ink)', fontWeight: 500 }}>
                {b.nom}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-plex-mono), monospace',
                  fontSize: 11,
                  color: 'var(--xa-muted)',
                }}
              >
                {formatFCFA(b.ca)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
