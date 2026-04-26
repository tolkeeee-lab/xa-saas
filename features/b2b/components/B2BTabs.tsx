'use client';

type Props = {
  active: 'catalogue' | 'commandes';
  onChange: (t: 'catalogue' | 'commandes') => void;
  commandesEnCours: number;
};

export default function B2BTabs({ active, onChange, commandesEnCours }: Props) {
  return (
    <div className="flex border-b border-xa-border bg-xa-surface">
      {(['catalogue', 'commandes'] as const).map((tab) => (
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
          {tab === 'catalogue' ? 'Catalogue' : 'Mes commandes'}
          {tab === 'commandes' && commandesEnCours > 0 && (
            <span className="ml-1 bg-xa-primary text-white text-xs rounded-full px-1.5 py-0.5">
              {commandesEnCours}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
