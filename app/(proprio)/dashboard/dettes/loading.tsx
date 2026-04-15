export default function DettesLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-xa-surface border border-xa-border" />
        ))}
      </div>
      <div className="rounded-xl bg-xa-surface border border-xa-border overflow-hidden">
        <div className="h-12 border-b border-xa-border" />
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-12 border-b border-xa-border/50 last:border-b-0" />
        ))}
      </div>
    </div>
  );
}
