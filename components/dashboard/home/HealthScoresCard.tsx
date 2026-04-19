import type { HealthScoresData } from '@/lib/supabase/dashboard/health-scores';

type Props = { data: HealthScoresData };

function scoreColor(score: number): string {
  if (score >= 75) return 'var(--xa-green)';
  if (score >= 50) return 'var(--xa-amber)';
  return 'var(--xa-red)';
}

export default function HealthScoresCard({ data }: Props) {
  return (
    <div className="xa-card">
      <div className="xa-card-header">
        <span className="xa-card-title">SANTÉ BOUTIQUES</span>
      </div>
      {!data.length ? (
        <div className="xa-card-empty">Aucune boutique</div>
      ) : (
        <div className="xa-health-list">
          {data.map((store) => (
            <div key={store.id} className="xa-health-row">
              <div className="xa-health-info">
                <span className="xa-health-name" style={{ color: store.color }}>{store.name}</span>
              </div>
              <div className="xa-health-bar-wrap">
                <div
                  className="xa-health-bar"
                  style={{ width: `${store.score}%`, background: scoreColor(store.score) }}
                />
              </div>
              <span className="xa-health-score" style={{ color: scoreColor(store.score) }}>
                {store.score}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
