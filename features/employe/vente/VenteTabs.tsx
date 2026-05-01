'use client';

import type { VenteTab } from './types';

interface Props {
  active: VenteTab;
  onChange: (tab: VenteTab) => void;
  nbDettes: number;
}

const TABS: { id: VenteTab; label: string; emoji: string }[] = [
  { id: 'ventes',     label: 'Ventes',     emoji: '📊' },
  { id: 'historique', label: 'Historique', emoji: '📋' },
  { id: 'dettes',     label: 'Dettes',     emoji: '⚠️' },
];

export default function VenteTabs({ active, onChange, nbDettes }: Props) {
  return (
    <div style={{
      display: 'flex', background: 'var(--xa-ink2)',
      borderBottom: '2px solid rgba(255,255,255,.08)',
      flexShrink: 0,
    }}>
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          style={{
            flex: 1, textAlign: 'center',
            padding: '10px 4px',
            fontSize: 12, fontWeight: 600,
            fontFamily: 'var(--font-familjen, system-ui)',
            color: active === tab.id ? 'white' : 'rgba(255,255,255,.45)',
            background: 'none', border: 'none',
            borderBottom: active === tab.id
              ? '2.5px solid var(--xa-amber)'
              : '2.5px solid transparent',
            cursor: 'pointer',
            transition: 'all .15s',
            position: 'relative',
          }}
        >
          {tab.emoji} {tab.label}
          {tab.id === 'dettes' && nbDettes > 0 && (
            <span style={{
              background: 'var(--xa-red)', color: 'white',
              fontSize: 9, fontWeight: 700,
              padding: '1px 5px', borderRadius: 10,
              fontFamily: 'var(--font-plex-mono, monospace)',
              marginLeft: 4,
            }}>{nbDettes}</span>
          )}
        </button>
      ))}
    </div>
  );
}
