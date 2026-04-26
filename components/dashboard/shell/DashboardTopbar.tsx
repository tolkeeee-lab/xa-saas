'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings } from 'lucide-react';
import ThemeToggle from '@/components/ui/ThemeToggle';

// ── Types ──────────────────────────────────────────────────────────────────────

type NavItemDef = {
  href: string;
  label: string;
};

type NavDropdownDef = {
  label: string;
  items: NavItemDef[];
};

// ── Nav structure ─────────────────────────────────────────────────────────────

const NAV_DROPDOWN_GROUPS: NavDropdownDef[] = [
  {
    label: '🛒 Ventes',
    items: [
      { href: '/dashboard/caisse', label: 'Caisse' },
      { href: '/dashboard/ventes', label: 'Ventes' },
      { href: '/dashboard/clients', label: 'Clients' },
      { href: '/dashboard/dettes', label: 'Dettes clients' },
      { href: '/dashboard/cloture-caisse', label: 'Clôture caisse' },
    ],
  },
  {
    label: '📦 Stocks',
    items: [
      { href: '/dashboard/stock', label: 'Stock local' },
      { href: '/dashboard/produits', label: 'Produits' },
      { href: '/dashboard/inventaire', label: 'Inventaire' },
      { href: '/dashboard/stocks', label: 'Stocks consolidés' },
      { href: '/dashboard/alertes-stock', label: 'Alertes stock' },
      { href: '/dashboard/perimes', label: 'Produits périmés' },
      { href: '/dashboard/fournisseurs', label: 'Fournisseurs' },
      { href: '/dashboard/transferts', label: 'Transferts' },
      { href: '/dashboard/b2b', label: 'Commander MAFRO' },
    ],
  },
  {
    label: '💰 Finances',
    items: [
      { href: '/dashboard/charges', label: 'Charges' },
      { href: '/dashboard/mes-dettes', label: 'Mes dettes fournisseurs' },
      { href: '/dashboard/rapports', label: 'Rapports' },
      { href: '/dashboard/comparatif', label: 'Comparatif boutiques' },
      { href: '/dashboard/activite', label: 'Activité' },
    ],
  },
];

// ── NavDropdown ───────────────────────────────────────────────────────────────

function NavDropdown({ group, onNavigate }: { group: NavDropdownDef; onNavigate?: () => void }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const isGroupActive = group.items.some((item) => pathname.startsWith(item.href));

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Close on ESC
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  // Arrow-key navigation
  function handleButtonKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setTimeout(() => {
        const first = menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]');
        first?.focus();
      }, 0);
    }
  }

  function handleItemKeyDown(e: React.KeyboardEvent<HTMLAnchorElement>, index: number) {
    const items = menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]');
    if (!items) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      items[Math.min(index + 1, items.length - 1)]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (index === 0) setOpen(false);
      else items[index - 1]?.focus();
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div className="xa-nav-dropdown" ref={ref}>
      <button
        className={`xa-nav-btn${isGroupActive ? ' xa-nav-active' : ''}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={handleButtonKeyDown}
        type="button"
      >
        {group.label}
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          aria-hidden
          style={{ marginLeft: 2, opacity: 0.5, transform: open ? 'rotate(180deg)' : undefined, transition: 'transform .15s' }}
        >
          <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div className="xa-nav-menu" role="menu" ref={menuRef}>
          {group.items.map((item, idx) => (
            <Link
              key={item.href}
              href={item.href}
              role="menuitem"
              tabIndex={0}
              className={`xa-nav-item${pathname === item.href || pathname.startsWith(item.href + '/') ? ' xa-nav-item-active' : ''}`}
              onClick={() => {
                setOpen(false);
                onNavigate?.();
              }}
              onKeyDown={(e) => handleItemKeyDown(e, idx)}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Mobile drawer ─────────────────────────────────────────────────────────────

function MobileDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  // Close drawer on navigation
  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  // Focus trap + ESC
  const drawerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="xa-nav-drawer" role="dialog" aria-modal="true" ref={drawerRef}>
      <Link
        href="/dashboard"
        className={`xa-nav-link${pathname === '/dashboard' ? ' xa-nav-active' : ''}`}
        onClick={onClose}
      >
        🏠 Accueil
      </Link>

      {NAV_DROPDOWN_GROUPS.map((group) => {
        const isExpanded = expandedGroup === group.label;
        return (
          <div key={group.label}>
            <button
              className="xa-nav-btn"
              style={{ width: '100%', justifyContent: 'space-between' }}
              onClick={() => setExpandedGroup(isExpanded ? null : group.label)}
              type="button"
            >
              {group.label}
              <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden style={{ transform: isExpanded ? 'rotate(180deg)' : undefined, transition: 'transform .15s' }}>
                <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              </svg>
            </button>
            {isExpanded && (
              <div style={{ paddingLeft: '1rem', display: 'flex', flexDirection: 'column', gap: '.15rem' }}>
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`xa-nav-item${pathname === item.href || pathname.startsWith(item.href + '/') ? ' xa-nav-item-active' : ''}`}
                    onClick={onClose}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      })}

      <Link
        href="/dashboard/equipe"
        className={`xa-nav-link${pathname.startsWith('/dashboard/equipe') ? ' xa-nav-active' : ''}`}
        onClick={onClose}
      >
        👥 Équipe
      </Link>

      <Link
        href="/dashboard/boutiques"
        className={`xa-nav-link${pathname.startsWith('/dashboard/boutiques') ? ' xa-nav-active' : ''}`}
        onClick={onClose}
      >
        📍 Boutiques
      </Link>

      <Link
        href="/dashboard/settings"
        className={`xa-nav-link${pathname.startsWith('/dashboard/settings') ? ' xa-nav-active' : ''}`}
        onClick={onClose}
      >
        ⚙️ Paramètres
      </Link>
    </div>
  );
}

// ── DashboardTopbar ───────────────────────────────────────────────────────────

type DashboardTopbarProps = {
  userInitials: string;
};

export default function DashboardTopbar({ userInitials }: DashboardTopbarProps) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  return (
    <>
      <header className="xa-topbar-sticky">
        <div className="xa-topbar-inner">
          {/* LEFT : logo + brand */}
          <Link href="/dashboard" className="xa-brand" style={{ textDecoration: 'none' }}>
            x<em>à</em>
          </Link>

          {/* CENTER : nav menu (desktop) */}
          <nav className="xa-nav" aria-label="Navigation principale">
            <Link
              href="/dashboard"
              className={`xa-nav-link${pathname === '/dashboard' ? ' xa-nav-active' : ''}`}
            >
              🏠 Accueil
            </Link>

            {NAV_DROPDOWN_GROUPS.map((group) => (
              <NavDropdown key={group.label} group={group} />
            ))}

            <Link
              href="/dashboard/equipe"
              className={`xa-nav-link${pathname.startsWith('/dashboard/equipe') ? ' xa-nav-active' : ''}`}
            >
              👥 Équipe
            </Link>

            <Link
              href="/dashboard/boutiques"
              className={`xa-nav-link${pathname.startsWith('/dashboard/boutiques') ? ' xa-nav-active' : ''}`}
            >
              📍 Boutiques
            </Link>
          </nav>

          {/* RIGHT : settings + avatar + theme + hamburger */}
          <div className="xa-topbar-right">
            <ThemeToggle />

            <Link
              href="/dashboard/settings"
              className={`xa-topbar-icon${pathname.startsWith('/dashboard/settings') ? ' xa-nav-active' : ''}`}
              aria-label="Paramètres"
              title="Paramètres"
            >
              <Settings size={18} />
            </Link>

            <div className="xa-tb-avatar" title="Mon compte">
              {userInitials}
            </div>

            {/* Hamburger — mobile only */}
            <button
              type="button"
              className="xa-nav-mobile-btn xa-tb-btn"
              aria-label={drawerOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              aria-expanded={drawerOpen}
              onClick={() => setDrawerOpen((v) => !v)}
            >
              {drawerOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <MobileDrawer open={drawerOpen} onClose={closeDrawer} />
    </>
  );
}
