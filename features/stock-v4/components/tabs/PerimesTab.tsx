'use client';

import { useState, useCallback } from 'react';
import type { ProduitAvecStatut, BoutiqueActiveId } from '../../types';
import type { Boutique } from '@/types/database';
import RetireStockModal from '../RetireStockModal';

interface PerimesTabProps {
  produits: ProduitAvecStatut[];
  loading: boolean;
  boutiqueActive: BoutiqueActiveId;
  boutiques: Boutique[];
  onRefresh: () => void;
}

interface RetireModal {
  produit: ProduitAvecStatut;
  boutiqueId: string;
}

function getDlcInfo(dateStr: string): {
  label: string;
  className: 'v4-dlc-expired' | 'v4-dlc-soon' | 'v4-dlc-ok';
} {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dlc = new Date(dateStr);
  dlc.setHours(0, 0, 0, 0);
  const diffMs = dlc.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { label: `Périmé J${diffDays}`, className: 'v4-dlc-expired' };
  }
  if (diffDays === 0) {
    return { label: "Aujourd'hui", className: 'v4-dlc-soon' };
  }
  if (diffDays <= 7) {
    return { label: `J+${diffDays} jour${diffDays > 1 ? 's' : ''}`, className: 'v4-dlc-soon' };
  }
  return { label: `J+${diffDays} jours`, className: 'v4-dlc-ok' };
}

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

export default function PerimesTab({
  produits,
  loading,
  boutiqueActive,
  boutiques,
  onRefresh,
}: PerimesTabProps) {
  const [retireModal, setRetireModal] = useState<RetireModal | null>(null);

  const handleRetireSuccess = useCallback(() => {
    setRetireModal(null);
    onRefresh();
  }, [onRefresh]);

  // Filter products that have a date_peremption set
  const withDlc = produits.filter((p) => p.date_peremption != null);

  // Sort: expired first, then by DLC ascending
  const sorted = [...withDlc].sort((a, b) => {
    const da = new Date(a.date_peremption!).getTime();
    const db = new Date(b.date_peremption!).getTime();
    return da - db;
  });

  if (loading) {
    return (
      <div className="v4-perime-list">
        {[1, 2, 3].map((i) => (
          <div key={i} className="v4-skeleton" />
        ))}
      </div>
    );
  }

  if (withDlc.length === 0) {
    return (
      <div className="v4-empty">
        <span className="v4-empty-icon">📅</span>
        <p>Aucun produit avec date de péremption</p>
      </div>
    );
  }

  return (
    <>
      <div className="v4-perime-list">
        {sorted.map((p) => {
          const dlc = getDlcInfo(p.date_peremption!);
          const emoji = getCategoryEmoji(p.categorie);
          const boutique = boutiques.find((b) => b.id === p.boutique_id);
          const boutiqueId =
            boutiqueActive === 'all' ? p.boutique_id : (boutiqueActive as string);

          return (
            <div key={`${p.id}-${p.boutique_id}`} className="v4-perime-item">
              <span className="v4-pi-em">{emoji}</span>

              <div className="v4-pi-info">
                <div className="v4-pi-nm">{p.nom}</div>
                {boutique && (
                  <div className="v4-pi-boutique">{boutique.nom}</div>
                )}
                <span className={`v4-dlc-pill ${dlc.className}`}>{dlc.label}</span>
              </div>

              <div className="v4-pi-right">
                <span className="v4-pi-qty">
                  {p.stock_actuel}
                  {p.unite ? ` ${p.unite}` : ''}
                </span>
                <button
                  type="button"
                  className="v4-pi-btn"
                  aria-label={`Retirer ${p.nom} du stock`}
                  onClick={() => setRetireModal({ produit: p, boutiqueId })}
                >
                  Retirer
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {retireModal && (
        <RetireStockModal
          produit={retireModal.produit}
          boutiqueId={retireModal.boutiqueId}
          onClose={() => setRetireModal(null)}
          onSuccess={handleRetireSuccess}
        />
      )}
    </>
  );
}
