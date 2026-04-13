'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import ThemeToggle from '@/components/ui/ThemeToggle';
import InstallPwaButton from '@/components/dashboard/InstallPwaButton';
import type { AppNotification } from '@/lib/supabase/getNotifications';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': "Vue d'ensemble",
  '/dashboard/boutiques': 'Boutiques',
  '/dashboard/boutiques/new': 'Nouvelle boutique',
  '/dashboard/produits': 'Produits',
  '/dashboard/employes': 'Employés',
  '/dashboard/parametres': 'Paramètres',
  '/dashboard/caisse': 'Caisse POS',
  '/dashboard/cloture-caisse': 'Clôture de caisse',
  '/dashboard/stocks': 'Stocks consolidés',
  '/dashboard/transferts': 'Transferts',
  '/dashboard/perimes': 'Péremptions',
  '/dashboard/comparatif': 'Comparatif boutiques',
  '/dashboard/dettes': 'Dettes clients',
  '/dashboard/fournisseurs': 'Fournisseurs',
  '/dashboard/rapports': 'Rapports',
  '/dashboard/charges': 'Charges fixes',
  '/dashboard/personnel': 'Personnel',
  '/dashboard/alertes-stock': 'Alertes Stock',
  '/dashboard/transactions': 'Transactions',
  '/dashboard/mes-dettes': 'Mes dettes',
};

function getPageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (pathname.startsWith('/dashboard/boutiques/')) return 'Boutique';
  return 'Dashboard';
}

export default function Topbar() {
  const pathname = usePathname();
  const [time, setTime] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    function updateTime() {
      setTime(
        new Date().toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
      );
    }
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    if (notifOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [notifOpen]);

  useEffect(() => {
    async function fetchNotifs() {
      try {
        const res = await fetch('/api/notifications');
        const data = (await res.json()) as { notifications?: AppNotification[] };
        setNotifications(data.notifications ?? []);
      } catch {
        // ignore fetch errors silently
      }
    }
    void fetchNotifs();
    const interval = setInterval(() => void fetchNotifs(), 60_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-14 px-4 md:px-6 flex items-center justify-between border-b border-xa-border bg-xa-surface shrink-0">
      <h1 className="text-base font-semibold text-xa-text">{getPageTitle(pathname)}</h1>
      <div className="flex items-center gap-2 md:gap-3">
        {time && (
          <span className="hidden sm:block text-sm font-mono text-xa-muted tabular-nums">
            {time}
          </span>
        )}
        <ThemeToggle />

        {/* Notification Bell */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className="relative flex items-center justify-center w-8 h-8 rounded-lg hover:bg-xa-border/30 transition-colors"
            aria-label="Notifications"
          >
            <span className="text-lg">🔔</span>
            {notifications.length > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4 h-4 rounded-full text-white text-[10px] font-bold"
                style={{
                  background: '#ff3341',
                  animation: 'xa-badge-pulse 2s ease-in-out infinite',
                  lineHeight: 1,
                }}
              >
                {notifications.length}
              </span>
            )}
          </button>

          {notifOpen && (
            <div
              className="bg-xa-surface border border-xa-border rounded-xl shadow-xl overflow-hidden"
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '280px',
                zIndex: 50,
              }}
            >
              <div className="px-4 py-2.5 border-b border-xa-border">
                <span className="text-xs font-semibold text-xa-muted uppercase tracking-wider">
                  Notifications
                </span>
              </div>
              {notifications.length === 0 ? (
                <p className="px-4 py-3 text-sm text-xa-muted">Aucune notification.</p>
              ) : (
                <ul>
                  {notifications.map((n) => (
                    <li
                      key={n.id}
                      className="px-4 py-3 text-sm text-xa-text hover:bg-xa-border/20 transition-colors cursor-default border-b border-xa-border/50 last:border-b-0"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span>{n.text}</span>
                        {n.type === 'stock' && (
                          <Link
                            href="/dashboard/alertes-stock"
                            onClick={() => setNotifOpen(false)}
                            className="text-xs text-xa-primary hover:underline whitespace-nowrap shrink-0"
                          >
                            Voir →
                          </Link>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <InstallPwaButton />
        <Link
          href="/dashboard/caisse"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-xa-primary text-white text-xs font-semibold hover:opacity-90 transition-opacity"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          <span className="hidden sm:inline">Nouvelle vente</span>
        </Link>
      </div>
    </header>
  );
}
