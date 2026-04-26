'use client';

import Link from 'next/link';
import { ShoppingCart, Plus, Package, ClipboardCheck } from 'lucide-react';

type QuickAction = {
  label: string;
  href: string;
  icon: React.ComponentType<{ size: number }>;
  color: 'green' | 'blue' | 'amber' | 'purple';
};

const ACTIONS: QuickAction[] = [
  { label: 'Nouvelle vente', href: '/caisse', icon: ShoppingCart, color: 'green' },
  { label: 'Ajouter charge', href: '/dashboard/charges', icon: Plus, color: 'blue' },
  { label: 'Voir stock', href: '/dashboard/stock', icon: Package, color: 'amber' },
  { label: 'Clôture du jour', href: '/dashboard/cloture', icon: ClipboardCheck, color: 'purple' },
];

export default function QuickActions() {
  return (
    <div className="xa-home-section">
      <h2 className="xa-home-section-title">Accès rapide</h2>
      <div className="xa-home-quick-actions">
        {ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className={`xa-home-quick-btn xa-home-quick-btn--${action.color}`}
            >
              <span className={`xa-home-quick-btn__icon xa-home-quick-btn__icon--${action.color}`}>
                <Icon size={24} />
              </span>
              <span className="xa-home-quick-btn__label">{action.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
