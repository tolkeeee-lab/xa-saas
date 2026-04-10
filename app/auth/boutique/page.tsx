'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import type { Boutique } from '../../../types/database';

export const dynamic = 'force-dynamic';

export default function BoutiquePage() {
  const router = useRouter();
  const [boutiques, setBoutiques] = useState<Boutique[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from('boutiques')
      .select('*')
      .eq('actif', true)
      .order('nom')
      .then(({ data, error: err }) => {
        if (err) setError(err.message);
        else setBoutiques(data ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <main className="min-h-screen bg-xa-bg flex flex-col items-center justify-center p-6">
      <h1 className="text-3xl font-bold text-xa-primary mb-2">xà</h1>
      <p className="text-gray-500 mb-8 text-sm">Sélectionnez votre boutique</p>

      {loading && <p className="text-gray-400 text-sm">Chargement...</p>}
      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="w-full max-w-sm space-y-3">
        {boutiques.map((b) => (
          <button
            key={b.id}
            onClick={() => router.push(`/auth/pin?boutique_id=${b.id}`)}
            className="w-full bg-white rounded-2xl shadow p-4 text-left hover:ring-2 hover:ring-xa-primary transition"
          >
            <p className="font-semibold text-gray-800">{b.nom}</p>
            {b.ville && <p className="text-sm text-gray-400">{b.ville}</p>}
          </button>
        ))}
      </div>
    </main>
  );
}
