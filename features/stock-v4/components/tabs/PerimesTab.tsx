'use client';

import { useState, useCallback } from 'react';
import type { ProduitAvecStatut, BoutiqueActiveId } from '../../types';
import type { Boutique } from '@/types/database';
import RetireStockModal from '../RetireStockModal';
import PeremptionDateModal from '../PeremptionDateModal';
import { getCategoryEmoji } from '../../utils/categoryEmoji';

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

export default function PerimesTab({
  produits,
  loading,
  boutiqueActive,
  boutiques,
  onRefresh,
}: PerimesTabProps) {
  const [retireModal, setRetireModal] = useState<RetireModal | null>(null);
  const [editDateModal, setEditDateModal] = useState<{ produit: ProduitAvecStatut } | null>(null);

  const handleRetireSuccess = useCallback(() => {
    setRetireModal(null);
    onRefresh();
  }, [onRefresh]);

  const handleEditDateSuccess = useCallback(() => {
    setEditDateModal(null);
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
              <span className="v4-pi-em">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.nom} style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 8 }} />
                ) : (
                  emoji
                )}
              </span>

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
                  aria-label={`Modifier la date de péremption de ${p.nom}`}
                  onClick={() => setEditDateModal({ produit: p })}
                >
                  📅
                </button>
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

      {editDateModal && (
        <PeremptionDateModal
          produit={editDateModal.produit}
          onClose={() => setEditDateModal(null)}
          onSuccess={handleEditDateSuccess}
        />
      )}
    </>
  );
}
