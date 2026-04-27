'use client';

import { Eye, Bell, Clock, ClipboardList, ArrowLeftRight, Trash2, MessageSquarePlus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { STOCK_TABS } from '../types';
import type { StockTabId } from '../types';

interface StockTabBarProps {
  active: StockTabId;
  onChange: (id: StockTabId) => void;
  alerteBadge?: number;
  perimeBadge?: number;
  demandesBadge?: number;
}

const TAB_ICONS: Record<StockTabId, LucideIcon> = {
  vue: Eye,
  alertes: Bell,
  perimes: Clock,
  inventaires: ClipboardList,
  transferts: ArrowLeftRight,
  pertes: Trash2,
  demandes: MessageSquarePlus,
};

export default function StockTabBar({ active, onChange, alerteBadge, perimeBadge, demandesBadge }: StockTabBarProps) {
  return (
    <div className="v4-tab-bar" role="tablist" aria-label="Sections stock">
      {STOCK_TABS.map((tab) => {
        const Icon = TAB_ICONS[tab.id];
        const badge =
          tab.id === 'alertes' ? (alerteBadge ?? 0)
          : tab.id === 'perimes' ? (perimeBadge ?? 0)
          : tab.id === 'demandes' ? (demandesBadge ?? 0)
          : 0;
        const badgeClass =
          tab.id === 'alertes' ? 'v4-tab-badge v4-tab-badge--red'
          : 'v4-tab-badge v4-tab-badge--amber'; // perimes + demandes both use amber

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={tab.id === active}
            className={`v4-tab-btn${tab.id === active ? ' active' : ''}`}
            onClick={() => onChange(tab.id)}
          >
            <Icon size={12} style={{ flexShrink: 0 }} />
            {tab.label}
            {badge > 0 && (
              <span className={badgeClass}>{badge}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
