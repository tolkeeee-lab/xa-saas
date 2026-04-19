type Props = { cols?: number; rows?: number; height?: number };

export default function GridSkeleton({ cols = 2, rows = 1, height = 180 }: Props) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '1rem' }}>
      {Array.from({ length: cols * rows }).map((_, i) => (
        <div key={i} className="xa-card xa-skeleton" style={{ height }} />
      ))}
    </div>
  );
}
