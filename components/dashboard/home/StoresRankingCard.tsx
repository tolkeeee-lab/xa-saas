import type { StoresRankingData } from '@/lib/supabase/dashboard/stores-ranking';
import { formatFCFA } from '@/lib/format';

type Props = { data: StoresRankingData };

export default function StoresRankingCard({ data }: Props) {
  return (
    <div className="xa-card">
      <div className="xa-card-header">
        <span className="xa-card-title">CLASSEMENT BOUTIQUES</span>
        <span className="xa-card-subtitle">Aujourd&apos;hui</span>
      </div>
      {!data.length ? (
        <div className="xa-card-empty">Aucune donnée disponible</div>
      ) : (
        <div className="xa-ranking-list">
          {data.map((row, idx) => (
            <div key={row.id} className="xa-ranking-row">
              <span className="xa-ranking-rank">#{idx + 1}</span>
              <div className="xa-ranking-info">
                <span className="xa-ranking-name" style={{ color: row.color }}>{row.name}</span>
                <div className="xa-ranking-bar-wrap">
                  <div
                    className="xa-ranking-bar"
                    style={{ width: `${row.percent}%`, background: row.color }}
                  />
                </div>
              </div>
              <span className="xa-ranking-ca">{formatFCFA(row.ca)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
