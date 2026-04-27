'use client';

import { Plus } from 'lucide-react';
import type { ProduitAvecStatut, ModalState, BoutiqueActiveId } from '../../types';
import type { Boutique } from '@/types/database';
import StockKpiRow from '../StockKpiRow';
import StockSearchBar from '../StockSearchBar';
import StockCatChips from '../StockCatChips';
import type { SortMode } from '../../types';
import type { StockKpis } from '../../types';
import { getCategoryEmoji } from '../../utils/categoryEmoji';

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

function getMaxStock(p: ProduitAvecStatut): number {
  return Math.max((p.seuil_alerte ?? 0) * 2, p.stock_actuel, 1);
}

function getBarPct(p: ProduitAvecStatut): number {
  return Math.min(100, Math.round((p.stock_actuel / getMaxStock(p)) * 100));
}

function formatPrice(v: number): string {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(v) + ' F';
}

function formatValeurTotal(v: number): string {
  if (v >= 1_000_000) return `${Math.round(v / 1_000_000)}M F`;
  if (v >= 1_000) return `${Math.round(v / 1_000)}k F`;
  return `${Math.round(v)} F`;
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
              <div key={i} className="v4-skeleton" style={{ height: 72 }} />
            ))}
          </>
        ) : produits.length === 0 ? (
          <div className="v4-empty">
            <span className="v4-empty-icon">📦</span>
            <p>{search ? 'Aucun produit trouvé' : 'Aucun produit en stock'}</p>
          </div>
        ) : (
          produits.map((p) => {
            const barPct = getBarPct(p);
            const boutiqueId = getActiveBoutiqueId(boutiqueActive, boutiques, p.boutique_id);
            const boutiqueName =
              boutiqueActive === 'all'
                ? boutiques.find((b) => b.id === p.boutique_id)?.nom
                : null;
            const emoji = getCategoryEmoji(p.categorie);
            const valeurTotale = p.stock_actuel * p.prix_vente;
            const barVariant =
              p.statut === 'ok' ? '--ok'
              : p.statut === 'rupt' ? '--rupt'
              : '--low';

            return (
              <div key={`${p.id}-${p.boutique_id}`} className="v4-pli">
                {/* Avatar */}
                <div className="v4-pli-avatar">{emoji}</div>

                {/* Info col */}
                <div className="v4-pli-info">
                  <div className="v4-pli-nm">
                    {p.nom}
                    {boutiqueName && (
                      <span className="v4-pli-boutique"> · {boutiqueName}</span>
                    )}
                  </div>
                  <div className="v4-pli-chip">
                    {emoji} {p.categorie ?? 'Général'}
                  </div>
                  <div className="v4-pli-bar">
                    <div
                      className={`v4-pli-bar-fill${barVariant}`}
                      style={{ width: `${barPct}%` }}
                    />
                  </div>
                  <div className="v4-pli-ratio">
                    {p.stock_actuel}{p.unite ? ` ${p.unite}` : ''} / {getMaxStock(p)}
                  </div>
                </div>

                {/* Price col */}
                <div className="v4-pli-price-col">
                  <span className="v4-pli-price">{formatPrice(p.prix_vente)}</span>
                  <span className="v4-pli-value">{formatValeurTotal(valeurTotale)}</span>
                  <span className={`v4-badge-statut ${p.statut}`}>
                    {STATUT_LABELS[p.statut]}
                  </span>
                  <button
                    type="button"
                    className="v4-pli-add-btn"
                    aria-label={`Ajouter du stock pour ${p.nom}`}
                    onClick={() =>
                      onOpenModal({ type: 'entree', produit: p, boutiqueId })
                    }
                  >
                    <Plus size={13} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
