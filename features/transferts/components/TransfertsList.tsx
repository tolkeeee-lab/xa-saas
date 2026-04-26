'use client';

import type { TransfertStock, Boutique } from '@/types/database';
import TransfertCard from './TransfertCard';

type ProduitInfo = {
  id: string;
  nom: string;
  categorie?: string | null;
};

type Props = {
  transferts: TransfertStock[];
  boutiques: Boutique[];
  produits: ProduitInfo[];
  loading: boolean;
  onSelect: (t: TransfertStock) => void;
};

export default function TransfertsList({ transferts, boutiques, produits, loading, onSelect }: Props) {
  if (loading) {
    return (
      <div className="flex flex-col gap-3 p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-2xl bg-xa-surface border border-xa-border animate-pulse" />
        ))}
      </div>
    );
  }

  if (transferts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="text-4xl mb-3">🔄</div>
        <p className="text-xa-text font-medium mb-1">Aucun transfert</p>
        <p className="text-xa-muted text-sm">
          Appuyez sur &ldquo;Nouveau transfert&rdquo; pour commencer.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      {transferts.map((t) => {
        const produit = produits.find((p) => p.id === t.produit_id);
        return (
          <TransfertCard
            key={t.id}
            transfert={t}
            boutiques={boutiques}
            produitNom={produit?.nom}
            produitCategorie={produit?.categorie ?? undefined}
            onClick={() => onSelect(t)}
          />
        );
      })}
    </div>
  );
}
