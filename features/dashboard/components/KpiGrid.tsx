'use client';

import { ShoppingCart, TrendingUp, TrendingDown, Users, AlertTriangle, Package, Clock } from 'lucide-react';
import { formatFCFA } from '@/lib/format';
import type { DashboardKpis } from '@/app/api/dashboard/home/route';

type KpiCardDef = {
  id: keyof DashboardKpis;
  label: string;
  icon: React.ComponentType<{ size: number }>;
  color: 'green' | 'amber' | 'red' | 'blue' | 'purple';
  format: 'currency' | 'number';
  href: string;
  showTrend?: boolean;
};

const CARDS: KpiCardDef[] = [
  { id: 'ca_jour', label: 'CA aujourd\'hui', icon: TrendingUp, color: 'green', format: 'currency', href: '/dashboard/ventes', showTrend: true },
  { id: 'nb_ventes', label: 'Ventes', icon: ShoppingCart, color: 'blue', format: 'number', href: '/dashboard/transactions' },
  { id: 'panier_moyen', label: 'Panier moyen', icon: Users, color: 'purple', format: 'currency', href: '/dashboard/ventes' },
  { id: 'dettes_total', label: 'Dettes clients', icon: Clock, color: 'amber', format: 'currency', href: '/dashboard/dettes' },
  { id: 'stock_bas_count', label: 'Stock bas', icon: Package, color: 'red', format: 'number', href: '/dashboard/stock' },
  { id: 'b2b_attente', label: 'B2B en attente', icon: AlertTriangle, color: 'amber', format: 'number', href: '/dashboard/b2b' },
];

type Props = {
  kpis: DashboardKpis;
};

export default function KpiGrid({ kpis }: Props) {
  return (
    <div className="xa-home-kpi-grid">
      {CARDS.map((card) => {
        const raw = kpis[card.id] as number;
        const displayValue = card.format === 'currency' ? formatFCFA(raw) : raw.toLocaleString('fr-FR');
        const Icon = card.icon;

        return (
          <a key={card.id} href={card.href} className={`xa-home-kpi-card xa-home-kpi-card--${card.color}`}>
            <div className="xa-home-kpi-card__top">
              <span className="xa-home-kpi-card__label">{card.label}</span>
              <span className={`xa-home-kpi-card__icon-wrap xa-home-kpi-card__icon-wrap--${card.color}`}>
                <Icon size={16} />
              </span>
            </div>
            <div className="xa-home-kpi-card__value">{displayValue}</div>
            {card.showTrend && (
              <div className={`xa-home-kpi-card__trend ${kpis.ca_jour_trend >= 0 ? 'xa-home-kpi-card__trend--up' : 'xa-home-kpi-card__trend--down'}`}>
                {kpis.ca_jour_trend >= 0
                  ? <TrendingUp size={12} />
                  : <TrendingDown size={12} />}
                <span>{kpis.ca_jour_trend >= 0 ? '+' : ''}{kpis.ca_jour_trend}% vs hier</span>
              </div>
            )}
          </a>
        );
      })}
    </div>
  );
}
