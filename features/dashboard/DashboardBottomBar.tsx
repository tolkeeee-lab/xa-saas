'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  ShoppingCart,
  Receipt,
  Users,
  Clock,
  Lock,
  Package,
  Tag,
  ClipboardList,
  BarChart3,
  Bell,
  CalendarX,
  Truck,
  ArrowLeftRight,
  Building2,
  PackageCheck,
  ArrowDownLeft,
  TrendingDown,
  Wallet,
  CreditCard,
  FileBarChart,
  Scale,
  Activity,
  UserSquare,
  Store,
  Settings,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard',                  icon: Home,           label: 'Accueil'       },
  { href: '/dashboard/caisse',           icon: ShoppingCart,   label: 'Caisse'        },
  { href: '/dashboard/ventes',           icon: Receipt,        label: 'Ventes'        },
  { href: '/dashboard/clients',          icon: Users,          label: 'Clients'       },
  { href: '/dashboard/dettes',           icon: Clock,          label: 'Dettes'        },
  { href: '/dashboard/cloture',          icon: Lock,           label: 'Clôture'       },
  { href: '/dashboard/stock',            icon: Package,        label: 'Stock local'   },
  { href: '/dashboard/produits',         icon: Tag,            label: 'Produits'      },
  { href: '/dashboard/inventaire',       icon: ClipboardList,  label: 'Inventaire'    },
  { href: '/dashboard/stocks',           icon: BarChart3,      label: 'Stocks'        },
  { href: '/dashboard/alertes-stock',    icon: Bell,           label: 'Alertes'       },
  { href: '/dashboard/perimes',          icon: CalendarX,      label: 'Périmés'       },
  { href: '/dashboard/fournisseurs',     icon: Truck,          label: 'Fournisseurs'  },
  { href: '/dashboard/transferts',       icon: ArrowLeftRight, label: 'Transferts'    },
  { href: '/dashboard/b2b',              icon: Building2,      label: 'B2B'           },
  { href: '/dashboard/livraisons',       icon: PackageCheck,   label: 'Livraisons'    },
  { href: '/dashboard/retraits',         icon: ArrowDownLeft,  label: 'Retraits'      },
  { href: '/dashboard/pertes',           icon: TrendingDown,   label: 'Pertes'        },
  { href: '/dashboard/charges',          icon: Wallet,         label: 'Charges'       },
  { href: '/dashboard/mes-dettes',       icon: CreditCard,     label: 'Mes dettes'    },
  { href: '/dashboard/rapports',         icon: FileBarChart,   label: 'Rapports'      },
  { href: '/dashboard/comparatif',       icon: Scale,          label: 'Comparatif'    },
  { href: '/dashboard/activite',         icon: Activity,       label: 'Activité'      },
  { href: '/dashboard/equipe',           icon: UserSquare,     label: 'Équipe'        },
  { href: '/dashboard/boutiques',        icon: Store,          label: 'Boutiques'     },
  { href: '/dashboard/settings',         icon: Settings,       label: 'Paramètres'    },
];

export default function DashboardBottomBar() {
  const pathname = usePathname();

  return (
    <nav className="xa-bottom-bar" aria-label="Navigation principale">
      <div className="xa-bottom-bar-scroll">
        <div className="xa-bottom-bar-inner">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`xa-bottom-bar-item${isActive ? ' xa-bottom-bar-item--active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.75} aria-hidden />
                <span className="xa-bottom-bar-label">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
