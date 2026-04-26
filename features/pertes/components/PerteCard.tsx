'use client';

import { formatFCFA, formatDateTime } from '@/lib/format';
import type { PerteDeclaration } from '@/types/database';
import MotifPill from './MotifPill';

type PerteStatut = PerteDeclaration['statut'];

const STATUT_CONFIG: Record<PerteStatut, { label: string; classes: string }> = {
  declaree: { label: 'Déclarée', classes: 'bg-amber-100 text-amber-700 border-amber-200' },
  validee: { label: 'Validée', classes: 'bg-blue-100 text-blue-700 border-blue-200' },
  contestee: { label: 'Contestée', classes: 'bg-red-100 text-red-700 border-red-200' },
  comptabilisee: {
    label: 'Comptabilisée',
    classes: 'bg-green-100 text-green-700 border-green-200',
  },
};

type Props = {
  perte: PerteDeclaration;
  onClick: () => void;
};

export default function PerteCard({ perte, onClick }: Props) {
  const statut = STATUT_CONFIG[perte.statut];

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left bg-xa-surface border border-xa-border rounded-2xl p-4 flex gap-3 active:scale-[.98] transition-transform"
    >
      {/* Photo thumb */}
      {perte.photo_url ? (
        <div className="w-14 h-14 flex-shrink-0 rounded-xl overflow-hidden border border-xa-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={perte.photo_url}
            alt="Photo perte"
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="w-14 h-14 flex-shrink-0 rounded-xl bg-xa-bg border border-xa-border flex items-center justify-center text-xl">
          📦
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <span className="font-semibold text-xa-text text-sm leading-tight truncate">
            {perte.produit_nom}
          </span>
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full border flex-shrink-0 ${statut.classes}`}
          >
            {statut.label}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <MotifPill motif={perte.motif} />
          <span className="text-xs text-xa-muted">
            {perte.quantite} unité{perte.quantite > 1 ? 's' : ''}
          </span>
          <span className="text-xs font-medium text-xa-text">
            {formatFCFA(perte.valeur_estimee)}
          </span>
        </div>

        <div className="text-xs text-xa-muted">{formatDateTime(perte.created_at)}</div>
      </div>
    </button>
  );
}
