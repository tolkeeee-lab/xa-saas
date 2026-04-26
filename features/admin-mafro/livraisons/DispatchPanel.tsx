'use client';

import { useState, useCallback } from 'react';
import { Truck, Plus } from 'lucide-react';
import type { CommandeB2B, Livraison } from '@/types/database';
import AssignerLivreurModal from './AssignerLivreurModal';

type CommandeMinimal = Pick<CommandeB2B, 'id' | 'numero' | 'statut' | 'boutique_id' | 'total'>;

type Props = {
  initialLivraisons: Livraison[];
  commandesPrets: CommandeMinimal[];
};

const STATUT_LABELS: Record<string, string> = {
  preparation: 'En préparation',
  en_route: 'En route',
  livree: 'Livrée',
  retournee: 'Retournée',
};

const STATUT_COLORS: Record<string, string> = {
  preparation: 'amber',
  en_route: 'blue',
  livree: 'green',
  retournee: 'red',
};

export default function DispatchPanel({ initialLivraisons, commandesPrets }: Props) {
  const [livraisons, setLivraisons] = useState<Livraison[]>(initialLivraisons);
  const [dispatchOpen, setDispatchOpen] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const showToast = useCallback((msg: string, type: 'ok' | 'err') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const handleUpdateStatut = useCallback(
    async (livraisonId: string, newStatut: Livraison['statut']) => {
      setLoadingId(livraisonId);
      try {
        const res = await fetch(`/api/admin-mafro/livraisons/${livraisonId}/statut`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ statut: newStatut }),
        });
        if (!res.ok) throw new Error('Erreur serveur');
        setLivraisons((prev) =>
          prev.map((l) =>
            l.id === livraisonId
              ? {
                  ...l,
                  statut: newStatut,
                  parti_at: newStatut === 'en_route' ? new Date().toISOString() : l.parti_at,
                  livre_at: newStatut === 'livree' ? new Date().toISOString() : l.livre_at,
                }
              : l,
          ),
        );
        showToast('Livraison mise à jour', 'ok');
      } catch {
        showToast('Erreur lors de la mise à jour', 'err');
      } finally {
        setLoadingId(null);
      }
    },
    [showToast],
  );

  const handleDispatchSuccess = (nouvelle: Livraison) => {
    setLivraisons((prev) => [nouvelle, ...prev]);
    setDispatchOpen(false);
    showToast('Livraison créée et assignée', 'ok');
  };

  return (
    <div className="xa-dispatch-panel">
      {toast && <div className={`xa-toast xa-toast--${toast.type}`}>{toast.msg}</div>}

      <div className="xa-dispatch-panel__toolbar">
        <button
          className="xa-btn xa-btn--primary"
          onClick={() => setDispatchOpen(true)}
          disabled={commandesPrets.length === 0}
        >
          <Plus size={16} />
          Dispatcher une livraison
        </button>
        <span className="xa-dispatch-panel__info">
          {commandesPrets.length} commande(s) prête(s) à expédier
        </span>
      </div>

      <div className="xa-livraisons-grid">
        {livraisons.length === 0 && (
          <p style={{ color: 'var(--xa-muted)', padding: '2rem 0' }}>
            Aucune livraison enregistrée
          </p>
        )}
        {livraisons.map((l) => (
          <div key={l.id} className={`xa-livraison-card xa-livraison-card--${STATUT_COLORS[l.statut]}`}>
            <div className="xa-livraison-card__header">
              <Truck size={18} />
              <span className="xa-livraison-card__numero">#{l.numero}</span>
              <span className={`xa-badge xa-badge--${STATUT_COLORS[l.statut]}`}>
                {STATUT_LABELS[l.statut]}
              </span>
            </div>
            <dl className="xa-dl xa-dl--compact">
              {l.chauffeur && <><dt>Chauffeur</dt><dd>{l.chauffeur}</dd></>}
              {l.vehicule && <><dt>Véhicule</dt><dd>{l.vehicule}</dd></>}
              <dt>Créée le</dt>
              <dd>{new Date(l.created_at).toLocaleDateString('fr-FR')}</dd>
              {l.parti_at && (
                <><dt>Parti le</dt><dd>{new Date(l.parti_at).toLocaleDateString('fr-FR')}</dd></>
              )}
            </dl>
            <div className="xa-livraison-card__actions">
              {l.statut === 'preparation' && (
                <button
                  className="xa-btn xa-btn--sm xa-btn--blue"
                  onClick={() => handleUpdateStatut(l.id, 'en_route')}
                  disabled={loadingId === l.id}
                >
                  Marquer en route
                </button>
              )}
              {l.statut === 'en_route' && (
                <button
                  className="xa-btn xa-btn--sm xa-btn--green"
                  onClick={() => handleUpdateStatut(l.id, 'livree')}
                  disabled={loadingId === l.id}
                >
                  Marquer livrée
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {dispatchOpen && (
        <AssignerLivreurModal
          commandesPrets={commandesPrets}
          onClose={() => setDispatchOpen(false)}
          onSuccess={handleDispatchSuccess}
        />
      )}
    </div>
  );
}
