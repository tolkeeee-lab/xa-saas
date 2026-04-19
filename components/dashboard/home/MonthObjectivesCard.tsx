import type { ObjectivesData } from '@/lib/supabase/dashboard/objectives';
import { formatFCFA } from '@/lib/format';

type Props = { data: ObjectivesData };

export default function MonthObjectivesCard({ data }: Props) {
  return (
    <div className="xa-card">
      <div className="xa-card-header">
        <span className="xa-card-title">OBJECTIFS DU MOIS</span>
      </div>
      {!data.length ? (
        <div className="xa-card-empty">Aucun objectif défini</div>
      ) : (
        <div className="xa-objectives-list">
          {data.map((row) => (
            <div key={row.boutiqueId} className="xa-objective-row">
              <div className="xa-objective-info">
                <span className="xa-objective-name" style={{ color: row.boutiqueColor }}>
                  {row.boutiqueName}
                </span>
                <span className="xa-objective-amounts">
                  {formatFCFA(row.current)} / {row.target > 0 ? formatFCFA(row.target) : 'N/A'}
                </span>
              </div>
              <div className="xa-objective-bar-wrap">
                <div
                  className="xa-objective-bar"
                  style={{ width: `${row.percent}%`, background: row.boutiqueColor }}
                />
              </div>
              <span className="xa-objective-pct">{row.percent}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
