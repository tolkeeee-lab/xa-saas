'use client';

import type { Livraison } from '@/types/database';
import RetardBadge from '@/features/livraisons/components/RetardBadge';

type Props = {
  livraison: Livraison;
  onClick: () => void;
};

const STATUT_CONFIG: Record<
  Livraison['statut'],
  { label: string; classes: string }
> = {
  preparation: {
    label: 'Préparation',
    classes: 'bg-amber-100 text-amber-700 border-amber-200',
  },
  en_route: {
    label: 'En route',
    classes: 'bg-violet-100 text-violet-700 border-violet-200',
  },
  livree: {
    label: 'Livrée',
    classes: 'bg-green-100 text-green-700 border-green-200',
  },
  retournee: {
    label: 'Retournée',
    classes: 'bg-red-100 text-red-700 border-red-200',
  },
};

function getETA(partiAt: string | null): string | null {
  if (!partiAt) return null;
  const eta = new Date(new Date(partiAt).getTime() + 2 * 60 * 60 * 1000);
  return eta.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function getLastPingLabel(lastPing: string | null): string | null {
  if (!lastPing) return null;
  const diffMs = Date.now() - new Date(lastPing).getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return 'Position MAJ il y a moins de 1 min';
  if (diffMin < 60) return `Position MAJ il y a ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  return `Position MAJ il y a ${diffH}h`;
}

export default function LivraisonCard({ livraison, onClick }: Props) {
  const config = STATUT_CONFIG[livraison.statut];
  const eta = livraison.statut === 'en_route' ? getETA(livraison.parti_at) : null;
  const lastPingLabel = livraison.statut === 'en_route' ? getLastPingLabel(livraison.last_ping) : null;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      className="xa-livraison-card bg-xa-surface border border-xa-border rounded-2xl p-4 cursor-pointer hover:border-xa-primary transition-colors"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <span className="font-semibold text-xa-text text-sm">{livraison.numero}</span>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full border ${config.classes}`}
            >
              {config.label}
            </span>
            <RetardBadge partiAt={livraison.parti_at} statut={livraison.statut} />
          </div>
        </div>
        {eta && (
          <div className="text-right flex-shrink-0">
            <span className="text-xs text-xa-muted block">ETA</span>
            <span className="text-sm font-semibold text-xa-text">{eta}</span>
          </div>
        )}
      </div>

      {(livraison.chauffeur || livraison.vehicule) && (
        <div className="flex items-center gap-2 text-xs text-xa-muted mt-1">
          <span>🚗</span>
          <span>
            {[livraison.chauffeur, livraison.vehicule].filter(Boolean).join(' · ')}
          </span>
        </div>
      )}

      {lastPingLabel && (
        <p className="text-xs text-xa-muted mt-1">{lastPingLabel}</p>
      )}
    </div>
  );
}
