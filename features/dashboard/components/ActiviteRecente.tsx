'use client';

import Link from 'next/link';
import { formatFCFA } from '@/lib/format';
import type { DashboardActiviteItem } from '@/app/api/dashboard/home/route';

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `il y a ${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours}h`;
  return `il y a ${Math.floor(hours / 24)}j`;
}

type Props = {
  activite: DashboardActiviteItem[];
};

export default function ActiviteRecente({ activite }: Props) {
  return (
    <div className="xa-home-section">
      <div className="xa-home-section-header">
        <h2 className="xa-home-section-title">Activité récente</h2>
        <Link href="/dashboard/transactions" className="xa-home-section-link">
          Tout voir →
        </Link>
      </div>
      {activite.length === 0 ? (
        <div className="xa-home-empty-state">
          <div className="xa-home-empty-state__emoji">🛒</div>
          <div className="xa-home-empty-state__title">Faites votre première vente !</div>
          <div className="xa-home-empty-state__sub">Les transactions apparaîtront ici</div>
          <a href="/caisse" className="xa-home-empty-state__cta">Ouvrir la caisse →</a>
        </div>
      ) : (
        <div className="xa-home-activite-list">
          {activite.map((item) => (
            <Link key={item.id} href={`/dashboard/transactions`} className="xa-home-activite-row">
              <div className="xa-home-activite-row__icon">🧾</div>
              <div className="xa-home-activite-row__info">
                <span className="xa-home-activite-row__desc">{item.description}</span>
                <span className="xa-home-activite-row__time">{formatRelativeTime(item.created_at)}</span>
              </div>
              <div className="xa-home-activite-row__montant">{formatFCFA(item.montant)}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
