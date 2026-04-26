'use client';

import { useState } from 'react';
import { X, CheckCircle, XCircle } from 'lucide-react';
import { formatDateTime } from '@/lib/format';
import type { TransfertStock, Boutique } from '@/types/database';
import BoutiqueSwapDisplay from '@/features/transferts/components/BoutiqueSwapDisplay';

type TransfertStatut = TransfertStock['statut'];

const STATUT_CONFIG: Record<TransfertStatut, { label: string; classes: string }> = {
  en_attente: { label: 'En attente', classes: 'bg-amber-100 text-amber-700 border-amber-200' },
  recu: { label: 'Reçu', classes: 'bg-green-100 text-green-700 border-green-200' },
  annule: { label: 'Annulé', classes: 'bg-gray-100 text-gray-500 border-gray-200' },
};

type Props = {
  transfert: TransfertStock;
  boutiques: Boutique[];
  produitNom?: string;
  canReceive: boolean;
  canCancel: boolean;
  onClose: () => void;
  onRecevoir: () => void;
  onRefresh: () => void;
};

export default function TransfertDetailModal({
  transfert,
  boutiques,
  produitNom,
  canReceive,
  canCancel,
  onClose,
  onRecevoir,
  onRefresh,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const statut = STATUT_CONFIG[transfert.statut];
  const sourceBoutique = boutiques.find((b) => b.id === transfert.boutique_source_id);
  const destBoutique = boutiques.find((b) => b.id === transfert.boutique_destination_id);

  async function handleAnnuler() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/transferts/${transfert.id}/annuler`, { method: 'POST' });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? 'Erreur serveur');
      onRefresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inattendue');
    } finally {
      setLoading(false);
      setConfirmCancel(false);
    }
  }

  return (
    <div className="xa-modal-backdrop">
      <div className="xa-modal-box">
        <div className="xa-modal-body">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="font-bold text-xa-text text-lg">{produitNom ?? 'Transfert'}</h2>
              <div className="mt-1">
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full border ${statut.classes}`}
                >
                  {statut.label}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-xa-muted hover:text-xa-text p-1 flex-shrink-0"
              aria-label="Fermer"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {/* Transfer route */}
            {sourceBoutique && destBoutique && (
              <div className="p-3 rounded-xl border border-xa-border bg-xa-bg">
                <BoutiqueSwapDisplay source={sourceBoutique} destination={destBoutique} />
              </div>
            )}

            {/* Details */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-sm">
                <span className="text-xa-muted">Quantité</span>
                <span className="font-semibold text-xa-text">
                  {transfert.quantite} unité{transfert.quantite > 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-xa-muted">Date envoi</span>
                <span className="text-xa-text">{formatDateTime(transfert.created_at)}</span>
              </div>
              {transfert.received_at && (
                <div className="flex justify-between text-sm">
                  <span className="text-xa-muted">Date réception</span>
                  <span className="text-xa-text">{formatDateTime(transfert.received_at)}</span>
                </div>
              )}
            </div>

            {error && (
              <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl p-3">
                {error}
              </p>
            )}

            {/* Actions */}
            {transfert.statut === 'en_attente' && (
              <div className="flex flex-col gap-2">
                {canReceive && (
                  <button
                    type="button"
                    onClick={onRecevoir}
                    className="w-full bg-green-600 text-white font-semibold rounded-xl py-3 text-sm flex items-center justify-center gap-2 min-h-[44px]"
                  >
                    <CheckCircle size={18} />
                    Recevoir le transfert
                  </button>
                )}
                {canCancel && !confirmCancel && (
                  <button
                    type="button"
                    onClick={() => setConfirmCancel(true)}
                    className="w-full border border-red-200 text-red-600 rounded-xl py-3 text-sm flex items-center justify-center gap-2 min-h-[44px]"
                  >
                    <XCircle size={16} />
                    Annuler le transfert
                  </button>
                )}
                {canCancel && confirmCancel && (
                  <div className="flex flex-col gap-2">
                    <p className="text-sm text-xa-muted text-center">
                      Confirmer l&apos;annulation ? Le stock sera restauré.
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setConfirmCancel(false)}
                        className="flex-1 border border-xa-border text-xa-muted rounded-xl py-2 text-sm min-h-[44px]"
                      >
                        Non
                      </button>
                      <button
                        type="button"
                        onClick={() => { void handleAnnuler(); }}
                        disabled={loading}
                        className="flex-1 bg-red-600 text-white rounded-xl py-2 text-sm font-semibold disabled:opacity-50 min-h-[44px]"
                      >
                        {loading ? 'Annulation…' : 'Confirmer'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
