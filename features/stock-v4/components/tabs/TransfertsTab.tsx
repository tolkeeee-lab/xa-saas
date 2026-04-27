// Transferts tab — liste des transferts inter-boutiques + création
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import type { Boutique, TransfertStock } from '@/types/database';
import type { BoutiqueActiveId } from '../../types';
import NouveauTransfertModal from '@/features/transferts/modals/NouveauTransfertModal';

interface TransfertsTabProps {
  boutiques: Boutique[];
  boutiqueActive: BoutiqueActiveId;
}

const STATUT_LABELS: Record<TransfertStock['statut'], string> = {
  en_attente: 'En attente',
  recu: 'Reçu',
  annule: 'Annulé',
};

const STATUT_CLASSES: Record<TransfertStock['statut'], string> = {
  en_attente: 'v4-tr-status v4-pct-amber',
  recu: 'v4-tr-status v4-pct-green',
  annule: 'v4-tr-status v4-pct-muted',
};

export default function TransfertsTab({ boutiques, boutiqueActive }: TransfertsTabProps) {
  const [transferts, setTransferts] = useState<TransfertStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Build a map for boutique name lookup
  const boutiqueMap = new Map(boutiques.map((b) => [b.id, b]));

  const sourceFilter = boutiqueActive !== 'all' ? boutiqueActive : '';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: '1' });
      if (sourceFilter) params.set('source_id', sourceFilter);

      const res = await fetch(`/api/transferts?${params.toString()}`);
      const json = (await res.json()) as { data?: TransfertStock[]; error?: string };
      setTransferts(json.data ?? []);
    } catch {
      setTransferts([]);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="v4-tr-list">
        {[1, 2, 3].map((i) => (
          <div key={i} className="v4-skeleton" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="v4-tr-list">
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
          <button
            type="button"
            className="v4-tab-action-btn"
            onClick={() => setModalOpen(true)}
            disabled={boutiques.length < 2}
            title={boutiques.length < 2 ? 'Créez une 2ᵉ boutique pour effectuer un transfert' : undefined}
          >
            <Plus size={13} />
            Nouveau
          </button>
        </div>

        {transferts.length === 0 ? (
          <div className="v4-empty">
            <span className="v4-empty-icon">🔄</span>
            <p>Aucun transfert récent</p>
          </div>
        ) : (
          transferts.map((t: TransfertStock) => {
            const source = boutiqueMap.get(t.boutique_source_id);
            const dest = boutiqueMap.get(t.boutique_destination_id);
            const sourceNom = source?.nom ?? t.boutique_source_id.slice(0, 8) + '…';
            const destNom = dest?.nom ?? t.boutique_destination_id.slice(0, 8) + '…';
            const dateStr = new Date(t.created_at).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'short',
            });

            return (
              <div key={t.id} className="v4-tr-item">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="v4-tr-route">
                    <span
                      style={source ? { color: source.couleur_theme, fontWeight: 700 } : undefined}
                    >
                      {sourceNom}
                    </span>
                    <span className="v4-tr-arrow">→</span>
                    <span
                      style={dest ? { color: dest.couleur_theme, fontWeight: 700 } : undefined}
                    >
                      {destNom}
                    </span>
                  </div>
                  <div className="v4-tr-meta">
                    <span>{t.quantite} unité{t.quantite !== 1 ? 's' : ''}</span>
                    <span>·</span>
                    <span>{dateStr}</span>
                  </div>
                </div>
                <span className={STATUT_CLASSES[t.statut]}>
                  {STATUT_LABELS[t.statut]}
                </span>
              </div>
            );
          })
        )}
      </div>

      {modalOpen && (
        <NouveauTransfertModal
          boutiques={boutiques}
          onClose={() => setModalOpen(false)}
          onSuccess={() => {
            setModalOpen(false);
            void load();
          }}
        />
      )}
    </>
  );
}
