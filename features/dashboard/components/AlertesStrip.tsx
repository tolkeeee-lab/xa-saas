'use client';

import Link from 'next/link';
import type { DashboardAlerte } from '@/app/api/dashboard/home/route';

const ALERTE_META: Record<DashboardAlerte['type'], { emoji: string; bg: string; text: string }> = {
  stock: { emoji: '📦', bg: 'var(--xa-redbg)', text: 'var(--xa-red)' },
  peremption: { emoji: '⏰', bg: 'var(--xa-amberbg)', text: 'var(--xa-amber)' },
  dette: { emoji: '💰', bg: 'var(--xa-amberbg)', text: 'var(--xa-amber)' },
  b2b: { emoji: '🛒', bg: 'var(--xa-bluebg)', text: 'var(--xa-blue)' },
};

type Props = {
  alertes: DashboardAlerte[];
};

export default function AlertesStrip({ alertes }: Props) {
  if (!alertes.length) {
    return (
      <div className="xa-home-alertes-empty">
        <span>✅</span>
        <span>Aucune alerte — tout est en ordre !</span>
      </div>
    );
  }

  return (
    <div className="xa-home-alertes-strip">
      {alertes.map((alerte) => {
        const meta = ALERTE_META[alerte.type];
        return (
          <Link
            key={`${alerte.type}-${alerte.count}`}
            href={alerte.href}
            className="xa-home-alerte-chip"
            style={{ background: meta.bg, color: meta.text }}
          >
            <span className="xa-home-alerte-chip__emoji">{meta.emoji}</span>
            <span className="xa-home-alerte-chip__label">{alerte.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
