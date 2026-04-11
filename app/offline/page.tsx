'use client';

import { useEffect, useState } from 'react';
import { syncPendingTransactions } from '@/lib/offlineSync';
import Button from '@/components/ui/Button';

export default function OfflinePage() {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<{ synced: number; errors: number } | null>(null);
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, []);

  async function handleSync() {
    setSyncing(true);
    setResult(null);
    const r = await syncPendingTransactions();
    setResult(r);
    setSyncing(false);
  }

  return (
    <main className="min-h-screen bg-xa-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="text-6xl mb-4">{isOnline ? '🟢' : '📡'}</div>
        <h1 className="text-2xl font-bold text-xa-primary mb-2">
          {isOnline ? 'Connexion rétablie' : 'Hors ligne'}
        </h1>
        <p className="text-gray-500 mb-6">
          {isOnline
            ? 'Vous êtes connecté. Synchronisez vos ventes en attente.'
            : 'Vos ventes sont sauvegardées localement et seront synchronisées dès que la connexion sera rétablie.'}
        </p>

        {result && (
          <div className="bg-white rounded-2xl shadow-sm p-4 mb-4 text-sm">
            <p className="text-green-700">✅ {result.synced} vente(s) synchronisée(s)</p>
            {result.errors > 0 && <p className="text-xa-danger">⚠ {result.errors} erreur(s)</p>}
          </div>
        )}

        <div className="space-y-3">
          {isOnline && (
            <Button onClick={handleSync} className="w-full" loading={syncing}>
              Synchroniser maintenant
            </Button>
          )}
          <a href="/caisse" className="block w-full bg-white rounded-2xl shadow-sm px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            Retour à la caisse
          </a>
          <a href="/dashboard" className="block text-sm text-gray-400 hover:text-xa-primary">
            Tableau de bord
          </a>
        </div>
      </div>
    </main>
  );
}
