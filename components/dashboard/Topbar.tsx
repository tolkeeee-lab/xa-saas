'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { createClient } from '@/lib/supabase-browser';
import { getNotifications, type Notification } from '@/lib/supabase/getNotifications';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': "Vue d'ensemble",
  '/dashboard/boutiques': 'Boutiques',
  '/dashboard/boutiques/new': 'Nouvelle boutique',
  '/dashboard/produits': 'Produits',
  '/dashboard/employes': 'Employés',
  '/dashboard/parametres': 'Paramètres',
  '/dashboard/caisse': 'Caisse POS',
  '/dashboard/stocks': 'Stocks consolidés',
  '/dashboard/rapports': 'Rapports',
  '/dashboard/dettes': 'Dettes clients',
  '/dashboard/transferts': 'Transferts',
  '/dashboard/fournisseurs': 'Fournisseurs',
  '/dashboard/perimes': 'Péremptions',
  '/dashboard/top-produits': 'Top produits',
  '/dashboard/comparatif': 'Comparatif',
  '/dashboard/charges-fixes': 'Charges fixes',
  '/dashboard/personnel': 'Personnel',
};

function getPageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (pathname.startsWith('/dashboard/boutiques/')) return 'Boutique';
  return 'Dashboard';
}

const NOTIF_ICONS: Record<Notification['type'], string> = {
  stock_bas: '🔴',
  peremption: '🟡',
  dette: '💸',
};

export default function Topbar() {
  const pathname = usePathname();
  const [time, setTime] = useState('');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

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
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) getNotifications(user.id).then(setNotifications);
    });
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifs(false);
      }
    }
    if (showNotifs) {
      document.addEventListener('mousedown', handleClick);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showNotifs]);

  return (
    <header className="h-14 px-4 md:px-6 flex items-center justify-between border-b border-xa-border bg-xa-surface shrink-0">
      <h1 className="text-base font-semibold text-xa-text">{getPageTitle(pathname)}</h1>
      <div className="flex items-center gap-2 md:gap-3">
        {time && (
          <span className="hidden sm:block text-sm font-mono text-xa-muted tabular-nums">
            {time}
          </span>
        )}

        {/* Notification bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifs((v) => !v)}
            className="relative p-1.5 rounded-lg text-xa-muted hover:text-xa-text hover:bg-xa-bg transition-colors"
            aria-label="Notifications"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            {notifications.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-xa-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {notifications.length > 9 ? '9+' : notifications.length}
              </span>
            )}
          </button>

          {/* Dropdown */}
          {showNotifs && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-xa-surface border border-xa-border rounded-xl shadow-xl z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-xa-border">
                <p className="text-sm font-semibold text-xa-text">Notifications</p>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-xa-muted">
                    Tout est en ordre ✓
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className="px-4 py-3 border-b border-xa-border last:border-0 hover:bg-xa-bg transition-colors"
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-base shrink-0">{NOTIF_ICONS[notif.type]}</span>
                        <div className="min-w-0">
                          <p className="text-xs text-xa-text leading-snug">{notif.message}</p>
                          <p className="text-xs text-xa-muted mt-0.5">{notif.boutique_nom}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <ThemeToggle />
        <Link
          href="/caisse/pos"
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
