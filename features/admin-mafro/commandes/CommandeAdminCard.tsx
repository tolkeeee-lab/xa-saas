'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { CommandeB2B, CommandeB2BLigne } from '@/types/database';

type Props = {
  commandeId: string;
  onClose: () => void;
};

export default function CommandeAdminCard({ commandeId, onClose }: Props) {
  const [commande, setCommande] = useState<CommandeB2B | null>(null);
  const [lignes, setLignes] = useState<CommandeB2BLigne[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setFetchError(false);
      try {
        const res = await fetch(`/api/admin-mafro/commandes/${commandeId}`);
        if (res.ok) {
          const data = await res.json();
          setCommande(data.commande);
          setLignes(data.lignes ?? []);
        } else {
          setFetchError(true);
        }
      } catch {
        setFetchError(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [commandeId]);

  return (
    <div className="xa-modal-overlay" onClick={onClose}>
      <div className="xa-modal" onClick={(e) => e.stopPropagation()}>
        <div className="xa-modal__header">
          <h2 className="xa-modal__title">
            {commande ? `Commande #${commande.numero}` : 'Détails commande'}
          </h2>
          <button onClick={onClose} className="xa-modal__close">
            <X size={20} />
          </button>
        </div>
        <div className="xa-modal__body">
          {loading && <p style={{ color: 'var(--xa-muted)' }}>Chargement…</p>}
          {!loading && fetchError && (
            <div className="xa-error-banner">
              Impossible de charger les détails de la commande.
            </div>
          )}
          {!loading && !fetchError && commande && (
            <>
              <dl className="xa-dl">
                <dt>Statut</dt>
                <dd>{commande.statut}</dd>
                <dt>Total</dt>
                <dd>{commande.total.toLocaleString('fr-FR')} FCFA</dd>
                <dt>Paiement</dt>
                <dd>{commande.paiement_status}</dd>
                <dt>Date</dt>
                <dd>{new Date(commande.created_at).toLocaleDateString('fr-FR')}</dd>
                {commande.note && (
                  <>
                    <dt>Note</dt>
                    <dd>{commande.note}</dd>
                  </>
                )}
              </dl>
              {lignes.length > 0 && (
                <table className="xa-commandes-table" style={{ marginTop: '1rem' }}>
                  <thead>
                    <tr>
                      <th>Produit</th>
                      <th>Qté</th>
                      <th>Prix unit.</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lignes.map((l) => (
                      <tr key={l.id}>
                        <td>{l.produit_emoji} {l.produit_nom}</td>
                        <td>{l.quantite} {l.unite ?? ''}</td>
                        <td>{l.prix_unitaire.toLocaleString('fr-FR')} FCFA</td>
                        <td>{l.total_ligne.toLocaleString('fr-FR')} FCFA</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
