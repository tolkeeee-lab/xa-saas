export default function RightColumnSkeleton() {
  return (
    <div style={{ padding: '1rem' }}>
      {/* Header skeleton */}
      <div
        style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.9rem' }}
      >
        <div
          className="xa-skeleton xa-skeleton-rect"
          style={{ height: 10, width: '40%', borderRadius: 4 }}
        />
        <div
          className="xa-skeleton xa-skeleton-rect"
          style={{ height: 10, width: 20, borderRadius: 4 }}
        />
      </div>

      {/* Event skeletons */}
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          style={{ paddingLeft: '1.2rem', borderLeft: '1.5px solid var(--xa-rule2)', marginBottom: 12 }}
        >
          <div
            className="xa-skeleton xa-skeleton-rect"
            style={{ height: 12, width: '80%', marginBottom: 4 }}
          />
          <div
            className="xa-skeleton xa-skeleton-rect"
            style={{ height: 10, width: '55%', marginBottom: 2 }}
          />
          <div
            className="xa-skeleton xa-skeleton-rect"
            style={{ height: 8, width: '35%' }}
          />
        </div>
      ))}
    </div>
  );
}
