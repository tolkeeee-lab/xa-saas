import type { AlertsData } from '@/lib/supabase/dashboard/alerts';

type Props = { data: AlertsData };

export default function ActiveAlertsCard({ data }: Props) {
  return (
    <div className="xa-card">
      <div className="xa-card-header">
        <span className="xa-card-title">ALERTES ACTIVES</span>
        {data.length > 0 && (
          <span className="xa-badge xa-badge-danger">{data.length}</span>
        )}
      </div>
      {!data.length ? (
        <div className="xa-card-ok">✓ Aucune alerte active</div>
      ) : (
        <div className="xa-alerts-list">
          {data.map((alert) => (
            <div key={alert.id} className={`xa-alert-row xa-alert-${alert.severity}`}>
              <div className="xa-alert-icon">
                {alert.severity === 'critical' ? '🔴' : '🟡'}
              </div>
              <div className="xa-alert-info">
                <span className="xa-alert-message">{alert.message}</span>
                <span className="xa-alert-meta">{alert.boutique} · {alert.relativeTime}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
