'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Boutique, ProduitPublic } from '@/types/database';
import CaissePos from '@/components/dashboard/CaissePos';

type CaissierSession = {
  employe_id: string;
  boutique_id: string;
  employe_nom: string;
  boutique_nom: string;
};

export default function CaissePosPage() {
  const router = useRouter();
  const [session, setSession] = useState<CaissierSession | null>(null);
  const [boutique, setBoutique] = useState<Boutique | null>(null);
  const [produits, setProduits] = useState<ProduitPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem('xa-caissier');
    if (!raw) {
      router.push('/caisse');
      return;
    }

    let sess: CaissierSession;
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      if (
        typeof parsed.employe_id !== 'string' ||
        typeof parsed.boutique_id !== 'string' ||
        typeof parsed.employe_nom !== 'string' ||
        typeof parsed.boutique_nom !== 'string'
      ) {
        sessionStorage.removeItem('xa-caissier');
        router.push('/caisse');
        return;
      }
      sess = parsed as unknown as CaissierSession;
    } catch {
      router.push('/caisse');
      return;
    }
    setSession(sess);

    // Load boutique and products in parallel
    Promise.all([
      fetch(`/api/caisse/boutique-details?id=${sess.boutique_id}`).then((r) => {
        if (!r.ok) throw new Error('Boutique introuvable');
        return r.json() as Promise<Boutique>;
      }),
      fetch(`/api/produits?boutique_id=${sess.boutique_id}`).then((r) => {
        if (!r.ok) throw new Error('Erreur chargement produits');
        return r.json() as Promise<ProduitPublic[]>;
      }),
    ])
      .then(([b, p]) => {
        setBoutique(b);
        setProduits(p);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Erreur inattendue');
      })
      .finally(() => setLoading(false));
  }, [router]);

  function handleLogout() {
    sessionStorage.removeItem('xa-caissier');
    router.push('/caisse');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-xa-bg flex items-center justify-center">
        <span className="inline-block w-8 h-8 border-2 border-xa-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !boutique || !session) {
    return (
      <div className="min-h-screen bg-xa-bg flex items-center justify-center px-4">
        <div className="bg-xa-surface border border-xa-border rounded-2xl p-8 text-center max-w-sm">
          <p className="text-xa-danger mb-4">{error ?? 'Session invalide'}</p>
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-xl bg-xa-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Retour à l&apos;accueil caisse
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-xa-bg flex flex-col">
      {/* Minimal header */}
      <header className="h-12 px-4 flex items-center justify-between border-b border-xa-border bg-xa-surface shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-xa-text">{boutique.nom}</span>
          <span className="text-xs text-xa-muted hidden sm:block">
            Caissier : {session.employe_nom}
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="text-xs text-xa-muted hover:text-xa-danger transition-colors px-3 py-1.5 rounded-lg border border-xa-border hover:border-xa-danger"
        >
          Déconnexion
        </button>
      </header>

      {/* POS interface */}
      <div className="flex-1 overflow-hidden">
        <CaissePos
          boutiques={[boutique]}
          produits={produits}
          userId={session.employe_id}
        />
      </div>
    </div>
  );
}
