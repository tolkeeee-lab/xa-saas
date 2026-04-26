'use client';

import type { RetraitClient } from '@/types/database';

type Props = {
  retrait: RetraitClient;
  onClick: () => void;
};

const STATUT_CONFIG: Record<
  RetraitClient['statut'],
  { label: string; textClass: string; bgClass: string }
> = {
  en_attente: { label: 'En attente', textClass: 'text-amber-700', bgClass: 'bg-amber-100' },
  retire: { label: 'Retiré', textClass: 'text-green-700', bgClass: 'bg-green-100' },
  expire: { label: 'Expiré', textClass: 'text-gray-500', bgClass: 'bg-gray-100' },
  annule: { label: 'Annulé', textClass: 'text-red-600', bgClass: 'bg-red-100' },
};

function formatRelative(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours}h`;
  return `il y a ${Math.floor(hours / 24)}j`;
}

function formatCountdown(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return 'Expiré';
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) return `Expire dans ${hours}h ${mins}min`;
  return `Expire dans ${mins}min`;
}

export default function RetraitCard({ retrait, onClick }: Props) {
  const config = STATUT_CONFIG[retrait.statut];

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      className="bg-xa-surface border border-xa-border rounded-2xl p-4 cursor-pointer hover:border-xa-primary transition-colors"
    >
      <div className="flex items-center justify-between mb-1">
        <span className="font-medium text-xa-text text-sm">#{retrait.numero}</span>
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${config.bgClass} ${config.textClass}`}
        >
          {config.label}
        </span>
      </div>

      <div className="flex flex-col gap-0.5 mb-2">
        <span className="text-xa-text font-semibold text-sm">{retrait.client_nom}</span>
        <span className="text-xa-muted text-xs">{retrait.client_telephone}</span>
      </div>

      <div className="flex items-center justify-between">
        <span className="font-bold text-xa-text">
          {retrait.total.toLocaleString('fr-FR')} FCFA
        </span>
        <span className="text-xa-muted text-xs">
          {retrait.statut === 'en_attente'
            ? formatCountdown(retrait.expires_at)
            : retrait.statut === 'retire' && retrait.retired_at
              ? formatRelative(retrait.retired_at)
              : null}
        </span>
      </div>
    </div>
  );
}
