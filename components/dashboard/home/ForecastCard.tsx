import Link from 'next/link';
import type { ForecastData } from '@/lib/supabase/dashboard/forecast';
import { formatFCFA } from '@/lib/format';

type Props = { data: ForecastData };

export default function ForecastCard({ data }: Props) {
  const deltaPositive = data.estimatedCADelta >= 0;
  return (
    <div className="xa-card">
      <div className="xa-card-header">
        <span className="xa-card-title">PRÉVISIONS DEMAIN</span>
        <Link href="/dashboard/previsions" className="xa-card-link">Détail →</Link>
      </div>
      <div className="xa-forecast-body">
        <div className="xa-forecast-ca">
          <span className="xa-forecast-label">CA ESTIMÉ</span>
          <span className="xa-forecast-value">{formatFCFA(data.estimatedCA)}</span>
          <span className={`xa-forecast-delta ${deltaPositive ? 'xa-delta-up' : 'xa-delta-down'}`}>
            {deltaPositive ? '↑' : '↓'} {Math.abs(data.estimatedCADelta)}% vs aujourd&apos;hui
          </span>
        </div>
        <div className="xa-forecast-meta">
          <div className="xa-forecast-meta-row">
            <span className="xa-forecast-meta-label">Heure de pointe</span>
            <span className="xa-forecast-meta-value">{data.peakHourRange}</span>
          </div>
          <div className="xa-forecast-meta-row">
            <span className="xa-forecast-meta-label">Réapprovisionnements</span>
            <span className="xa-forecast-meta-value xa-text-warning">
              {data.restockCount} produit(s)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
