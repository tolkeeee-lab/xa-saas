export default function KPIGridSkeleton() {
  return (
    <div className="xa-kpi-grid">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="xa-kpi-card xa-skeleton">
          <div className="xa-skeleton-line xa-skeleton-short" />
          <div className="xa-skeleton-line xa-skeleton-tall" />
          <div className="xa-skeleton-line xa-skeleton-short" />
        </div>
      ))}
    </div>
  );
}
