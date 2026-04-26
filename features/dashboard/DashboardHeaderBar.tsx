'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings } from 'lucide-react';
import ThemeToggle from '@/components/ui/ThemeToggle';

type Props = {
  userInitials: string;
};

export default function DashboardHeaderBar({ userInitials }: Props) {
  const pathname = usePathname();

  return (
    <header className="xa-header-bar">
      <Link href="/dashboard" className="xa-header-brand" aria-label="Accueil dashboard">
        x<em>à</em>
      </Link>

      <div className="xa-header-right">
        <ThemeToggle />

        <Link
          href="/dashboard/settings"
          className={`xa-header-icon${pathname.startsWith('/dashboard/settings') ? ' xa-nav-active' : ''}`}
          aria-label="Paramètres"
          title="Paramètres"
        >
          <Settings size={18} />
        </Link>

        <div className="xa-tb-avatar" title="Mon compte">
          {userInitials}
        </div>
      </div>
    </header>
  );
}
