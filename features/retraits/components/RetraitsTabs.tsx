'use client';

export type RetraitsTab = 'en_attente' | 'retire' | 'expire';

type Props = {
  active: RetraitsTab;
  onChange: (t: RetraitsTab) => void;
  counts: { en_attente: number; retire: number; expire: number };
};

const TAB_LABELS: Record<RetraitsTab, string> = {
  en_attente: 'En attente',
  retire: 'Retirés',
  expire: 'Expirés',
};

export default function RetraitsTabs({ active, onChange, counts }: Props) {
  return (
    <div className="flex border-b border-xa-border bg-xa-surface">
      {(Object.keys(TAB_LABELS) as RetraitsTab[]).map((tab) => (
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
          {counts[tab] > 0 && (
            <span
              className={`ml-1 text-xs rounded-full px-1.5 py-0.5 ${
                active === tab
                  ? 'bg-xa-primary text-white'
                  : 'bg-xa-bg text-xa-muted border border-xa-border'
              }`}
            >
              {counts[tab]}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
