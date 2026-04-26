'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { CommandeB2B, CommandeB2BLigne, Livraison } from '@/types/database';

type Props = {
  commandeId: string;
  onClose: () => void;
};

type CommandeDetail = {
  commande: CommandeB2B;
  lignes: CommandeB2BLigne[];
  livraison: Livraison | null;
};

const STATUT_B2B: Record<CommandeB2B['statut'], { label: string; bg: string }> = {
  soumise: { label: 'Soumise', bg: 'var(--xa-muted)' },
  confirmee: { label: 'Confirmée', bg: 'var(--xa-blue)' },
  preparee: { label: 'Préparée', bg: 'var(--xa-amber)' },
  en_route: { label: 'En route', bg: 'var(--xa-purple)' },
  livree: { label: 'Livrée', bg: 'var(--xa-green)' },
  annulee: { label: 'Annulée', bg: 'var(--xa-red)' },
};

const STATUT_LIV: Record<Livraison['statut'], { label: string; bg: string }> = {
  preparation: { label: 'Préparation', bg: 'var(--xa-muted)' },
  en_route: { label: 'En route', bg: 'var(--xa-blue)' },
  livree: { label: 'Livrée', bg: 'var(--xa-green)' },
  retournee: { label: 'Retournée', bg: 'var(--xa-red)' },
};

const MODE_LABELS: Record<CommandeB2B['mode_paiement'], string> = {
  a_la_livraison: 'À la livraison',
  momo: 'MoMo',
  virement: 'Virement',
};

const PAIEMENT_LABELS: Record<CommandeB2B['paiement_status'], string> = {
  en_attente: 'En attente',
  paye: 'Payé',
};

function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function CommandeDetailModal({ commandeId, onClose }: Props) {
  const [detail, setDetail] = useState<CommandeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/b2b/commandes/${commandeId}`);
        const data = (await res.json()) as CommandeDetail & { error?: string };
        if (!res.ok) {
          setError(data.error ?? 'Erreur');
          return;
        }
        setDetail(data);
      } catch {
        setError('Erreur réseau');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [commandeId]);

  return (
    <div className="xa-modal-backdrop">
      <div className="xa-modal-box">
        <div className="xa-modal-header">
          <h2 className="font-bold text-xa-text">Détail de la commande</h2>
          <button
            type="button"
            className="xa-modal-close"
            onClick={onClose}
            aria-label="Fermer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="xa-modal-body flex flex-col gap-4">
          {loading && (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="animate-pulse bg-xa-surface rounded-xl h-8" />
              ))}
            </div>
          )}

          {error && <p className="text-red-500 text-sm">{error}</p>}

          {detail && (
            <>
              {/* Header info */}
              <div className="flex items-center justify-between">
                <span className="font-bold text-xa-text">{detail.commande.numero}</span>
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: STATUT_B2B[detail.commande.statut].bg, color: '#fff' }}
                >
                  {STATUT_B2B[detail.commande.statut].label}
                </span>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-xa-muted text-xs">Créée le</p>
                  <p className="text-xa-text">{fmtDate(detail.commande.created_at)}</p>
                </div>
                {detail.commande.confirmed_at && (
                  <div>
                    <p className="text-xa-muted text-xs">Confirmée le</p>
                    <p className="text-xa-text">{fmtDate(detail.commande.confirmed_at)}</p>
                  </div>
                )}
                {detail.commande.livraison_prevue_at && (
                  <div>
                    <p className="text-xa-muted text-xs">Livraison prévue</p>
                    <p className="text-xa-text">{fmtDate(detail.commande.livraison_prevue_at)}</p>
                  </div>
                )}
                {detail.commande.livree_at && (
                  <div>
                    <p className="text-xa-muted text-xs">Livrée le</p>
                    <p className="text-xa-text">{fmtDate(detail.commande.livree_at)}</p>
                  </div>
                )}
              </div>

              {/* Lignes */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xa-muted border-b border-xa-border">
                      <th className="text-left py-1 font-normal">Produit</th>
                      <th className="text-right py-1 font-normal">Qté</th>
                      <th className="text-right py-1 font-normal">P.U.</th>
                      <th className="text-right py-1 font-normal">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.lignes.map((l) => (
                      <tr key={l.id} className="border-b border-xa-border">
                        <td className="py-1 text-xa-text">
                          {l.produit_emoji} {l.produit_nom}
                        </td>
                        <td className="py-1 text-right text-xa-text">{l.quantite}</td>
                        <td className="py-1 text-right text-xa-muted">
                          {l.prix_unitaire.toLocaleString('fr-FR')}
                        </td>
                        <td className="py-1 text-right font-medium text-xa-text">
                          {l.total_ligne.toLocaleString('fr-FR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="flex flex-col gap-1 text-sm">
                <div className="flex justify-between text-xa-muted">
                  <span>Sous-total</span>
                  <span>{detail.commande.sous_total.toLocaleString('fr-FR')} FCFA</span>
                </div>
                <div className="flex justify-between text-xa-muted">
                  <span>Frais livraison</span>
                  <span>{detail.commande.frais_livraison.toLocaleString('fr-FR')} FCFA</span>
                </div>
                <div className="flex justify-between font-bold text-xa-text border-t border-xa-border pt-1">
                  <span>Total</span>
                  <span>{detail.commande.total.toLocaleString('fr-FR')} FCFA</span>
                </div>
              </div>

              {/* Paiement */}
              <div className="flex gap-4 text-sm">
                <div>
                  <p className="text-xa-muted text-xs">Mode de paiement</p>
                  <p className="text-xa-text">{MODE_LABELS[detail.commande.mode_paiement]}</p>
                </div>
                <div>
                  <p className="text-xa-muted text-xs">Statut paiement</p>
                  <p className="text-xa-text">{PAIEMENT_LABELS[detail.commande.paiement_status]}</p>
                </div>
              </div>

              {/* Livraison */}
              {detail.livraison && (
                <div className="border border-xa-border rounded-xl p-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-xa-text text-sm">
                      Livraison {detail.livraison.numero}
                    </span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        background: STATUT_LIV[detail.livraison.statut].bg,
                        color: '#fff',
                      }}
                    >
                      {STATUT_LIV[detail.livraison.statut].label}
                    </span>
                  </div>
                  {detail.livraison.chauffeur && (
                    <p className="text-sm text-xa-muted">
                      Chauffeur:{' '}
                      <span className="text-xa-text">{detail.livraison.chauffeur}</span>
                    </p>
                  )}
                  {detail.livraison.vehicule && (
                    <p className="text-sm text-xa-muted">
                      Véhicule:{' '}
                      <span className="text-xa-text">{detail.livraison.vehicule}</span>
                    </p>
                  )}
                  {detail.livraison.parti_at && (
                    <p className="text-sm text-xa-muted">
                      Parti le:{' '}
                      <span className="text-xa-text">
                        {fmtDate(detail.livraison.parti_at)}
                      </span>
                    </p>
                  )}
                  {detail.livraison.livre_at && (
                    <p className="text-sm text-xa-muted">
                      Livré le:{' '}
                      <span className="text-xa-text">
                        {fmtDate(detail.livraison.livre_at)}
                      </span>
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
