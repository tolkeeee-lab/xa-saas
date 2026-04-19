import type { Boutique } from '@/types/database';

type Props = {
  boutiques: Boutique[];
};

export default function LeftColumnPlaceholder({ boutiques }: Props) {
  return (
    <div style={{ padding: '1.25rem 1rem' }}>
      {/* Header */}
      <div
        style={{
          fontFamily: 'var(--font-plex-mono), monospace',
          fontSize: 10,
          letterSpacing: '.1em',
          color: 'var(--xa-muted)',
          textTransform: 'uppercase',
          marginBottom: '1rem',
        }}
      >
        Mes boutiques
      </div>

      {/* Boutique cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '2rem' }}>
        {boutiques.length === 0 && (
          <p style={{ fontSize: 13, color: 'var(--xa-muted)' }}>Aucune boutique active.</p>
        )}
        {boutiques.map((b) => (
          <div
            key={b.id}
            style={{
              padding: '10px 12px',
              border: '1.5px solid var(--xa-rule2)',
              borderRadius: 6,
              background: 'var(--xa-surface)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 2,
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: b.couleur_theme || 'var(--xa-accent)',
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--xa-ink)',
                  fontFamily: 'var(--font-familjen), sans-serif',
                }}
              >
                {b.nom}
              </span>
            </div>
            <div
              style={{
                fontSize: 11,
                color: 'var(--xa-muted)',
                fontFamily: 'var(--font-plex-mono), monospace',
                paddingLeft: 16,
              }}
            >
              {b.ville}
              {b.quartier ? ` · ${b.quartier}` : ''}
            </div>
          </div>
        ))}
      </div>

      {/* Coming soon notice */}
      <div
        style={{
          padding: '12px',
          border: '1px dashed var(--xa-rule2)',
          borderRadius: 6,
          fontSize: 12,
          color: 'var(--xa-muted)',
          textAlign: 'center',
          fontFamily: 'var(--font-plex-mono), monospace',
        }}
      >
        Colonne gauche — À venir en PR 4
      </div>
    </div>
  );
}
