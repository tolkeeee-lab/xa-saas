'use client';

import { useDashboardFilter } from '@/context/DashboardFilterContext';
import type { Boutique } from '@/types/database';

const TYPE_FILTERS = [
  { id: 'all', label: 'Tout' },
  { id: 'ventes', label: 'Ventes' },
  { id: 'alertes', label: 'Alertes' },
  { id: 'stocks', label: 'Stocks' },
  { id: 'personnel', label: 'Personnel' },
  { id: 'objectifs', label: 'Objectifs' },
];

type FilterBarProps = {
  boutiques: Boutique[];
};

export default function FilterBar({ boutiques }: FilterBarProps) {
  const { activeStoreId, activeType, setStoreFilter, setTypeFilter, clearFilters } = useDashboardFilter();

  const hasActiveFilter = activeStoreId !== 'all' || activeType !== 'all';

  return (
    <div className="xa-filter-bar">
      {/* Boutique label */}
      <span className="xa-fb-label">Boutique</span>

      {/* Boutique chips */}
      <div className="xa-filter-group">
        <button
          className={`xa-fchip${activeStoreId === 'all' ? ' xa-fchip-active' : ''}`}
          onClick={() => setStoreFilter('all')}
        >
          Toutes
        </button>
        {boutiques.map((b) => (
          <button
            key={b.id}
            className={`xa-fchip${activeStoreId === b.id ? ' xa-fchip-active' : ''}`}
            onClick={() => setStoreFilter(b.id)}
          >
            {b.nom}
          </button>
        ))}
      </div>

      <div className="xa-fb-sep" />

      {/* Type label */}
      <span className="xa-fb-label">Type</span>

      {/* Type chips */}
      <div className="xa-filter-group">
        {TYPE_FILTERS.map((f) => (
          <button
            key={f.id}
            className={`xa-fchip${activeType === f.id ? ' xa-fchip-active' : ''}`}
            onClick={() => setTypeFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Clear filters */}
      {hasActiveFilter && (
        <button className="xa-fchip" onClick={clearFilters} style={{ opacity: 0.75 }}>
          ↻ Effacer
        </button>
      )}

      {/* Live pill */}
      <div className="xa-live-pill">TEMPS RÉEL</div>
    </div>
  );
}
