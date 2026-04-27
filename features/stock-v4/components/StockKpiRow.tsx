'use client';

import type { StockKpis } from '../types';

interface StockKpiRowProps {
  kpis: StockKpis;
  loading?: boolean;
}

export default function StockKpiRow({ kpis, loading }: StockKpiRowProps) {
  if (loading) {
    return (
      <div className="v4-kpi-row">
        {[1, 2, 3].map((i) => (
          <div key={i} className="v4-kpi-card v4-skeleton" style={{ height: 60 }} />
        ))}
      </div>
    );
  }

  return (
    <div className="v4-kpi-row">
      <div className="v4-kpi-card ok">
        <span className="v4-kpi-label">Total stock</span>
        <span className="v4-kpi-value">{kpis.total}</span>
      </div>
      <div className={`v4-kpi-card${kpis.faibles > 0 ? ' warn' : ' ok'}`}>
        <span className="v4-kpi-label">Faibles</span>
        <span className="v4-kpi-value">{kpis.faibles}</span>
      </div>
      <div className={`v4-kpi-card${kpis.ruptures > 0 ? ' danger' : ' ok'}`}>
        <span className="v4-kpi-label">Ruptures</span>
        <span className="v4-kpi-value">{kpis.ruptures}</span>
      </div>
    </div>
  );
}
