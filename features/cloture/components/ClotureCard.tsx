'use client';

import { formatFCFA } from '@/lib/format';
import type { ClotureCaisseJour } from '@/types/database';

type Props = {
  cloture: ClotureCaisseJour;
  onClick: () => void;
};

const STATUT_CONFIG: Record<
  ClotureCaisseJour['statut'],
  { label: string; classes: string }
> = {
  a_valider: {
    label: 'À valider',
    classes: 'bg-amber-100 text-amber-700 border-amber-200',
  },
  equilibree: {
    label: 'Équilibrée',
    classes: 'bg-green-100 text-green-700 border-green-200',
  },
  manque: {
    label: 'Manque',
    classes: 'bg-red-100 text-red-700 border-red-200',
  },
  excedent: {
    label: 'Excédent',
    classes: 'bg-violet-100 text-violet-700 border-violet-200',
  },
};

function formatShortDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export default function ClotureCard({ cloture, onClick }: Props) {
  const config = STATUT_CONFIG[cloture.statut];
  const ecartSign = cloture.ecart > 0 ? '+' : '';
  const ecartColor =
    cloture.ecart === 0
      ? 'text-green-600'
      : cloture.ecart > 0
      ? 'text-amber-500'
      : 'text-red-500';

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left bg-xa-surface border border-xa-border rounded-2xl p-4 flex flex-col gap-2 active:scale-[.98] transition-transform"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-xa-text capitalize">
          {formatShortDate(cloture.date_cloture)}
        </span>
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full border ${config.classes}`}
        >
          {config.label}
        </span>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-xa-muted">{cloture.nb_transactions} transactions</span>
        <span className="text-xa-text font-medium">{formatFCFA(cloture.ca_calcule)}</span>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-xa-muted">Cash compté</span>
        <span className="text-xa-text">{formatFCFA(cloture.cash_compte)}</span>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-xa-muted">Écart</span>
        <span className={`font-bold ${ecartColor}`}>
          {ecartSign}
          {formatFCFA(cloture.ecart)}
        </span>
      </div>

      {!cloture.valide_par && cloture.statut !== 'a_valider' && null}
      {cloture.statut === 'a_valider' && (
        <div className="mt-1 text-xs text-amber-600 font-medium">⚠ En attente de validation</div>
      )}
    </button>
  );
}
