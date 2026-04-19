'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback } from 'react';
import type { EmployeSession } from '@/lib/employe-session';
import { EMPLOYE_STORAGE_KEY } from '@/lib/employe-session';

type EmployeTopbarProps = {
  session: EmployeSession;
};

type NavItem = {
  href: string;
  label: string;
  gerantOnly?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { href: '/caisse', label: '🛒 Caisse' },
  { href: '/stock', label: '📦 Stock' },
  { href: '/ventes', label: '📜 Ventes' },
  { href: '/dettes', label: '💸 Dettes' },
  { href: '/clients', label: '👥 Clients' },
  { href: '/cloture', label: '🔒 Clôture' },
  { href: '/inventaire', label: '📋 Inventaire', gerantOnly: true },
];

const ROLE_LABELS: Record<string, string> = {
  caissier: 'CAISSIER',
  vendeur: 'VENDEUR',
  gerant: 'GÉRANT',
};

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  caissier: { bg: 'rgba(0,200,83,.15)', text: '#00a048' },
  vendeur: { bg: 'rgba(139,92,246,.15)', text: '#7c3aed' },
  gerant: { bg: 'rgba(59,130,246,.15)', text: '#1d4ed8' },
};

export default function EmployeTopbar({ session }: EmployeTopbarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = useCallback(async () => {
    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem(EMPLOYE_STORAGE_KEY);
    }
    // Clear cookie via API
    await fetch('/api/employe/session', { method: 'DELETE' });
    router.push('/caisse/lock');
    router.refresh();
  }, [router]);

  const roleColor = ROLE_COLORS[session.role] ?? ROLE_COLORS['caissier'];
  const visibleNav = NAV_ITEMS.filter(
    (item) => !item.gerantOnly || session.role === 'gerant',
  );

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        height: 52,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '0 16px',
        background: 'var(--c-surface, #fff)',
        borderBottom: '1px solid var(--c-rule2, #e5e7eb)',
        boxShadow: '0 1px 3px rgba(0,0,0,.06)',
      }}
    >
      {/* Wordmark + boutique */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <span
          style={{
            fontFamily: '"Black Han Sans", sans-serif',
            fontSize: 20,
            letterSpacing: '-0.02em',
            color: 'var(--c-ink, #0a120a)',
          }}
        >
          x<em style={{ fontStyle: 'normal', color: 'var(--c-accent, #00c853)' }}>à</em>
        </span>
        <span
          style={{
            padding: '2px 8px',
            borderRadius: 999,
            background: 'rgba(0,200,83,.12)',
            color: '#00a048',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 11,
            fontWeight: 600,
            whiteSpace: 'nowrap',
            maxWidth: 100,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {session.boutique_nom}
        </span>
      </div>

      {/* Nav */}
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          flex: 1,
          justifyContent: 'center',
          overflowX: 'auto',
        }}
      >
        {visibleNav.map((item) => {
          const isActive =
            item.href === '/caisse'
              ? pathname === '/caisse' || pathname.startsWith('/caisse/')
              : pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '5px 10px',
                borderRadius: 8,
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 12,
                fontWeight: isActive ? 700 : 500,
                color: isActive ? 'var(--c-accent, #00c853)' : 'var(--c-muted, #6b7280)',
                background: isActive ? 'rgba(0,200,83,.08)' : 'transparent',
                border: `1px solid ${isActive ? 'rgba(0,200,83,.25)' : 'transparent'}`,
                whiteSpace: 'nowrap',
                textDecoration: 'none',
                transition: 'all .15s',
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Right: employee pill + logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {/* Role pill */}
        <span
          style={{
            padding: '2px 8px',
            borderRadius: 999,
            background: roleColor.bg,
            color: roleColor.text,
            fontFamily: 'Space Mono, monospace',
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.05em',
          }}
        >
          {ROLE_LABELS[session.role] ?? session.role.toUpperCase()}
        </span>

        {/* Employee name pill */}
        <span
          style={{
            padding: '4px 10px',
            borderRadius: 999,
            border: '1px solid var(--c-rule2, #e5e7eb)',
            background: 'var(--c-bg, #f9fafb)',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--c-ink, #0a120a)',
            whiteSpace: 'nowrap',
            maxWidth: 120,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {session.employe_nom}
        </span>

        {/* Logout button */}
        <button
          type="button"
          onClick={() => void handleLogout()}
          title="Déconnexion"
          aria-label="Se déconnecter"
          style={{
            background: 'transparent',
            border: '1px solid var(--c-rule2, #e5e7eb)',
            borderRadius: 6,
            padding: '5px 8px',
            cursor: 'pointer',
            fontSize: 14,
            color: 'var(--c-muted, #6b7280)',
            transition: 'all .15s',
            lineHeight: 1,
          }}
        >
          ⏏
        </button>
      </div>
    </header>
  );
}
