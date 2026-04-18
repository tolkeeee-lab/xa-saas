'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { getPendingSales, removeSale } from '@/lib/offline/offlineQueue';

type UseOfflineSyncOptions = {
  onSyncResult?: (succeeded: number, failed: number) => void;
};

type UseOfflineSyncResult = {
  isOnline: boolean;
  pendingCount: number;
  syncing: boolean;
  syncNow: () => Promise<void>;
};

export function useOfflineSync({
  onSyncResult,
}: UseOfflineSyncOptions = {}): UseOfflineSyncResult {
  // SSR guard — default to true so server render doesn't show the offline banner
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof window !== 'undefined' ? window.navigator.onLine : true,
  );
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  // Stable ref for the callback so it doesn't trigger unnecessary effects
  const onSyncResultRef = useRef(onSyncResult);
  useEffect(() => {
    onSyncResultRef.current = onSyncResult;
  }, [onSyncResult]);

  // Refresh pending count
  const refreshCount = useCallback(async () => {
    if (typeof window === 'undefined') return;
    try {
      const sales = await getPendingSales();
      setPendingCount(sales.length);
    } catch {
      // IndexedDB unavailable (e.g. private browsing on some browsers)
    }
  }, []);

  // Sync all pending sales
  const syncNow = useCallback(async () => {
    if (typeof window === 'undefined') return;
    setSyncing(true);
    let succeeded = 0;
    let failed = 0;

    try {
      const sales = await getPendingSales();
      for (const sale of sales) {
        try {
          const res = await fetch('/api/transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              boutique_id: sale.boutique_id,
              lignes: sale.lignes,
              mode_paiement: sale.mode_paiement,
              montant_total: sale.montant_total,
              // Idempotency key: the sale's own UUID prevents duplicate insertions
              // when the network times out but the server already processed the request
              local_id: sale.id,
              ...(sale.client_nom !== undefined && { client_nom: sale.client_nom }),
              ...(sale.client_telephone !== undefined && {
                client_telephone: sale.client_telephone,
              }),
            }),
          });
          if (res.ok) {
            await removeSale(sale.id);
            succeeded++;
          } else {
            failed++;
          }
        } catch {
          failed++;
        }
      }
    } finally {
      setSyncing(false);
      await refreshCount();
      if (onSyncResultRef.current && (succeeded > 0 || failed > 0)) {
        onSyncResultRef.current(succeeded, failed);
      }
    }
  }, [refreshCount]);

  // Listen for online/offline events
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = async () => {
      setIsOnline(true);
      await refreshCount();
      // Auto-sync when coming back online
      const sales = await getPendingSales().catch(() => []);
      if (sales.length > 0) {
        await syncNow();
      }
    };

    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial count
    refreshCount();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [refreshCount, syncNow]);

  // Poll every 5 seconds to keep pendingCount fresh
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const id = setInterval(async () => {
      if (!isOnline) return; // No point polling when offline — sync can't happen
      await refreshCount();
    }, 5000);
    return () => clearInterval(id);
  }, [refreshCount, isOnline]);

  return { isOnline, pendingCount, syncing, syncNow };
}
