'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import type { Boutique, Profile } from '@/types/database';
import { useNotifs } from '@/context/NotifContext';

type SidebarProps = {
  boutiques: Boutique[];
  profile: Profile | null;
  isSuperAdmin?: boolean;
};

const NAV_SECTIONS = [
  {
    label: 'NAVIGATION',
    items: [
      {
        href: '/dashboard',
        label: "Vue d'ensemble",
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
      },
      {
        href: '/dashboard/boutiques',
        label: 'Boutiques',
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>,
      },
      {
        href: '/dashboard/caisse',
        label: 'Caisse POS',
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>,
      },
      {
        href: '/dashboard/transactions',
        label: 'Transactions',
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>,
      },
      {
        href: '/dashboard/cloture-caisse',
        label: 'Clôture caisse',
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
      },
    ],
  },
  {
    label: 'STOCK',
    items: [
      {
        href: '/dashboard/produits',
        label: 'Produits',
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>,
      },
      {
        href: '/dashboard/stocks',
        label: 'Stocks consolidés',
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>,
        alertKey: 'stock' as const,
      },
      {
        href: '/dashboard/alertes-stock',
        label: 'Alertes Stock',
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>,
        alertKey: 'stock' as const,
      },
      {
        href: '/dashboard/transferts',
        label: 'Transferts',
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>,
      },
      {
        href: '/dashboard/perimes',
        label: 'Péremptions',
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
      },
    ],
  },
  {
    label: 'FINANCES',
    items: [
      {
        href: '/dashboard/dettes',
        label: 'Dettes clients',
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z"/></svg>,
      },
      {
        href: '/dashboard/mes-dettes',
        label: 'Mes dettes',
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
      },
      {
        href: '/dashboard/charges',
        label: 'Charges fixes',
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>,
      },
      {
        href: '/dashboard/fournisseurs',
        label: 'Fournisseurs',
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8 7h8m0 0V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 0v10a2 2 0 01-2 2H8a2 2 0 01-2-2V7m2 4h4"/></svg>,
      },
    ],
  },
  {
    label: 'ANALYSE',
    items: [
      {
        href: '/dashboard/rapports',
        label: 'Rapports',
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>,
      },
      {
        href: '/dashboard/comparatif',
        label: 'Comparatif',
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
      },
      {
        href: '/dashboard/clients',
        label: 'Clients fidèles',
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>,
      },
    ],
  },
  {
    label: 'RH',
    items: [
      {
        href: '/dashboard/employes',
        label: 'Employés',
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>,
      },
      {
        href: '/dashboard/personnel',
        label: 'Personnel',
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>,
      },
    ],
  },
];

const BOUTIQUE_COLORS = ['#00C853', '#00B4D8', '#FFB300', '#FF5252', '#7C4DFF', '#FF6D00'];

export default function Sidebar({ boutiques, profile, isSuperAdmin = false }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [activeBoutiqueId, setActiveBoutiqueId] = useState<string>('all');
  const { notifications } = useNotifs();
  const hasStockAlerte = notifications.some((n) => n.type === 'stock');

  useEffect(() => {
    const stored = localStorage.getItem('xa-boutique-active');
    if (stored) setActiveBoutiqueId(stored);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('v-sidebar-collapsed');
    if (stored === 'true') setCollapsed(true);
  }, []);

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('v-sidebar-collapsed', String(next));
  }

  function selectBoutique(id: string) {
    setActiveBoutiqueId(id);
    localStorage.setItem('xa-boutique-active', id);
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  const initials = profile?.nom_complet
    ? profile.nom_complet.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  const W = collapsed ? 58 : 240;

  const sidebarStyle: React.CSSProperties = {
    width: W,
    minWidth: W,
    height: '100vh',
    background: 'var(--xa-surface)',
    borderRight: '1px solid var(--xa-rule2)',
    display: 'flex',
    flexDirection: 'column',
    transition: 'width 0.22s cubic-bezier(.4,0,.2,1), min-width 0.22s cubic-bezier(.4,0,.2,1)',
    overflow: 'hidden',
    flexShrink: 0,
    zIndex: 30,
  };

  return (
    <aside style={sidebarStyle}>

      {/* ── TOP: Wordmark + toggle ── */}
      <div style={{
        padding: collapsed ? '1.25rem 0' : '1.25rem 1rem 1rem',
        borderBottom: '1px solid var(--xa-rule)',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: collapsed ? 'center' : 'flex-start',
        gap: 0,
      }}>
        {/* Wordmark */}
        <Link href="/dashboard" style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          textDecoration: 'none',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          justifyContent: collapsed ? 'center' : 'flex-start',
          width: '100%',
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--xa-accent)" strokeWidth="2.5" strokeLinecap="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9,22 9,12 15,12 15,22"/>
          </svg>
          {!collapsed && (
            <span style={{
              fontFamily: "var(--font-familjen), sans-serif",
              fontSize: 20,
              fontWeight: 900,
              color: 'var(--xa-ink)',
              letterSpacing: '-0.01em',
            }}>
              xà
            </span>
          )}
        </Link>

        {/* Sub-label */}
        {!collapsed && (
          <p style={{
            fontFamily: "var(--font-plex-mono), 'IBM Plex Mono', monospace",
            fontSize: 9,
            letterSpacing: '0.10em',
            color: 'var(--xa-muted)',
            marginTop: 2,
          }}>
            TABLEAU DE BORD
          </p>
        )}

        {/* Toggle button */}
        <button
          onClick={toggleCollapsed}
          style={{
            marginTop: 12,
            width: 28,
            height: 28,
            background: 'var(--xa-bg2)',
            border: '1px solid var(--xa-rule2)',
            borderRadius: 5,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            alignSelf: collapsed ? 'center' : 'flex-start',
          }}
          title={collapsed ? 'Développer' : 'Réduire'}
        >
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="var(--xa-muted)" strokeWidth="2" strokeLinecap="round"
            style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.22s' }}
          >
            <polyline points="15,18 9,12 15,6"/>
          </svg>
        </button>
      </div>

      {/* ── NAV ── */}
      <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '0.75rem 0' }}>

        {NAV_SECTIONS.map((section) => (
          <div key={section.label} style={{ marginBottom: '1.25rem' }}>
            {/* Section label */}
            {!collapsed && (
              <p style={{
                fontFamily: "var(--font-plex-mono), 'IBM Plex Mono', monospace",
                fontSize: 9,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--xa-faint)',
                padding: '0 1rem',
                marginBottom: '0.4rem',
                whiteSpace: 'nowrap',
              }}>
                {section.label}
              </p>
            )}

            {section.items.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== '/dashboard' && pathname.startsWith(item.href));
              const showAlert = 'alertKey' in item && item.alertKey === 'stock' && hasStockAlerte;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: collapsed ? 0 : 10,
                    padding: collapsed ? '9px 0' : '9px 1rem',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    fontSize: 13,
                    color: isActive ? 'var(--xa-accent)' : 'var(--xa-muted)',
                    background: isActive ? 'var(--xa-accentbg)' : 'transparent',
                    borderLeft: `2px solid ${isActive ? 'var(--xa-accent)' : 'transparent'}`,
                    textDecoration: 'none',
                    fontWeight: isActive ? 500 : 400,
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s',
                    position: 'relative',
                  }}
                >
                  <span style={{ flexShrink: 0, width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {item.icon}
                  </span>
                  {!collapsed && (
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.label}
                    </span>
                  )}
                  {showAlert && (
                    <span style={{
                      width: 7, height: 7,
                      borderRadius: '50%',
                      background: 'var(--xa-red)',
                      flexShrink: 0,
                      position: collapsed ? 'absolute' : 'relative',
                      top: collapsed ? 8 : 'auto',
                      right: collapsed ? 8 : 'auto',
                    }} />
                  )}
                </Link>
              );
            })}
          </div>
        ))}

        {/* ── Boutiques pills ── */}
        {!collapsed && boutiques.length > 0 && (
          <div style={{ marginBottom: '1.25rem' }}>
            <p style={{
              fontFamily: "var(--font-plex-mono), 'IBM Plex Mono', monospace",
              fontSize: 9,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--xa-faint)',
              padding: '0 1rem',
              marginBottom: '0.4rem',
            }}>
              BOUTIQUES
            </p>
            <div style={{ padding: '0 0.75rem', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {/* Toutes */}
              <button
                onClick={() => selectBoutique('all')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '6px 8px', borderRadius: 6,
                  fontSize: 12, cursor: 'pointer', border: '1px solid transparent',
                  background: activeBoutiqueId === 'all' ? 'var(--xa-accentbg)' : 'transparent',
                  color: activeBoutiqueId === 'all' ? 'var(--xa-ink)' : 'var(--xa-muted)',
                  textAlign: 'left', width: '100%', transition: 'all 0.15s',
                  fontFamily: "var(--font-familjen), system-ui, sans-serif",
                }}
              >
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--xa-accent)', flexShrink: 0 }} />
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Toutes</span>
              </button>

              {boutiques.map((b, i) => (
                <button
                  key={b.id}
                  onClick={() => selectBoutique(b.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    padding: '6px 8px', borderRadius: 6,
                    fontSize: 12, cursor: 'pointer',
                    border: activeBoutiqueId === b.id ? '1px solid var(--xa-rule2)' : '1px solid transparent',
                    background: activeBoutiqueId === b.id ? 'var(--xa-accentbg)' : 'transparent',
                    color: activeBoutiqueId === b.id ? 'var(--xa-ink)' : 'var(--xa-muted)',
                    textAlign: 'left', width: '100%', transition: 'all 0.15s',
                    fontFamily: "var(--font-familjen), system-ui, sans-serif",
                  }}
                >
                  <span style={{
                    width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                    background: b.couleur_theme ?? BOUTIQUE_COLORS[i % BOUTIQUE_COLORS.length],
                  }} />
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {b.nom}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Super Admin ── */}
        {isSuperAdmin && (
          <div style={{ padding: '0 0.5rem', marginTop: 4 }}>
            {!collapsed && (
              <div style={{ height: 1, background: 'var(--xa-rule2)', marginBottom: 8 }} />
            )}
            <Link
              href="/admin"
              title={collapsed ? '⚡ Super Admin' : undefined}
              style={{
                display: 'flex', alignItems: 'center',
                gap: collapsed ? 0 : 10,
                padding: collapsed ? '9px 0' : '9px 0.75rem',
                justifyContent: collapsed ? 'center' : 'flex-start',
                borderRadius: 5,
                fontSize: 13, fontWeight: 600,
                background: 'rgba(124, 77, 255, 0.10)',
                color: '#7C4DFF',
                textDecoration: 'none',
                transition: 'all 0.15s',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
              {!collapsed && <span>⚡ Super Admin</span>}
            </Link>
          </div>
        )}
      </nav>

      {/* ── BOTTOM: avatar + logout ── */}
      <div style={{
        padding: collapsed ? '0.875rem 0' : '0.875rem 1rem',
        borderTop: '1px solid var(--xa-rule)',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        gap: collapsed ? 0 : 10,
        justifyContent: collapsed ? 'center' : 'flex-start',
        overflow: 'hidden',
      }}>
        {/* Avatar */}
        <div style={{
          width: 32, height: 32, borderRadius: 6,
          background: 'var(--xa-accent)', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700, flexShrink: 0,
          fontFamily: "var(--font-plex-mono), 'IBM Plex Mono', monospace",
          letterSpacing: '0.04em',
          cursor: 'pointer',
        }}
          title={collapsed ? (profile?.nom_complet ?? 'Propriétaire') : undefined}
        >
          {initials}
        </div>

        {/* Name + role + logout */}
        {!collapsed && (
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontSize: 12.5, fontWeight: 500,
              color: 'var(--xa-ink)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {profile?.nom_complet ?? 'Propriétaire'}
            </p>
            <p style={{
              fontSize: 10,
              color: 'var(--xa-muted)',
              fontFamily: "var(--font-plex-mono), 'IBM Plex Mono', monospace",
            }}>
              PROPRIÉTAIRE
            </p>
          </div>
        )}

        {!collapsed && (
          <button
            onClick={handleLogout}
            title="Déconnexion"
            style={{
              width: 28, height: 28, borderRadius: 5,
              background: 'var(--xa-bg2)',
              border: '1px solid var(--xa-rule2)',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--xa-red)" strokeWidth="2" strokeLinecap="round">
              <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
          </button>
        )}
      </div>
    </aside>
  );
}