'use client';

import { STOCK_TABS } from '../types';
import type { StockTabId } from '../types';

interface StockTabBarProps {
  active: StockTabId;
  onChange: (id: StockTabId) => void;
  alerteBadge?: number;
}

export default function StockTabBar({ active, onChange, alerteBadge }: StockTabBarProps) {
  return (
    <div className="v4-tab-bar" role="tablist" aria-label="Sections stock">
      {STOCK_TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={tab.id === active}
          className={`v4-tab-btn${tab.id === active ? ' active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
          {tab.id === 'alertes' && alerteBadge != null && alerteBadge > 0 && (
            <span className="v4-tab-badge">{alerteBadge}</span>
          )}
        </button>
      ))}
    </div>
  );
}
