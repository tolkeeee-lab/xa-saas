'use client';

import { Plus } from 'lucide-react';
import type { ProduitAvecStatut, ModalState, BoutiqueActiveId } from '../../types';
import type { Boutique } from '@/types/database';
import StockKpiRow from '../StockKpiRow';
import StockSearchBar from '../StockSearchBar';
import StockCatChips from '../StockCatChips';
import type { SortMode } from '../../types';
import type { StockKpis } from '../../types';

interface VueTabProps {
  produits: ProduitAvecStatut[];
  kpis: StockKpis;
  loading: boolean;
  search: string;
  onSearchChange: (v: string) => void;
  sortMode: SortMode;
  onSortChange: (s: SortMode) => void;
  catActive: string;
  onCatChange: (c: string) => void;
  categories: string[];
  boutiqueActive: BoutiqueActiveId;
  boutiques: Boutique[];
  onOpenModal: (state: ModalState) => void;
}

const STATUT_LABELS: Record<ProduitAvecStatut['statut'], string> = {
  ok: 'OK',
  low: 'Faible',
  crit: 'Critique',
  rupt: 'Rupture',
};

function getGaugePct(p: ProduitAvecStatut): number {
  if (p.stock_actuel <= 0) return 0;
  const max = Math.max(p.seuil_alerte * 3, p.stock_actuel, 1);
  return Math.min(100, Math.round((p.stock_actuel / max) * 100));
}

function getActiveBoutiqueId(
  boutiqueActive: BoutiqueActiveId,
  boutiques: Boutique[],
  produitBoutiqueId: string,
): string {
  if (boutiqueActive === 'all') return produitBoutiqueId;
  return boutiqueActive;
}

export default function VueTab({
  produits,
  kpis,
  loading,
  search,
  onSearchChange,
  sortMode,
  onSortChange,
  catActive,
  onCatChange,
  categories,
  boutiqueActive,
  boutiques,
  onOpenModal,
}: VueTabProps) {
  return (
    <>
      <StockKpiRow kpis={kpis} loading={loading} />
      <StockSearchBar
        value={search}
        onChange={onSearchChange}
        sortMode={sortMode}
        onSortChange={onSortChange}
      />
      <StockCatChips
        categories={categories}
        active={catActive}
        onChange={onCatChange}
      />

      {boutiqueActive === 'all' && (
        <div className="v4-banner-all" style={{ margin: '0 14px 8px', borderRadius: 10 }}>
          <span>🏪</span>
          <span>Vue consolidée — {boutiques.length} boutique{boutiques.length > 1 ? 's' : ''}</span>
        </div>
      )}

      <div className="v4-produit-list">
        {loading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="v4-skeleton" />
            ))}
          </>
        ) : produits.length === 0 ? (
          <div className="v4-empty">
            <span className="v4-empty-icon">📦</span>
            <p>{search ? 'Aucun produit trouvé' : 'Aucun produit en stock'}</p>
          </div>
        ) : (
          produits.map((p) => {
            const pct = getGaugePct(p);
            const boutiqueId = getActiveBoutiqueId(boutiqueActive, boutiques, p.boutique_id);
            const boutiqueName =
              boutiqueActive === 'all'
                ? boutiques.find((b) => b.id === p.boutique_id)?.nom
                : null;

            return (
              <div key={`${p.id}-${p.boutique_id}`} className="v4-produit-card">
                <div className="v4-produit-info">
                  <div className="v4-produit-nom">{p.nom}</div>
                  <div className="v4-produit-cat">
                    {p.categorie ?? 'Général'}
                    {boutiqueName ? ` · ${boutiqueName}` : ''}
                  </div>
                </div>

                <div className="v4-produit-stock-wrap">
                  <span className={`v4-stock-val ${p.statut}`}>
                    {p.stock_actuel}
                    {p.unite ? ` ${p.unite}` : ''}
                  </span>
                  <div className="v4-stock-gauge">
                    <div
                      className={`v4-stock-gauge-fill ${p.statut}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className={`v4-badge-statut ${p.statut}`}>
                    {STATUT_LABELS[p.statut]}
                  </span>
                </div>

                <button
                  type="button"
                  className="v4-plus-btn"
                  aria-label={`Ajouter du stock pour ${p.nom}`}
                  onClick={() =>
                    onOpenModal({ type: 'entree', produit: p, boutiqueId })
                  }
                >
                  <Plus size={14} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
