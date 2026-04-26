'use client';

import { TrendingDown } from 'lucide-react';
import type { Boutique } from '@/types/database';

type Props = {
  boutiques: Boutique[];
  activeBoutiqueId: string;
  onBoutiqueChange: (id: string) => void;
  search: string;
  onSearchChange: (v: string) => void;
  motifFilter: string;
  onMotifFilterChange: (v: string) => void;
};

export default function PertesHeader({
  boutiques,
  activeBoutiqueId,
  onBoutiqueChange,
  search,
  onSearchChange,
  motifFilter,
  onMotifFilterChange,
}: Props) {
  return (
    <div className="bg-xa-surface border-b border-xa-border">
      <div className="flex items-center gap-3 p-4 pb-2">
        <TrendingDown size={20} className="text-xa-primary flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="font-bold text-xa-text block">Pertes</span>
          <span className="text-xs text-xa-muted">Déclarations de pertes &amp; casses</span>
        </div>
        {boutiques.length > 1 && (
          <select
            value={activeBoutiqueId}
            onChange={(e) => onBoutiqueChange(e.target.value)}
            className="rounded-xl border border-xa-border bg-xa-bg text-xa-text px-3 py-2 text-sm"
          >
            {boutiques.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nom}
              </option>
            ))}
          </select>
        )}
      </div>
      <div className="flex gap-2 px-4 pb-3">
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Rechercher un produit…"
          className="flex-1 min-w-0 rounded-xl border border-xa-border bg-xa-bg text-xa-text text-sm px-3 py-2"
        />
        <select
          value={motifFilter}
          onChange={(e) => onMotifFilterChange(e.target.value)}
          className="rounded-xl border border-xa-border bg-xa-bg text-xa-text text-sm px-3 py-2"
        >
          <option value="">Tous motifs</option>
          <option value="sac_perce">Sac percé</option>
          <option value="perime">Périmé</option>
          <option value="vol">Vol</option>
          <option value="erreur_saisie">Erreur saisie</option>
          <option value="autre">Autre</option>
        </select>
      </div>
    </div>
  );
}
