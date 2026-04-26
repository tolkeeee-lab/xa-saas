'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
  Truck,
  Package,
  Store,
  BarChart3,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/admin-mafro', label: "Vue d'ensemble", icon: LayoutDashboard, exact: true },
  { href: '/admin-mafro/commandes', label: 'Commandes B2B', icon: ShoppingCart, exact: false },
  { href: '/admin-mafro/livraisons', label: 'Livraisons', icon: Truck, exact: false },
  { href: '/admin-mafro/stock', label: 'Stock Central', icon: Package, exact: false },
  { href: '/admin-mafro/partenaires', label: 'Partenaires', icon: Store, exact: false },
  { href: '/admin-mafro/stats', label: 'Statistiques', icon: BarChart3, exact: false },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="xa-admin-sidebar">
      <div className="xa-admin-sidebar__brand">
        <span className="xa-admin-sidebar__logo">M</span>
        <div>
          <div className="xa-admin-sidebar__brand-name">MAFRO Admin</div>
          <div className="xa-admin-sidebar__brand-tag">Back-office</div>
        </div>
      </div>

      <nav className="xa-admin-sidebar__nav">
        {NAV_ITEMS.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`xa-admin-sidebar__link${isActive ? ' xa-admin-sidebar__link--active' : ''}`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
