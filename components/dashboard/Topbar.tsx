'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import ThemeToggle from '@/components/ui/ThemeToggle';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': "Vue d'ensemble",
  '/dashboard/boutiques': 'Boutiques',
  '/dashboard/boutiques/new': 'Nouvelle boutique',
  '/dashboard/produits': 'Produits',
  '/dashboard/employes': 'Employés',
  '/dashboard/parametres': 'Paramètres',
  '/dashboard/caisse': 'Caisse POS',
  '/dashboard/stocks': 'Stocks consolidés',
};

function getPageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (pathname.startsWith('/dashboard/boutiques/')) return 'Boutique';
  return 'Dashboard';
}

export default function Topbar() {
  const pathname = usePathname();
  const [time, setTime] = useState('');

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
        <Link
          href="/caisse"
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
