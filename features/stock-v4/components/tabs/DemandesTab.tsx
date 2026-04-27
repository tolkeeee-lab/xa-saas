// Demandes tab — liste des produits demandés par les clients
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Check, X } from 'lucide-react';
import type { Boutique, ProduitsDemandes } from '@/types/database';
import type { BoutiqueActiveId } from '../../types';
import { getCategoryEmoji } from '../../utils/categoryEmoji';
import AjouterDemandeModal from '../AjouterDemandeModal';

interface DemandesTabProps {
  boutiques: Boutique[];
  boutiqueActive: BoutiqueActiveId;
  onPendingCountChange?: (count: number) => void;
}

type StatutFilter = 'tous' | 'en_attente' | 'resolu';

const FILTRE_LABELS: { value: StatutFilter; label: string }[] = [
  { value: 'tous', label: 'Tous' },
  { value: 'en_attente', label: 'En attente' },
  { value: 'resolu', label: 'Résolus' },
];

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'à l\'instant';
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days}j`;
}

export default function DemandesTab({ boutiques, boutiqueActive, onPendingCountChange }: DemandesTabProps) {
  const [demandes, setDemandes] = useState<ProduitsDemandes[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtreStatut, setFiltreStatut] = useState<StatutFilter>('tous');
  const [modalOpen, setModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const activeBoutiqueId = boutiqueActive !== 'all' ? boutiqueActive : (boutiques[0]?.id ?? '');

  const load = useCallback(async () => {
    if (!activeBoutiqueId) {
      setDemandes([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({ boutique_id: activeBoutiqueId });
      if (filtreStatut !== 'tous') params.set('statut', filtreStatut);

      const res = await fetch(`/api/produits-demandes?${params.toString()}`);
      const json = (await res.json()) as { data?: ProduitsDemandes[]; pendingCount?: number };
      setDemandes(json.data ?? []);
      onPendingCountChange?.(json.pendingCount ?? 0);
    } catch {
      setDemandes([]);
    } finally {
      setLoading(false);
    }
  }, [activeBoutiqueId, filtreStatut, onPendingCountChange]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleResolve(id: string) {
    setActionLoading(id);
    try {
      await fetch(`/api/produits-demandes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut: 'resolu' }),
      });
      void load();
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete(id: string) {
    setActionLoading(id);
    try {
      await fetch(`/api/produits-demandes/${id}`, { method: 'DELETE' });
      void load();
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <>
      <div className="v4-dem-list">
        {/* Action row */}
        <div className="v4-dem-filters">
          <div style={{ display: 'flex', gap: 5, overflow: 'hidden', flex: 1 }}>
            {FILTRE_LABELS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setFiltreStatut(f.value)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 20,
                  border: `1.5px solid ${filtreStatut === f.value ? 'var(--v4-ink)' : 'var(--v4-brd)'}`,
                  background: filtreStatut === f.value ? 'var(--v4-ink)' : 'var(--v4-card)',
                  color: filtreStatut === f.value ? 'white' : 'var(--v4-mu)',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap' as const,
                  flexShrink: 0,
                  fontFamily: 'var(--v4-f)',
                }}
              >
                {f.label}
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
            Noter
          </button>
        </div>

        {loading ? (
          [1, 2, 3].map((i) => <div key={i} className="v4-skeleton" />)
        ) : demandes.length === 0 ? (
          <div className="v4-empty">
            <span className="v4-empty-icon">📥</span>
            <p>
              Aucune demande pour le moment — Notez les produits que vos clients réclament pour
              élargir votre catalogue
            </p>
          </div>
        ) : (
          demandes.map((d) => (
            <div key={d.id} className="v4-dem-item">
              <span className="v4-dem-em">{getCategoryEmoji(d.categorie)}</span>

              <div className="v4-dem-info">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' as const }}>
                  <span className="v4-dem-nm">{d.nom_produit}</span>
                  {d.nb_demandes > 1 && (
                    <span className="v4-dem-count-badge">{d.nb_demandes} demandes</span>
                  )}
                </div>

                <div className="v4-dem-meta">
                  {d.categorie && <span>{d.categorie}</span>}
                  {d.categorie && d.prix_indicatif != null && <span>·</span>}
                  {d.prix_indicatif != null && (
                    <span>{d.prix_indicatif.toLocaleString('fr-FR')} FCFA</span>
                  )}
                  {(d.categorie || d.prix_indicatif != null) && <span>·</span>}
                  <span>{relativeTime(d.created_at)}</span>
                </div>

                {d.note && <div className="v4-dem-note">{d.note}</div>}
              </div>

              {d.statut === 'en_attente' && (
                <div className="v4-dem-actions">
                  <button
                    type="button"
                    className="v4-dem-btn-resolve"
                    title="Marquer comme résolu"
                    disabled={actionLoading === d.id}
                    onClick={() => void handleResolve(d.id)}
                  >
                    <Check size={13} />
                  </button>
                  <button
                    type="button"
                    className="v4-dem-btn-delete"
                    title="Supprimer"
                    disabled={actionLoading === d.id}
                    onClick={() => void handleDelete(d.id)}
                  >
                    <X size={13} />
                  </button>
                </div>
              )}

              {d.statut === 'resolu' && (
                <div className="v4-dem-actions">
                  <button
                    type="button"
                    className="v4-dem-btn-delete"
                    title="Supprimer"
                    disabled={actionLoading === d.id}
                    onClick={() => void handleDelete(d.id)}
                  >
                    <X size={13} />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {modalOpen && (
        <AjouterDemandeModal
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
