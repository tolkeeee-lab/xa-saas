'use client';

import { formatFCFA } from '@/lib/format';
import type { DashboardCA7j } from '@/app/api/dashboard/home/route';

const DAY_LABELS: Record<number, string> = { 0: 'DIM', 1: 'LUN', 2: 'MAR', 3: 'MER', 4: 'JEU', 5: 'VEN', 6: 'SAM' };

type Props = {
  ca7j: DashboardCA7j[];
};

export default function GraphCAMois({ ca7j }: Props) {
  if (!ca7j.length) return null;

  const maxCa = Math.max(...ca7j.map((d) => d.ca), 1);

  return (
    <div className="xa-home-section">
      <h2 className="xa-home-section-title">CA — 7 derniers jours</h2>
      <div className="xa-home-graph">
        <svg
          className="xa-home-graph__svg"
          viewBox={`0 0 ${ca7j.length * 44} 80`}
          preserveAspectRatio="none"
          aria-label="Graphique CA des 7 derniers jours"
        >
          {ca7j.map((day, idx) => {
            const barH = Math.max(2, Math.round((day.ca / maxCa) * 60));
            const x = idx * 44 + 4;
            const y = 64 - barH;
            const isToday = idx === ca7j.length - 1;

            return (
              <g key={day.date}>
                <rect
                  x={x}
                  y={y}
                  width={36}
                  height={barH}
                  rx={5}
                  fill={isToday ? 'var(--xa-green)' : 'var(--xa-accentbg)'}
                />
              </g>
            );
          })}
        </svg>
        <div className="xa-home-graph__labels">
          {ca7j.map((day) => {
            const dow = new Date(day.date).getDay();
            return (
              <span key={day.date} className="xa-home-graph__label">
                {DAY_LABELS[dow]}
              </span>
            );
          })}
        </div>
        <div className="xa-home-graph__peak">
          <span className="xa-home-graph__peak-label">Max : {formatFCFA(maxCa)}</span>
        </div>
      </div>
    </div>
  );
}
