'use client';

export type StockTab = 'tous' | 'bas' | 'rupture' | 'perime';

type TabDef = {
  key: StockTab;
  label: string;
};

const TABS: TabDef[] = [
  { key: 'tous', label: 'Tous' },
  { key: 'bas', label: 'Stock bas' },
  { key: 'rupture', label: 'Rupture' },
  { key: 'perime', label: 'Périmés' },
];

type Props = {
  active: StockTab;
  counts: Record<StockTab, number>;
  onChange: (tab: StockTab) => void;
};

export default function StockTabs({ active, counts, onChange }: Props) {
  return (
    <div className="flex gap-1 overflow-x-auto py-1 px-1 -mx-1">
      {TABS.map((t) => (
        <button
          key={t.key}
          type="button"
          onClick={() => onChange(t.key)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            active === t.key
              ? 'bg-xa-primary text-white'
              : 'bg-xa-bg2 text-xa-muted hover:text-xa-text'
          }`}
          style={{ minHeight: 36 }}
        >
          {t.label}
          {counts[t.key] > 0 && (
            <span
              className={`inline-flex items-center justify-center rounded-full text-xs font-bold px-1.5 py-0.5 min-w-[20px] ${
                active === t.key
                  ? 'bg-white/20 text-white'
                  : t.key === 'rupture'
                  ? 'bg-xa-redbg text-xa-danger'
                  : t.key === 'bas'
                  ? 'bg-xa-amberbg text-xa-amber'
                  : 'bg-xa-bg3 text-xa-muted'
              }`}
            >
              {counts[t.key]}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
