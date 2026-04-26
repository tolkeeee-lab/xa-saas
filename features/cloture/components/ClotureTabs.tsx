'use client';

export type ClotureTab = 'aujourd_hui' | 'historique';

type Props = {
  active: ClotureTab;
  onChange: (t: ClotureTab) => void;
};

const TAB_LABELS: Record<ClotureTab, string> = {
  aujourd_hui: "Aujourd'hui",
  historique: 'Historique',
};

export default function ClotureTabs({ active, onChange }: Props) {
  return (
    <div className="flex border-b border-xa-border bg-xa-surface">
      {(Object.keys(TAB_LABELS) as ClotureTab[]).map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-1 transition-colors ${
            active === tab
              ? 'border-b-2 border-xa-primary text-xa-text font-semibold'
              : 'text-xa-muted'
          }`}
        >
          {TAB_LABELS[tab]}
        </button>
      ))}
    </div>
  );
}
