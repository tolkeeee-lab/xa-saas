'use client';

import { useOfflineSync } from '@/hooks/useOfflineSync';

export default function OfflineBanner() {
  const { isOnline, pendingCount, syncing } = useOfflineSync();

  if (isOnline && !syncing) return null;

  if (!isOnline) {
    return (
      <div
        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white shrink-0"
        style={{ background: '#ff3341' }}
      >
        <span>📵</span>
        <span>
          Mode hors-ligne
          {pendingCount > 0 && ` — ${pendingCount} vente${pendingCount !== 1 ? 's' : ''} en attente`}
        </span>
      </div>
    );
  }

  // isOnline && syncing
  return (
    <div
      className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white shrink-0"
      style={{ background: '#4d9fff' }}
    >
      <span>⏳</span>
      <span>Synchronisation en cours…</span>
    </div>
  );
}
