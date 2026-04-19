'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { useNotifs } from '@/context/NotifContext';

type TopBarProps = {
  userInitials: string;
  unreadCount?: number;
};

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/dashboard/activite', label: 'Activité' },
  { href: '/dashboard/ventes', label: 'Ventes' },
  { href: '/dashboard/inventaire', label: 'Inventaire' },
  { href: '/dashboard/personnel', label: 'Personnel' },
];

export default function TopBar({ userInitials, unreadCount = 0 }: TopBarProps) {
  const pathname = usePathname();
  const { notifications } = useNotifs();
  const totalUnread = unreadCount + notifications.length;

  function isActive(href: string): boolean {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  }

  return (
    <header className="xa-topbar">
      {/* Wordmark */}
      <Link href="/dashboard" className="xa-wordmark" style={{ textDecoration: 'none' }}>
        x<em>à</em>
        <span className="xa-wm-pill">LIVE</span>
      </Link>

      {/* Main Nav */}
      <nav className="xa-topbar-nav">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`xa-tnav${isActive(item.href) ? ' xa-tnav-active' : ''}`}
            style={{ textDecoration: 'none' }}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Right side */}
      <div className="xa-topbar-right">
        <ThemeToggle />

        {/* Notification button */}
        <div className="xa-tb-btn" role="button" tabIndex={0} aria-label="Notifications">
          🔔
          {totalUnread > 0 && <div className="xa-ndot" />}
        </div>

        {/* Avatar */}
        <div className="xa-tb-avatar" title="Mon compte">
          {userInitials}
        </div>
      </div>
    </header>
  );
}
