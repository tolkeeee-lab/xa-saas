'use client';

import { useState, useCallback } from 'react';
import { CheckCircle, XCircle, Eye } from 'lucide-react';
import type { CommandeB2B } from '@/types/database';
import CommandeAdminCard from './CommandeAdminCard';

type Props = {
  initialCommandes: CommandeB2B[];
};

type StatutFilter = 'all' | CommandeB2B['statut'];

const STATUT_LABELS: Record<string, string> = {
  soumise: 'Soumise',
  confirmee: 'Confirmée',
  preparee: 'Préparée',
  en_route: 'En route',
  livree: 'Livrée',
  annulee: 'Annulée',
};

const STATUT_COLORS: Record<string, string> = {
  soumise: 'amber',
  confirmee: 'blue',
  preparee: 'purple',
  en_route: 'blue',
  livree: 'green',
  annulee: 'red',
};

export default function CommandesQueue({ initialCommandes }: Props) {
  const [commandes, setCommandes] = useState<CommandeB2B[]>(initialCommandes);
  const [filter, setFilter] = useState<StatutFilter>('all');
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const showToast = useCallback((msg: string, type: 'ok' | 'err') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const handleUpdateStatut = useCallback(
    async (commandeId: string, newStatut: CommandeB2B['statut']) => {
      setLoadingId(commandeId);
      try {
        const res = await fetch(`/api/admin-mafro/commandes/${commandeId}/statut`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ statut: newStatut }),
        });
        if (!res.ok) throw new Error('Erreur serveur');
        setCommandes((prev) =>
          prev.map((c) => (c.id === commandeId ? { ...c, statut: newStatut } : c)),
        );
        showToast(
          `Commande ${newStatut === 'annulee' ? 'annulée' : 'mise à jour'}`,
          'ok',
        );
      } catch {
        showToast('Erreur lors de la mise à jour', 'err');
      } finally {
        setLoadingId(null);
      }
    },
    [showToast],
  );

  const filtered =
    filter === 'all' ? commandes : commandes.filter((c) => c.statut === filter);

  const counts = Object.fromEntries(
    (['soumise', 'confirmee', 'preparee', 'en_route', 'livree', 'annulee'] as const).map(
      (s) => [s, commandes.filter((c) => c.statut === s).length],
    ),
  ) as Record<CommandeB2B['statut'], number>;

  return (
    <div className="xa-commandes-queue">
      {toast && (
        <div className={`xa-toast xa-toast--${toast.type}`}>{toast.msg}</div>
      )}

      {/* Filters */}
      <div className="xa-commandes-queue__filters">
        <button
          className={`xa-filter-btn${filter === 'all' ? ' xa-filter-btn--active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Toutes ({commandes.length})
        </button>
        {(Object.keys(STATUT_LABELS) as CommandeB2B['statut'][]).map((s) => (
          <button
            key={s}
            className={`xa-filter-btn xa-filter-btn--${STATUT_COLORS[s]}${filter === s ? ' xa-filter-btn--active' : ''}`}
            onClick={() => setFilter(s)}
          >
            {STATUT_LABELS[s]} ({counts[s]})
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="xa-commandes-table-wrap">
        <table className="xa-commandes-table">
          <thead>
            <tr>
              <th>Numéro</th>
              <th>Statut</th>
              <th>Total</th>
              <th>Paiement</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--xa-muted)' }}>
                  Aucune commande
                </td>
              </tr>
            )}
            {filtered.map((c) => (
              <tr key={c.id} className={`xa-commandes-table__row xa-commandes-table__row--${STATUT_COLORS[c.statut]}`}>
                <td className="xa-commandes-table__numero">#{c.numero}</td>
                <td>
                  <span className={`xa-badge xa-badge--${STATUT_COLORS[c.statut]}`}>
                    {STATUT_LABELS[c.statut]}
                  </span>
                </td>
                <td className="xa-commandes-table__total">
                  {c.total.toLocaleString('fr-FR')} FCFA
                </td>
                <td>
                  <span className={`xa-badge xa-badge--${c.paiement_status === 'paye' ? 'green' : 'amber'}`}>
                    {c.paiement_status === 'paye' ? 'Payé' : 'En attente'}
                  </span>
                </td>
                <td className="xa-commandes-table__date">
                  {new Date(c.created_at).toLocaleDateString('fr-FR')}
                </td>
                <td className="xa-commandes-table__actions">
                  <button
                    onClick={() => setSelectedId(c.id)}
                    className="xa-btn-icon"
                    title="Voir détails"
                  >
                    <Eye size={16} />
                  </button>
                  {c.statut === 'soumise' && (
                    <>
                      <button
                        onClick={() => handleUpdateStatut(c.id, 'confirmee')}
                        className="xa-btn-icon xa-btn-icon--green"
                        title="Confirmer"
                        disabled={loadingId === c.id}
                      >
                        <CheckCircle size={16} />
                      </button>
                      <button
                        onClick={() => handleUpdateStatut(c.id, 'annulee')}
                        className="xa-btn-icon xa-btn-icon--red"
                        title="Annuler"
                        disabled={loadingId === c.id}
                      >
                        <XCircle size={16} />
                      </button>
                    </>
                  )}
                  {c.statut === 'confirmee' && (
                    <button
                      onClick={() => handleUpdateStatut(c.id, 'preparee')}
                      className="xa-btn-icon xa-btn-icon--purple"
                      title="Marquer préparée"
                      disabled={loadingId === c.id}
                    >
                      <CheckCircle size={16} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedId && (
        <CommandeAdminCard
          commandeId={selectedId}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}
