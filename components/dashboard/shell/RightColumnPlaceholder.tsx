export default function RightColumnPlaceholder() {
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
        Timeline
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
        Timeline — À venir en PR 4
      </div>

      {/* Preview skeleton */}
      <div
        style={{
          marginTop: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
        }}
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            style={{
              height: 52,
              borderRadius: 6,
              background: 'var(--xa-bg2)',
              border: '1px solid var(--xa-rule)',
            }}
          />
        ))}
      </div>
    </div>
  );
}
