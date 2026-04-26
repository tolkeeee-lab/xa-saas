'use client';

import type { PerteDeclaration } from '@/types/database';

type PerteMotif = PerteDeclaration['motif'];

const MOTIF_CONFIG: Record<PerteMotif, { label: string; classes: string }> = {
  sac_perce: { label: 'Sac percé', classes: 'bg-amber-100 text-amber-700 border-amber-200' },
  perime: { label: 'Périmé', classes: 'bg-red-100 text-red-700 border-red-200' },
  vol: { label: 'Vol', classes: 'bg-red-900/10 text-red-900 border-red-900/20' },
  erreur_saisie: { label: 'Erreur saisie', classes: 'bg-gray-100 text-gray-600 border-gray-200' },
  autre: { label: 'Autre', classes: 'bg-violet-100 text-violet-700 border-violet-200' },
};

type Props = {
  motif: PerteMotif;
  size?: 'sm' | 'md';
};

export default function MotifPill({ motif, size = 'sm' }: Props) {
  const config = MOTIF_CONFIG[motif];
  const sizeClasses = size === 'md' ? 'text-sm px-3 py-1' : 'text-xs px-2 py-0.5';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${sizeClasses} ${config.classes}`}
    >
      {config.label}
    </span>
  );
}
