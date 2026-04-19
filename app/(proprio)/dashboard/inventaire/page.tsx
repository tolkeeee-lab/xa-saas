export default function InventairePage() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4rem 2rem',
        gap: '1rem',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-plex-mono), monospace',
          fontSize: 10,
          letterSpacing: '.12em',
          color: 'var(--xa-accent)',
          textTransform: 'uppercase',
        }}
      >
        Bientôt disponible
      </div>
      <h1
        style={{
          fontFamily: 'var(--font-familjen), sans-serif',
          fontSize: 28,
          fontWeight: 700,
          color: 'var(--xa-ink)',
          letterSpacing: '-.03em',
          margin: 0,
        }}
      >
        Inventaire
      </h1>
      <p style={{ fontSize: 14, color: 'var(--xa-muted)', maxWidth: 340, margin: 0 }}>
        La vue Inventaire sera disponible dans une prochaine version de xà.
      </p>
    </div>
  );
}
