'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import type { Boutique } from '@/types/database';
import ThemeToggle from '@/components/ui/ThemeToggle';

function formatDateFR(date: Date): string {
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

type Props = {
  prenom: string;
  boutiques: Pick<Boutique, 'id' | 'nom' | 'couleur_theme'>[];
  boutique_id: string | null;
  synced?: boolean;
};

export default function DashboardHeader({ prenom, boutiques, boutique_id, synced = true }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const today = new Date();

  function handleBoutiqueChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    if (val === 'all') {
      params.delete('boutique_id');
    } else {
      params.set('boutique_id', val);
    }
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="xa-home-header">
      <div className="xa-home-header__top">
        <div className="xa-home-header__greet">
          <h1 className="xa-home-header__title">
            Bonjour {prenom} 👋
          </h1>
          <p className="xa-home-header__date">{formatDateFR(today)}</p>
        </div>
        <div className="xa-home-header__right">
          <div className={`xa-home-header__sync ${synced ? 'xa-home-header__sync--ok' : 'xa-home-header__sync--pending'}`}>
            <span className="xa-home-header__sync-dot" />
            <span className="xa-home-header__sync-label">{synced ? 'Synchronisé' : 'Hors ligne'}</span>
          </div>
          <ThemeToggle />
        </div>
      </div>

      {boutiques.length > 1 && (
        <div className="xa-home-header__store-select">
          <label htmlFor="boutique-select" className="xa-home-header__store-label">
            Boutique :
          </label>
          <select
            id="boutique-select"
            className="xa-home-header__store-dropdown"
            value={boutique_id ?? 'all'}
            onChange={handleBoutiqueChange}
          >
            <option value="all">Toutes les boutiques</option>
            {boutiques.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nom}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
