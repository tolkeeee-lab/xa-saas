'use client';

import { useDashboardFilter } from '@/context/DashboardFilterContext';
import type { BoutiqueSummary } from '@/lib/supabase/dashboard/hero';
import { formatFCFA } from '@/lib/format';

const CHIP_COLORS = ['var(--xa-accent)', 'var(--xa-blue)', 'var(--xa-purple)', 'var(--xa-amber)'];

const STATUS_COLOR: Record<string, string> = {
  ACTIF: 'var(--xa-green)',
  ALERTE: 'var(--xa-amber)',
  OFFLINE: 'var(--xa-faint)',
};

type Props = {
  boutique: BoutiqueSummary;
  index: number;
};

export default function BoutiqueListItem({ boutique, index }: Props) {
  const { activeStoreId, setStoreFilter } = useDashboardFilter();
  const isActive = activeStoreId === boutique.id;
  const chipColor = boutique.couleur_theme !== 'var(--xa-accent)'
    ? boutique.couleur_theme
    : CHIP_COLORS[index % CHIP_COLORS.length];

  return (
    <div
      className={`xa-bl-item${isActive ? ' xa-bl-item-active' : ''}`}
      role="button"
      tabIndex={0}
      aria-pressed={isActive}
      onClick={() => setStoreFilter(isActive ? 'all' : boutique.id)}
      onKeyDown={(e) => e.key === 'Enter' && setStoreFilter(isActive ? 'all' : boutique.id)}
    >
      <div className="xa-bl-row">
        <div className="xa-bl-chip" style={{ background: chipColor }} />
        <span className="xa-bl-name">{boutique.nom}</span>
        <span className="xa-bl-ca">{boutique.ca_today > 0 ? formatFCFA(boutique.ca_today) : '—'}</span>
      </div>
      <div className="xa-bl-meta">
        <span className="xa-bl-status" style={{ color: STATUS_COLOR[boutique.statut] }}>
          {boutique.statut}
        </span>
        <span className="xa-bl-score">{boutique.health_score}/100</span>
      </div>
    </div>
  );
}
