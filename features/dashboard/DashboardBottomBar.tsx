'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import {
  Home,
  ShoppingCart,
  Package,
  TrendingUp,
  Wallet,
  BarChart3,
  MoreHorizontal,
} from 'lucide-react';

type MatchType = 'exact' | 'prefix' | 'group';

type NavItem = {
  href: string;
  icon: LucideIcon;
  label: string;
  match: MatchType;
  groupRoutes?: string[];
};

const NAV_ITEMS: NavItem[] = [
  {
    href: '/dashboard',
    icon: Home,
    label: 'Accueil',
    match: 'exact',
  },
  {
    href: '/dashboard/caisse',
    icon: ShoppingCart,
    label: 'Caisse',
    match: 'prefix',
  },
  {
    href: '/dashboard/stock',
    icon: Package,
    label: 'Stock',
    match: 'group',
    groupRoutes: [
      '/dashboard/stock',
      '/dashboard/stocks',
      '/dashboard/transferts',
      '/dashboard/perimes',
      '/dashboard/pertes',
      '/dashboard/inventaire',
      '/dashboard/produits',
      '/dashboard/alertes-stock',
    ],
  },
  {
    href: '/dashboard/ventes',
    icon: TrendingUp,
    label: 'Ventes',
    match: 'group',
    groupRoutes: [
      '/dashboard/ventes',
      '/dashboard/activite',
      '/dashboard/b2b',
      '/dashboard/livraisons',
      '/dashboard/dettes',
    ],
  },
  {
    href: '/dashboard/finances',
    icon: Wallet,
    label: 'Finances',
    match: 'group',
    groupRoutes: [
      '/dashboard/finances',
      '/dashboard/charges',
      '/dashboard/mes-dettes',
      '/dashboard/retraits',
      '/dashboard/cloture',
    ],
  },
  {
    href: '/dashboard/rapports',
    icon: BarChart3,
    label: 'Rapports',
    match: 'group',
    groupRoutes: [
      '/dashboard/rapports',
      '/dashboard/comparatif',
    ],
  },
  {
    href: '/dashboard/plus',
    icon: MoreHorizontal,
    label: 'Plus',
    match: 'group',
    groupRoutes: [
      '/dashboard/plus',
      '/dashboard/equipe',
      '/dashboard/boutiques',
      '/dashboard/clients',
      '/dashboard/fournisseurs',
      '/dashboard/settings',
    ],
  },
];

function checkActive(
  href: string,
  pathname: string,
  match: MatchType,
  groupRoutes?: string[],
): boolean {
  if (match === 'exact') return pathname === href;
  if (match === 'prefix') return pathname === href || pathname.startsWith(href + '/');
  if (match === 'group') {
    return (
      groupRoutes?.some((r) => pathname === r || pathname.startsWith(r + '/')) ?? false
    );
  }
  return false;
}

export default function DashboardBottomBar() {
  const pathname = usePathname();

  return (
    <nav className="xa-bottom-bar" aria-label="Navigation principale">
      <div className="xa-bottom-bar-inner">
        {NAV_ITEMS.map((item) => {
          const active = checkActive(item.href, pathname, item.match, item.groupRoutes);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`xa-bottom-bar-item${active ? ' xa-bottom-bar-item--active' : ''}`}
              aria-current={active ? 'page' : undefined}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.75} aria-hidden />
              <span className="xa-bottom-bar-label">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
