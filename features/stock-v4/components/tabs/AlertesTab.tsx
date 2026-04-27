'use client';

import { Plus } from 'lucide-react';
import type { ProduitAvecStatut, ModalState, BoutiqueActiveId } from '../../types';
import type { Boutique } from '@/types/database';

interface AlertesTabProps {
  produits: ProduitAvecStatut[];
  loading: boolean;
  boutiqueActive: BoutiqueActiveId;
  boutiques: Boutique[];
  onOpenModal: (state: ModalState) => void;
}

const CHIP_CLASS: Record<ProduitAvecStatut['statut'], string> = {
  ok: '',
  low: 'v4-ac-low',
  crit: 'v4-ac-crit',
  rupt: 'v4-ac-rupt',
};

const CHIP_LABEL: Record<ProduitAvecStatut['statut'], string> = {
  ok: '',
  low: 'Bas',
  crit: 'Critique',
  rupt: 'Rupture',
};

function getCategoryEmoji(cat: string | null): string {
  const c = (cat ?? '').toLowerCase();
  if (c.includes('boisson') || c.includes('drink')) return '🥤';
  if (c.includes('alimentaire') || c.includes('aliment') || c.includes('food')) return '🍎';
  if (c.includes('hygien') || c.includes('nettoy')) return '🧼';
  if (c.includes('viande') || c.includes('poisson')) return '🥩';
  if (c.includes('légume') || c.includes('legume') || c.includes('fruit')) return '🥦';
  if (c.includes('lait') || c.includes('dairy')) return '🥛';
  if (c.includes('pain') || c.includes('boulangerie')) return '🍞';
  return '📦';
}

function getActiveBoutiqueId(
  boutiqueActive: BoutiqueActiveId,
  produitBoutiqueId: string,
): string {
  if (boutiqueActive === 'all') return produitBoutiqueId;
  return boutiqueActive;
}

export default function AlertesTab({
  produits,
  loading,
  boutiqueActive,
  boutiques,
  onOpenModal,
}: AlertesTabProps) {
  const alertes = produits.filter(
    (p) => p.statut === 'low' || p.statut === 'crit' || p.statut === 'rupt',
  );

  if (loading) {
    return (
      <div className="v4-alert-list">
        {[1, 2, 3].map((i) => (
          <div key={i} className="v4-skeleton" />
        ))}
      </div>
    );
  }

  if (alertes.length === 0) {
    return (
      <div className="v4-empty">
        <span className="v4-empty-icon">✅</span>
        <p>Aucune alerte de stock</p>
      </div>
    );
  }

  return (
    <div className="v4-alert-list">
      {alertes.map((p) => {
        const boutiqueId = getActiveBoutiqueId(boutiqueActive, p.boutique_id);
        const chipClass = CHIP_CLASS[p.statut];
        const chipLabel = CHIP_LABEL[p.statut];
        const emoji = getCategoryEmoji(p.categorie);

        return (
          <div key={`${p.id}-${p.boutique_id}`} className="v4-alert-item">
            <span className="v4-ai-em">{emoji}</span>

            <div className="v4-ai-left">
              <div className="v4-ai-nm">{p.nom}</div>
              <div className="v4-ai-sub">
                <span className="v4-ai-cat">{p.categorie ?? 'Général'}</span>
                <span className={`v4-ai-chip ${chipClass}`}>{chipLabel}</span>
              </div>

              {boutiqueActive === 'all' && boutiques.length > 1 && (
                <div className="v4-ai-boutique-row">
                  {(() => {
                    const b = boutiques.find((b) => b.id === p.boutique_id);
                    if (!b) return null;
                    return (
                      <span key={b.id} className="v4-ai-b-pill">
                        <span
                          className="v4-ai-b-dot"
                          style={{ background: b.couleur_theme ?? '#666' }}
                        />
                        <span className="v4-ai-b-txt">{b.nom}</span>
                        <span className="v4-ai-b-qty">
                          {p.stock_actuel}
                          {p.unite ? ` ${p.unite}` : ''}
                        </span>
                      </span>
                    );
                  })()}
                </div>
              )}
            </div>

            <button
              type="button"
              className="v4-alert-btn g"
              aria-label={`Ajouter du stock pour ${p.nom}`}
              onClick={() => onOpenModal({ type: 'entree', produit: p, boutiqueId })}
            >
              <Plus size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 3 }} />
              Stock
            </button>
          </div>
        );
      })}
    </div>
  );
}
