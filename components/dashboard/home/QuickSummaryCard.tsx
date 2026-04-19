import type { QuickSummaryData } from '@/lib/supabase/dashboard/quick-summary';
import { formatFCFA } from '@/lib/format';

type Props = { data: QuickSummaryData };

export default function QuickSummaryCard({ data }: Props) {
  const convDeltaPositive = data.conversionDelta >= 0;
  return (
    <div className="xa-card">
      <div className="xa-card-header">
        <span className="xa-card-title">RÉSUMÉ RAPIDE</span>
      </div>
      <div className="xa-summary-grid">
        <div className="xa-summary-item">
          <span className="xa-summary-label">Panier moyen</span>
          <span className="xa-summary-value">{formatFCFA(data.basketAvg)}</span>
        </div>
        <div className="xa-summary-item">
          <span className="xa-summary-label">Taux de conversion</span>
          <span className="xa-summary-value">
            {data.conversionRate}%
            <span className={`xa-summary-delta ${convDeltaPositive ? 'xa-delta-up' : 'xa-delta-down'}`}>
              {convDeltaPositive ? '+' : ''}{data.conversionDelta}pts
            </span>
          </span>
        </div>
        <div className="xa-summary-item">
          <span className="xa-summary-label">Transactions</span>
          <span className="xa-summary-value">{data.eventsToday}</span>
        </div>
        <div className="xa-summary-item">
          <span className="xa-summary-label">Alertes stock</span>
          <span className="xa-summary-value xa-text-danger">{data.criticalStockCount} ruptures</span>
        </div>
      </div>
      <div className="xa-insight-box">
        <span className="xa-insight-icon">💡</span>
        <span className="xa-insight-text">{data.insight}</span>
      </div>
    </div>
  );
}
