'use client';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import type { PeriodKey } from '@/lib/supabase/dashboard/kpis';

const PERIODS: PeriodKey[] = ['7J', '30J', 'Mois', 'An'];

type Props = {
  storeName: string;
  initialPeriod: PeriodKey;
};

export default function PageHeader({ storeName, initialPeriod }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentPeriod = (searchParams.get('period') as PeriodKey | null) ?? initialPeriod;

  const now = new Date();
  const dateLabel = now
    .toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    .toUpperCase();

  function setPeriod(p: PeriodKey) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('period', p);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="xa-ph">
      <div className="xa-ph-left">
        <h1 className="xa-ph-title">{storeName}</h1>
        <span className="xa-ph-date">{dateLabel} · DONNÉES EN TEMPS RÉEL</span>
      </div>
      <div className="xa-ph-right">
        <div className="xa-period-tabs">
          {PERIODS.map((p) => (
            <button
              key={p}
              className={`xa-period-tab${currentPeriod === p ? ' xa-period-tab-active' : ''}`}
              onClick={() => setPeriod(p)}
            >
              {p}
            </button>
          ))}
        </div>
        <button className="xa-export-btn" disabled title="Bientôt disponible">
          ↓ Export
        </button>
      </div>
    </div>
  );
}
