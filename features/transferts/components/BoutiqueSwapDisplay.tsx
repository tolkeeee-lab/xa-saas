'use client';

import { ArrowRight } from 'lucide-react';

type BoutiqueInfo = {
  id: string;
  nom: string;
  couleur_theme: string;
};

type Props = {
  source: BoutiqueInfo;
  destination: BoutiqueInfo;
};

export default function BoutiqueSwapDisplay({ source, destination }: Props) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="text-xs font-semibold px-2 py-1 rounded-full border truncate max-w-[120px]"
        style={{
          backgroundColor: source.couleur_theme + '22',
          borderColor: source.couleur_theme + '55',
          color: source.couleur_theme,
        }}
      >
        {source.nom}
      </span>
      <ArrowRight size={14} className="text-xa-muted flex-shrink-0" />
      <span
        className="text-xs font-semibold px-2 py-1 rounded-full border truncate max-w-[120px]"
        style={{
          backgroundColor: destination.couleur_theme + '22',
          borderColor: destination.couleur_theme + '55',
          color: destination.couleur_theme,
        }}
      >
        {destination.nom}
      </span>
    </div>
  );
}
