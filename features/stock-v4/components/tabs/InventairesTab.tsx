// Inventaires tab — liste des inventaires physiques + création
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { createClient as createBrowserClient } from '@/lib/supabase-browser';
import type { Boutique, Inventaire } from '@/types/database';
import type { BoutiqueActiveId } from '../../types';
import InventaireModal from '../InventaireModal';

interface InventairesTabProps {
  boutiques: Boutique[];
  boutiqueActive: BoutiqueActiveId;
}

const STATUT_LABELS: Record<Inventaire['statut'], string> = {
  en_cours: 'En cours',
  valide: 'Validé',
  annule: 'Annulé',
};

const STATUT_CLASSES: Record<Inventaire['statut'], string> = {
  en_cours: 'v4-inv-pct v4-pct-amber',
  valide: 'v4-inv-pct v4-pct-green',
  annule: 'v4-inv-pct v4-pct-muted',
};

export default function InventairesTab({ boutiques, boutiqueActive }: InventairesTabProps) {
  const [inventaires, setInventaires] = useState<Inventaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const boutiqueIdsKey =
    boutiqueActive === 'all'
      ? boutiques.map((b) => b.id).join(',')
      : boutiqueActive;

  const load = useCallback(async () => {
    const ids =
      boutiqueActive === 'all'
        ? boutiques.map((b) => b.id)
        : [boutiqueActive];

    if (ids.length === 0) {
      setInventaires([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const supabase = createBrowserClient();
    const { data } = await supabase
      .from('inventaires')
      .select('*')
      .in('boutique_id', ids)
      .order('started_at', { ascending: false })
      .limit(50);
    setInventaires((data ?? []) as Inventaire[]);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boutiqueIdsKey]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="v4-inv-list">
        {[1, 2, 3].map((i) => (
          <div key={i} className="v4-skeleton" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="v4-inv-list">
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
          <button
            type="button"
            className="v4-tab-action-btn"
            onClick={() => setModalOpen(true)}
          >
            <Plus size={13} />
            Nouveau
          </button>
        </div>

        {inventaires.length === 0 ? (
          <div className="v4-empty">
            <span className="v4-empty-icon">📋</span>
            <p>Aucun inventaire en cours</p>
          </div>
        ) : (
          inventaires.map((inv: Inventaire) => {
            const boutique = boutiques.find((b) => b.id === inv.boutique_id);
            const dateStr = new Date(inv.started_at).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            });

            return (
              <div key={inv.id} className="v4-inv-item">
                <div className="v4-inv-info">
                  <div className="v4-ai-nm">Inventaire — {dateStr}</div>
                  <div className="v4-inv-meta">
                    {boutique && (
                      <span style={{ color: boutique.couleur_theme, fontWeight: 600 }}>
                        {boutique.nom}
                      </span>
                    )}
                    {boutique && <span>·</span>}
                    <span>
                      {inv.nb_produits} produit{inv.nb_produits !== 1 ? 's' : ''}
                    </span>
                    {inv.statut === 'valide' && inv.valeur_ecart_total !== 0 && (
                      <>
                        <span>·</span>
                        <span>
                          Écart :{' '}
                          {inv.valeur_ecart_total > 0 ? '+' : ''}
                          {Math.round(inv.valeur_ecart_total).toLocaleString('fr-FR')} FCFA
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <span className={STATUT_CLASSES[inv.statut]}>
                  {STATUT_LABELS[inv.statut]}
                </span>
              </div>
            );
          })
        )}
      </div>

      {modalOpen && (
        <InventaireModal
          boutiques={boutiques}
          boutiqueActive={boutiqueActive}
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
