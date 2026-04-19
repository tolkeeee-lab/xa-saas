export default function LeftColumnSkeleton() {
  return (
    <div style={{ padding: '1rem' }}>
      {/* Hero skeleton */}
      <div
        className="xa-skeleton xa-skeleton-rect"
        style={{ height: 24, width: '60%', marginBottom: 8 }}
      />
      <div
        className="xa-skeleton xa-skeleton-rect"
        style={{ height: 12, width: '40%', marginBottom: 16 }}
      />
      <div
        className="xa-skeleton xa-skeleton-rect"
        style={{ height: 36, width: '70%', marginBottom: 12 }}
      />
      <div
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 16 }}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="xa-skeleton xa-skeleton-rect"
            style={{ height: 52, borderRadius: 4 }}
          />
        ))}
      </div>

      {/* Boutiques list skeleton */}
      <div
        className="xa-skeleton xa-skeleton-rect"
        style={{ height: 10, width: '30%', marginBottom: 12 }}
      />
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="xa-skeleton xa-skeleton-rect"
          style={{ height: 52, borderRadius: 4, marginBottom: 6 }}
        />
      ))}
    </div>
  );
}
