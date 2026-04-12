'use client';

import { useEffect, useState } from 'react';
import type { DayStat } from '@/lib/supabase/getWeeklyStats';
import type { Boutique } from '@/types/database';
import { formatFCFA } from '@/lib/format';

type WeeklyChartProps = {
  stats: DayStat[];
  boutiques: Boutique[];
};

const DAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const MAX_BAR_HEIGHT = 180;

function getLast7Days(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

export default function WeeklyChart({ stats, boutiques }: WeeklyChartProps) {
  const [mounted, setMounted] = useState(false);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  useEffect(() => {
    // small delay so CSS transition plays from 0
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const days = getLast7Days();

  // Build map: date -> boutique_id -> ca
  const dataMap: Record<string, Record<string, number>> = {};
  for (const s of stats) {
    if (!dataMap[s.date]) dataMap[s.date] = {};
    dataMap[s.date][s.boutique_id] = (dataMap[s.date][s.boutique_id] ?? 0) + s.ca;
  }

  const totals = days.map((d) => {
    const day = dataMap[d] ?? {};
    return Object.values(day).reduce((sum, v) => sum + v, 0);
  });
  const maxCA = Math.max(...totals, 1);

  return (
    <div className="bg-xa-surface border border-xa-border rounded-xl p-5">
      <h3 className="text-sm font-semibold text-xa-text mb-4">CA des 7 derniers jours</h3>
      <div className="flex items-end gap-1.5" style={{ height: `${MAX_BAR_HEIGHT + 24}px` }}>
        {days.map((date) => {
          const dayData = dataMap[date] ?? {};
          const total = Object.values(dayData).reduce((sum, v) => sum + v, 0);
          const barHeight =
            maxCA > 0 ? Math.max((total / maxCA) * MAX_BAR_HEIGHT, total > 0 ? 4 : 0) : 0;
          const jsDate = new Date(date + 'T00:00:00');
          const label = DAY_LABELS[jsDate.getDay()];
          const isHovered = hoveredDate === date;

          return (
            <div
              key={date}
              className="flex-1 flex flex-col items-center justify-end"
              style={{ height: '100%', position: 'relative' }}
              onMouseEnter={() => setHoveredDate(date)}
              onMouseLeave={() => setHoveredDate(null)}
            >
              {/* Tooltip */}
              {isHovered && total > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: `${barHeight + 28}px`,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'var(--xa-text)',
                    color: 'var(--xa-bg)',
                    fontSize: '0.65rem',
                    fontWeight: '600',
                    whiteSpace: 'nowrap',
                    padding: '3px 7px',
                    borderRadius: '6px',
                    pointerEvents: 'none',
                    zIndex: 10,
                  }}
                >
                  {formatFCFA(total)}
                  <span
                    style={{
                      position: 'absolute',
                      bottom: '-4px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 0,
                      height: 0,
                      borderLeft: '4px solid transparent',
                      borderRight: '4px solid transparent',
                      borderTop: '4px solid var(--xa-text)',
                    }}
                  />
                </div>
              )}

              <div
                className="w-full rounded-sm overflow-hidden flex flex-col-reverse"
                style={{
                  height: `${mounted ? barHeight : 0}px`,
                  transition: 'height 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  transformOrigin: 'bottom',
                  opacity: isHovered ? 0.85 : 1,
                }}
              >
                {boutiques.map((b) => {
                  const bCA = dayData[b.id] ?? 0;
                  if (!bCA || !total) return null;
                  const pct = (bCA / total) * 100;
                  return (
                    <div
                      key={b.id}
                      style={{
                        height: `${pct}%`,
                        backgroundColor: b.couleur_theme,
                        minHeight: '2px',
                      }}
                      title={`${b.nom}: ${formatFCFA(bCA)}`}
                    />
                  );
                })}
                {boutiques.length === 0 && total > 0 && (
                  <div
                    style={{ height: '100%', backgroundColor: 'var(--xa-primary)' }}
                  />
                )}
              </div>
              <span className="text-xs text-xa-muted mt-1.5">{label}</span>
            </div>
          );
        })}
      </div>

      {boutiques.length > 0 && (
        <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-xa-border">
          {boutiques.map((b) => (
            <div key={b.id} className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: b.couleur_theme }}
              />
              <span className="text-xs text-xa-muted">{b.nom}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
