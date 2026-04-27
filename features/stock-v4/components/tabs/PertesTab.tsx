// Pertes tab — liste des pertes déclarées + déclaration standalone
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import type { Boutique, PerteDeclaration } from '@/types/database';
import type { BoutiqueActiveId } from '../../types';
import DeclarePerteModal from '../DeclarePerteModal';

interface PertesTabProps {
  boutiques: Boutique[];
  boutiqueActive: BoutiqueActiveId;
}

type Motif = PerteDeclaration['motif'];

const MOTIF_LABELS: Record<Motif, string> = {
  sac_perce: 'Casse',
  perime: 'Péremption',
  vol: 'Vol',
  erreur_saisie: 'Erreur',
  autre: 'Autre',
};

const MOTIF_COLORS: Record<Motif, { bg: string; color: string }> = {
  perime: { bg: 'var(--v4-al)', color: '#7B5800' },
  sac_perce: { bg: 'var(--v4-rl)', color: 'var(--v4-r)' },
  vol: { bg: 'var(--v4-rl)', color: 'var(--v4-r)' },
  erreur_saisie: { bg: 'var(--v4-bl)', color: 'var(--v4-b)' },
  autre: { bg: 'var(--v4-surf)', color: 'var(--v4-mu)' },
};

export default function PertesTab({ boutiques, boutiqueActive }: PertesTabProps) {
  const [pertes, setPertes] = useState<PerteDeclaration[]>([]);
  const [loading, setLoading] = useState(true);
  const [motifFilter, setMotifFilter] = useState<Motif | ''>('');
  const [modalOpen, setModalOpen] = useState(false);

  const activeBoutiqueId = boutiqueActive !== 'all' ? boutiqueActive : (boutiques[0]?.id ?? '');

  const load = useCallback(async () => {
    if (!activeBoutiqueId) {
      setPertes([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({ boutique_id: activeBoutiqueId, page: '1' });
      if (motifFilter) params.set('motif', motifFilter);

      const res = await fetch(`/api/pertes?${params.toString()}`);
      const json = (await res.json()) as { data?: PerteDeclaration[]; error?: string };
      setPertes(json.data ?? []);
    } catch {
      setPertes([]);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBoutiqueId, motifFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const MOTIFS_LIST: { value: Motif | ''; label: string }[] = [
    { value: '', label: 'Tous' },
    { value: 'perime', label: 'Péremption' },
    { value: 'sac_perce', label: 'Casse' },
    { value: 'vol', label: 'Vol' },
    { value: 'erreur_saisie', label: 'Erreur' },
    { value: 'autre', label: 'Autre' },
  ];

  return (
    <>
      <div className="v4-pe-list">
        {/* Action row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4, gap: 8 }}>
          {/* Motif filter chips */}
          <div style={{ display: 'flex', gap: 5, overflow: 'hidden', flex: 1 }}>
            {MOTIFS_LIST.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setMotifFilter(m.value)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 20,
                  border: `1.5px solid ${motifFilter === m.value ? 'var(--v4-ink)' : 'var(--v4-brd)'}`,
                  background: motifFilter === m.value ? 'var(--v4-ink)' : 'var(--v4-card)',
                  color: motifFilter === m.value ? 'white' : 'var(--v4-mu)',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  fontFamily: 'var(--v4-f)',
                }}
              >
                {m.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="v4-tab-action-btn"
            onClick={() => setModalOpen(true)}
            style={{ flexShrink: 0 }}
          >
            <Plus size={13} />
            Déclarer
          </button>
        </div>

        {loading ? (
          [1, 2, 3].map((i) => <div key={i} className="v4-skeleton" />)
        ) : pertes.length === 0 ? (
          <div className="v4-empty">
            <span className="v4-empty-icon">✅</span>
            <p>Aucune perte déclarée</p>
          </div>
        ) : (
          pertes.map((p: PerteDeclaration) => {
            const motifColors = MOTIF_COLORS[p.motif];
            const dateStr = new Date(p.created_at).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            });

            return (
              <div key={p.id} className="v4-pe-item">
                <div className="v4-pe-info">
                  <div className="v4-ai-nm">{p.produit_nom}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
                    <span
                      className="v4-pe-motif"
                      style={{ background: motifColors.bg, color: motifColors.color }}
                    >
                      {MOTIF_LABELS[p.motif]}
                    </span>
                    <span style={{ fontSize: 10, color: 'var(--v4-mu)' }}>{dateStr}</span>
                  </div>
                </div>
                <span className="v4-pe-qty">-{p.quantite}</span>
              </div>
            );
          })
        )}
      </div>

      {modalOpen && (
        <DeclarePerteModal
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
