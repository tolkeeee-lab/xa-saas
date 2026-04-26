'use client';

export type TransfertsTab = 'a_recevoir' | 'envoyes' | 'recus' | 'annules';

type Props = {
  active: TransfertsTab;
  onChange: (t: TransfertsTab) => void;
  counts: Record<TransfertsTab, number>;
};

const TAB_LABELS: Record<TransfertsTab, string> = {
  a_recevoir: 'À recevoir',
  envoyes: 'Envoyés',
  recus: 'Reçus',
  annules: 'Annulés',
};

export default function TransfertsTabs({ active, onChange, counts }: Props) {
  return (
    <div className="flex border-b border-xa-border bg-xa-surface overflow-x-auto">
      {(Object.keys(TAB_LABELS) as TransfertsTab[]).map((tab) => {
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
