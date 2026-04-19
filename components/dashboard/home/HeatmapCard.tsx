'use client';
import type { HeatmapData } from '@/lib/supabase/dashboard/heatmap';

type Props = { data: HeatmapData };

function getColor(value: number, max: number): string {
  if (max === 0 || value === 0) return 'var(--xa-bg3)';
  const intensity = value / max;
  if (intensity > 0.7) return 'var(--xa-accent)';
  if (intensity > 0.4) return 'var(--xa-amber)';
  return 'var(--xa-accentbg)';
}

export default function HeatmapCard({ data }: Props) {
  const maxVal = Math.max(...data.values.flat(), 1);

  return (
    <div className="xa-card">
      <div className="xa-card-header">
        <span className="xa-card-title">ACTIVITÉ PAR HEURE</span>
        <span className="xa-card-subtitle">4 derniers jours</span>
      </div>
      <div className="xa-heatmap">
        <div className="xa-heatmap-header">
          <div className="xa-heatmap-yaxis" />
          {data.days.map((day) => (
            <div key={day} className="xa-heatmap-day-label">{day}</div>
          ))}
        </div>
        {data.hours.map((hour, hIdx) => (
          <div key={hour} className="xa-heatmap-row">
            <div className="xa-heatmap-hour-label">{hour}H</div>
            {data.days.map((day, dIdx) => {
              const val = data.values[dIdx]?.[hIdx] ?? 0;
              return (
                <div
                  key={day}
                  className="xa-heatmap-cell"
                  style={{ background: getColor(val, maxVal) }}
                  title={`${day} ${hour}H: ${val} tx`}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
