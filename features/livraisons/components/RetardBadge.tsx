'use client';

import { useEffect, useState } from 'react';

type Props = {
  partiAt: string | null;
  statut: 'preparation' | 'en_route' | 'livree' | 'retournee';
};

const DELAY_MS = 2 * 60 * 60 * 1000; // 2 hours

function isRetard(partiAt: string | null): boolean {
  if (!partiAt) return false;
  return Date.now() - new Date(partiAt).getTime() > DELAY_MS;
}

export default function RetardBadge({ partiAt, statut }: Props) {
  const [retard, setRetard] = useState(false);

  useEffect(() => {
    if (statut !== 'en_route') return;
    setRetard(isRetard(partiAt));
    const interval = setInterval(() => {
      setRetard(isRetard(partiAt));
    }, 60_000);
    return () => clearInterval(interval);
  }, [partiAt, statut]);

  if (!retard || statut !== 'en_route') return null;

  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200 animate-pulse">
      ⚠️ Retard
    </span>
  );
}
