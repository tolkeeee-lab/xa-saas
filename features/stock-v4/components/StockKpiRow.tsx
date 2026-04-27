'use client';

import { Package, AlertTriangle, DollarSign } from 'lucide-react';
import type { StockKpis } from '../types';

interface StockKpiRowProps {
  kpis: StockKpis;
  loading?: boolean;
}

function formatValeur(v: number): string {
  if (v >= 1_000_000) return `${Math.round(v / 1_000_000)}M`;
  if (v >= 1_000) return `${Math.round(v / 1_000)}k`;
  return String(Math.round(v));
}

export default function StockKpiRow({ kpis, loading }: StockKpiRowProps) {
  if (loading) {
    return (
      <div className="v4-kpi-row">
        {[1, 2, 3].map((i) => (
          <div key={i} className="v4-kpi-card v4-skeleton" style={{ height: 68 }} />
        ))}
      </div>
    );
  }

  return (
    <div className="v4-kpi-row">
      <div className="v4-kpi-card v4-kpi-card--green">
        <Package size={14} className="v4-kpi-icon" />
        <span className="v4-kpi-value">{kpis.produits}</span>
        <span className="v4-kpi-label">PRODUITS</span>
      </div>
      <div className="v4-kpi-card v4-kpi-card--amber">
        <AlertTriangle size={14} className="v4-kpi-icon" />
        <span className="v4-kpi-value">{kpis.alertes}</span>
        <span className="v4-kpi-label">ALERTES</span>
      </div>
      <div className="v4-kpi-card v4-kpi-card--purple">
        <DollarSign size={14} className="v4-kpi-icon" />
        <span className="v4-kpi-value">{formatValeur(kpis.valeurStock)}</span>
        <span className="v4-kpi-label">VALEUR STOCK</span>
      </div>
    </div>
  );
}
