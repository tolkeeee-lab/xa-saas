'use client';

import { formatDateTime } from '@/lib/format';
import type { TransfertStock, Boutique } from '@/types/database';
import BoutiqueSwapDisplay from './BoutiqueSwapDisplay';

type TransfertStatut = TransfertStock['statut'];

const STATUT_CONFIG: Record<TransfertStatut, { label: string; classes: string }> = {
  en_attente: { label: 'En attente', classes: 'bg-amber-100 text-amber-700 border-amber-200' },
  recu: { label: 'Reçu', classes: 'bg-green-100 text-green-700 border-green-200' },
  annule: { label: 'Annulé', classes: 'bg-gray-100 text-gray-500 border-gray-200' },
};

const CATEGORIE_EMOJI: Record<string, string> = {
  alimentation: '🛒',
  boissons: '🥤',
  hygiene: '🧴',
  electronique: '📱',
  vetements: '👕',
  autre: '📦',
};

type Props = {
  transfert: TransfertStock;
  boutiques: Boutique[];
  produitNom?: string;
  produitCategorie?: string;
  onClick: () => void;
};

export default function TransfertCard({
  transfert,
  boutiques,
  produitNom,
  produitCategorie,
  onClick,
}: Props) {
  const statut = STATUT_CONFIG[transfert.statut];
  const sourceBoutique = boutiques.find((b) => b.id === transfert.boutique_source_id);
  const destBoutique = boutiques.find((b) => b.id === transfert.boutique_destination_id);
  const emoji = CATEGORIE_EMOJI[produitCategorie ?? 'autre'] ?? '📦';

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left bg-xa-surface border border-xa-border rounded-2xl p-4 flex gap-3 active:scale-[.98] transition-transform"
    >
      {/* Emoji */}
      <div className="w-12 h-12 flex-shrink-0 rounded-xl bg-xa-bg border border-xa-border flex items-center justify-center text-xl">
        {emoji}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <span className="font-semibold text-xa-text text-sm leading-tight truncate">
            {produitNom ?? 'Produit'}
          </span>
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full border flex-shrink-0 ${statut.classes}`}
          >
            {statut.label}
          </span>
        </div>

        {sourceBoutique && destBoutique && (
          <BoutiqueSwapDisplay source={sourceBoutique} destination={destBoutique} />
        )}

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-xa-text">
            {transfert.quantite} unité{transfert.quantite > 1 ? 's' : ''}
          </span>
        </div>

        <div className="text-xs text-xa-muted">
          Envoyé le {formatDateTime(transfert.created_at)}
          {transfert.received_at && (
            <span> · Reçu le {formatDateTime(transfert.received_at)}</span>
          )}
        </div>
      </div>
    </button>
  );
}
