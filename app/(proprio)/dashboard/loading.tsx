export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-xa-surface border border-xa-border" />
        ))}
      </div>
      <div className="h-64 rounded-xl bg-xa-surface border border-xa-border" />
    </div>
  );
}
