'use client';

export type LivraisonsTab = 'en_cours' | 'livrees' | 'retournees';

type Props = {
  active: LivraisonsTab;
  onChange: (t: LivraisonsTab) => void;
  counts: Record<LivraisonsTab, number>;
};

const TAB_LABELS: Record<LivraisonsTab, string> = {
  en_cours: 'En cours',
  livrees: 'Livrées',
  retournees: 'Retournées',
};

export default function LivraisonsTabs({ active, onChange, counts }: Props) {
  return (
    <div className="flex border-b border-xa-border bg-xa-surface overflow-x-auto">
      {(Object.keys(TAB_LABELS) as LivraisonsTab[]).map((tab) => {
        const count = counts[tab];
        return (
          <button
            key={tab}
            type="button"
            onClick={() => onChange(tab)}
            className={`flex-1 min-w-max py-3 text-sm font-medium flex items-center justify-center gap-1 transition-colors whitespace-nowrap px-3 ${
              active === tab
                ? 'border-b-2 border-xa-primary text-xa-text font-semibold'
                : 'text-xa-muted'
            }`}
          >
            {TAB_LABELS[tab]}
            {count > 0 && (
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                  active === tab
                    ? 'bg-xa-primary/10 text-xa-primary'
                    : 'bg-xa-border text-xa-muted'
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
