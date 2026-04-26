import type { Livraison } from '@/types/database';

export const STATUT_CONFIG: Record<
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

const DELAY_ETA_MS = 2 * 60 * 60 * 1000; // standard 2h delivery delay

/**
 * Compute ETA (HH:mm) from parti_at + 2h delay.
 * Returns null if parti_at is absent.
 */
export function getETA(partiAt: string | null): string | null {
  if (!partiAt) return null;
  const eta = new Date(new Date(partiAt).getTime() + DELAY_ETA_MS);
  return eta.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Returns a human-readable label indicating how long ago the position was last updated.
 * Falls back to "Jamais mise à jour" when lastPing is null.
 */
export function getLastPingLabel(lastPing: string | null): string {
  if (!lastPing) return 'Jamais mise à jour';
  const diffMs = Date.now() - new Date(lastPing).getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return 'Position MAJ il y a moins de 1 min';
  if (diffMin < 60) return `Position MAJ il y a ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  return `Position MAJ il y a ${diffH}h`;
}

export const RETARD_DELAY_MS = DELAY_ETA_MS;
