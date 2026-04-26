'use client';

import { useState } from 'react';
import { X, CheckCircle } from 'lucide-react';
import type { TransfertStock, Boutique } from '@/types/database';
import BoutiqueSwapDisplay from '@/features/transferts/components/BoutiqueSwapDisplay';

type Props = {
  transfert: TransfertStock;
  boutiques: Boutique[];
  produitNom?: string;
  onClose: () => void;
  onSuccess: () => void;
};

export default function RecevoirTransfertModal({
  transfert,
  boutiques,
  produitNom,
  onClose,
  onSuccess,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sourceBoutique = boutiques.find((b) => b.id === transfert.boutique_source_id);
  const destBoutique = boutiques.find((b) => b.id === transfert.boutique_destination_id);

  async function handleRecevoir() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/transferts/${transfert.id}/recevoir`, { method: 'POST' });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? 'Erreur serveur');
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inattendue');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="xa-modal-backdrop">
      <div className="xa-modal-box">
        <div className="xa-modal-body">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-xa-text text-lg">Confirmer la réception</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-xa-muted hover:text-xa-text p-1"
              aria-label="Fermer"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {/* Transfer summary */}
            <div className="p-4 rounded-xl border border-xa-border bg-xa-bg flex flex-col gap-3">
              {sourceBoutique && destBoutique && (
                <BoutiqueSwapDisplay source={sourceBoutique} destination={destBoutique} />
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-xa-text font-medium">
                  {produitNom ?? 'Produit'}
                </span>
                <span className="text-sm font-bold text-xa-text">
                  {transfert.quantite} unité{transfert.quantite > 1 ? 's' : ''}
                </span>
              </div>
            </div>

            <p className="text-sm text-xa-muted text-center">
              Confirmer la réception de ce transfert ajoutera{' '}
              <span className="font-semibold text-xa-text">
                {transfert.quantite} unité{transfert.quantite > 1 ? 's' : ''}
              </span>{' '}
              au stock de {destBoutique?.nom ?? 'la boutique destination'}.
            </p>

            {error && (
              <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl p-3">
                {error}
              </p>
            )}

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => { void handleRecevoir(); }}
                disabled={loading}
                className="w-full bg-green-600 text-white font-semibold rounded-xl py-3 text-sm disabled:opacity-50 flex items-center justify-center gap-2 min-h-[44px]"
              >
                <CheckCircle size={18} />
                {loading ? 'Traitement…' : 'Confirmer la réception'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full border border-xa-border text-xa-muted rounded-xl py-3 text-sm min-h-[44px]"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
