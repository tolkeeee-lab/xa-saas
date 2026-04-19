'use client';

import type { Boutique } from '@/types/database';

interface CaisseTopbarProps {
  boutiques: Boutique[];
  boutiqueActive: string;
  onBoutiqueChange: (id: string) => void;
  caissierNom?: string;
  onLock: () => void;
  /** When true, the boutique selector is replaced by a static boutique name pill. */
  hideBoutiqueSelector?: boolean;
}

export default function CaisseTopbar({
  boutiques,
  boutiqueActive,
  onBoutiqueChange,
  caissierNom,
  onLock,
  hideBoutiqueSelector,
}: CaisseTopbarProps) {
  const initiales = caissierNom
    ? caissierNom
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'CA';

  return (
    <header className="c-topbar">
      {/* Wordmark */}
      <span className="c-wordmark" aria-label="xà — Caisse">
        x<span className="accent">à</span>
      </span>

      {/* CAISSE tag */}
      <span className="c-tag-caisse">CAISSE</span>

      {/* Boutique selector or static name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span aria-hidden="true" style={{ fontSize: 14 }}>📍</span>
        {hideBoutiqueSelector ? (
          <span
            style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--c-ink)',
              padding: '4px 8px',
              border: '1px solid var(--c-rule2)',
              borderRadius: 6,
              background: 'var(--c-bg)',
            }}
          >
            {boutiques.find((b) => b.id === boutiqueActive)?.nom ?? '—'}
          </span>
        ) : (
          <select
            value={boutiqueActive}
            onChange={(e) => onBoutiqueChange(e.target.value)}
            aria-label="Sélectionner la boutique"
            style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 13,
              border: '1px solid var(--c-rule2)',
              background: 'var(--c-bg)',
              color: 'var(--c-ink)',
              borderRadius: 6,
              padding: '4px 8px',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            {boutiques.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nom}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Caissier pill */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          padding: '4px 10px 4px 6px',
          border: '1px solid var(--c-rule2)',
          borderRadius: 999,
          background: 'var(--c-bg)',
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: 'var(--c-accent)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Space Mono, monospace',
            fontSize: 9,
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {initiales}
        </span>
        <span
          style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--c-ink)',
            maxWidth: 100,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {caissierNom ?? 'Caissier'}
        </span>
      </div>

      {/* Lock button */}
      <button
        type="button"
        onClick={onLock}
        aria-label="Verrouiller la caisse"
        title="Verrouiller (Ctrl+L)"
        style={{
          background: 'transparent',
          border: '1px solid var(--c-rule2)',
          borderRadius: 6,
          padding: '5px 10px',
          cursor: 'pointer',
          fontFamily: 'DM Sans, sans-serif',
          fontSize: 12,
          color: 'var(--c-muted)',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          transition: 'all .15s',
        }}
      >
        🔒
      </button>
    </header>
  );
}
