'use client';

import { useEffect, useState } from 'react';
import type { DayStat } from '@/lib/supabase/getWeeklyStats';
import type { Boutique } from '@/types/database';
import { formatFCFA } from '@/lib/format';

type WeeklyChartProps = {
  stats: DayStat[];
  boutiques: Boutique[];
};

type Metric = 'ca' | 'benefice' | 'transactions';
type Period = '7j' | '30j' | 'mois';

const DAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const MONTH_LABELS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
const MAX_BAR_HEIGHT = 160;

function getDaysForPeriod(period: Exclude<Period, 'mois'>): string[] {
  const count = period === '7j' ? 7 : 30;
  const days: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

function getLast6Months(): string[] {
  const months: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    months.push(d.toISOString().slice(0, 7)); // 'YYYY-MM'
  }
  return months;
}

function getMetricValue(dayStat: DayStat, metric: Metric): number {
  if (metric === 'ca') return dayStat.ca;
  if (metric === 'benefice') return dayStat.benefice;
  return dayStat.transactions;
}

function formatValue(value: number, metric: Metric): string {
  if (metric === 'transactions') return `${value} vente${value > 1 ? 's' : ''}`;
  return formatFCFA(value);
}

export default function WeeklyChart({ stats, boutiques }: WeeklyChartProps) {
  const [mounted, setMounted] = useState(false);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [metric, setMetric] = useState<Metric>('ca');
  const [period, setPeriod] = useState<Period>('7j');
  const [objectif, setObjectif] = useState<number>(0);
  const [editingObjectif, setEditingObjectif] = useState(false);
  const [objectifInput, setObjectifInput] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('xa-objectif-journalier');
      if (stored) {
        const val = parseInt(stored, 10);
        if (!isNaN(val) && val > 0) setObjectif(val);
      }
    }
    return () => clearTimeout(t);
  }, []);

  // ─── Mois view ───────────────────────────────────────────────────────────
  if (period === 'mois') {
    const months = getLast6Months();

    // Aggregate stats by month + boutique_id
    const monthMap: Record<string, Record<string, DayStat>> = {};
    for (const s of stats) {
      const month = s.date.slice(0, 7);
      if (!months.includes(month)) continue;
      if (!monthMap[month]) monthMap[month] = {};
      const bid = s.boutique_id;
      if (!monthMap[month][bid]) {
        monthMap[month][bid] = { date: month, ca: 0, benefice: 0, transactions: 0, boutique_id: bid };
      }
      monthMap[month][bid].ca += s.ca;
      monthMap[month][bid].benefice += s.benefice;
      monthMap[month][bid].transactions += s.transactions;
    }

    const monthTotals = months.map((m) => {
      const byBoutique = monthMap[m] ?? {};
      return Object.values(byBoutique).reduce((sum, s) => sum + getMetricValue(s, metric), 0);
    });
    const maxVal = Math.max(...monthTotals, 1);

    return (
      <div className="bg-xa-surface border border-xa-border rounded-xl p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="text-sm font-semibold text-xa-text">Évolution des performances</h3>
          <PeriodToggle period={period} setPeriod={setPeriod} />
        </div>

        {/* Metric toggle */}
        <MetricToggle metric={metric} setMetric={setMetric} />

        {/* Bars */}
        <div className="flex items-end gap-2" style={{ height: `${MAX_BAR_HEIGHT + 24}px` }}>
          {months.map((month) => {
            const byBoutique = monthMap[month] ?? {};
            const total = monthTotals[months.indexOf(month)];
            const barHeight = maxVal > 0 ? Math.max((total / maxVal) * MAX_BAR_HEIGHT, total > 0 ? 4 : 0) : 0;
            const monthIndex = parseInt(month.slice(5, 7), 10) - 1;
            const label = MONTH_LABELS[monthIndex];
            const isHovered = hoveredKey === month;

            return (
              <div
                key={month}
                className="flex-1 flex flex-col items-center justify-end"
                style={{ height: '100%', position: 'relative' }}
                onMouseEnter={() => setHoveredKey(month)}
                onMouseLeave={() => setHoveredKey(null)}
              >
                {isHovered && total > 0 && (
                  <Tooltip value={formatValue(total, metric)} barHeight={barHeight} />
                )}
                <div
                  className="w-full rounded-sm overflow-hidden flex flex-col-reverse"
                  style={{
                    height: `${mounted ? barHeight : 0}px`,
                    transition: 'height 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    opacity: isHovered ? 0.85 : 1,
                  }}
                >
                  {metric === 'transactions' ? (
                    total > 0 && (
                      <div style={{ height: '100%', backgroundColor: 'var(--xa-primary)' }} />
                    )
                  ) : (
                    boutiques.map((b) => {
                      const bStat = byBoutique[b.id];
                      const bVal = bStat ? getMetricValue(bStat, metric) : 0;
                      if (!bVal || !total) return null;
                      const pct = (bVal / total) * 100;
                      return (
                        <div
                          key={b.id}
                          style={{ height: `${pct}%`, backgroundColor: b.couleur_theme, minHeight: '2px' }}
                          title={`${b.nom}: ${formatValue(bVal, metric)}`}
                        />
                      );
                    })
                  )}
                  {boutiques.length === 0 && total > 0 && (
                    <div style={{ height: '100%', backgroundColor: 'var(--xa-primary)' }} />
                  )}
                </div>
                <span className="text-xs text-xa-muted mt-1.5">{label}</span>
              </div>
            );
          })}
        </div>

        <BoutiqueLegend boutiques={boutiques} metric={metric} />
      </div>
    );
  }

  // ─── 7j / 30j view ───────────────────────────────────────────────────────
  const days = getDaysForPeriod(period);

  // Build map: date -> boutique_id -> aggregated DayStat
  const dataMap: Record<string, Record<string, DayStat>> = {};
  for (const s of stats) {
    if (!days.includes(s.date)) continue;
    if (!dataMap[s.date]) dataMap[s.date] = {};
    const bid = s.boutique_id;
    if (!dataMap[s.date][bid]) {
      dataMap[s.date][bid] = { date: s.date, ca: 0, benefice: 0, transactions: 0, boutique_id: bid };
    }
    dataMap[s.date][bid].ca += s.ca;
    dataMap[s.date][bid].benefice += s.benefice;
    dataMap[s.date][bid].transactions += s.transactions;
  }

  const totals = days.map((d) => {
    const byBoutique = dataMap[d] ?? {};
    return Object.values(byBoutique).reduce((sum, s) => sum + getMetricValue(s, metric), 0);
  });
  const maxVal = Math.max(...totals, 1);

  // Today CA for the daily goal
  const todayStr = new Date().toISOString().split('T')[0];
  const todayCA = Object.values(dataMap[todayStr] ?? {}).reduce((sum, s) => sum + s.ca, 0);

  // For the 30j view, use thinner bars + horizontal scroll on mobile
  const is30j = period === '30j';

  return (
    <div className="bg-xa-surface border border-xa-border rounded-xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="text-sm font-semibold text-xa-text">Évolution des performances</h3>
        <PeriodToggle period={period} setPeriod={setPeriod} />
      </div>

      {/* Metric toggle */}
      <MetricToggle metric={metric} setMetric={setMetric} />

      {/* Bars wrapper — scrollable on mobile for 30j */}
      <div className={is30j ? 'overflow-x-auto -mx-1 px-1' : ''}>
        <div
          className="flex items-end gap-1"
          style={{
            height: `${MAX_BAR_HEIGHT + 24}px`,
            ...(is30j ? { minWidth: `${days.length * 18}px` } : {}),
          }}
        >
          {days.map((date) => {
            const byBoutique = dataMap[date] ?? {};
            const total = totals[days.indexOf(date)];
            const barHeight = maxVal > 0 ? Math.max((total / maxVal) * MAX_BAR_HEIGHT, total > 0 ? 4 : 0) : 0;
            const jsDate = new Date(date + 'T00:00:00');
            const label = is30j
              ? String(jsDate.getDate())
              : DAY_LABELS[jsDate.getDay()];
            const isHovered = hoveredKey === date;

            return (
              <div
                key={date}
                className="flex-1 flex flex-col items-center justify-end"
                style={{ height: '100%', position: 'relative', ...(is30j ? { minWidth: '14px' } : {}) }}
                onMouseEnter={() => setHoveredKey(date)}
                onMouseLeave={() => setHoveredKey(null)}
              >
                {isHovered && total > 0 && (
                  <Tooltip value={formatValue(total, metric)} barHeight={barHeight} />
                )}
                <div
                  className="w-full rounded-sm overflow-hidden flex flex-col-reverse"
                  style={{
                    height: `${mounted ? barHeight : 0}px`,
                    transition: 'height 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    opacity: isHovered ? 0.85 : 1,
                  }}
                >
                  {metric === 'transactions' ? (
                    total > 0 && (
                      <div style={{ height: '100%', backgroundColor: 'var(--xa-primary)' }} />
                    )
                  ) : (
                    boutiques.map((b) => {
                      const bStat = byBoutique[b.id];
                      const bVal = bStat ? getMetricValue(bStat, metric) : 0;
                      if (!bVal || !total) return null;
                      const pct = (bVal / total) * 100;
                      return (
                        <div
                          key={b.id}
                          style={{ height: `${pct}%`, backgroundColor: b.couleur_theme, minHeight: '2px' }}
                          title={`${b.nom}: ${formatValue(bVal, metric)}`}
                        />
                      );
                    })
                  )}
                  {boutiques.length === 0 && total > 0 && (
                    <div style={{ height: '100%', backgroundColor: 'var(--xa-primary)' }} />
                  )}
                </div>
                <span
                  className="text-xs text-xa-muted mt-1.5"
                  style={is30j ? { fontSize: '0.55rem' } : {}}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <BoutiqueLegend boutiques={boutiques} metric={metric} />

      {/* Daily goal — only when metric is CA */}
      {metric === 'ca' && (
        <div className="mt-4 pt-4 border-t border-xa-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-xa-muted">Objectif journalier</span>
            <button
              onClick={() => {
                setObjectifInput(objectif > 0 ? String(objectif) : '');
                setEditingObjectif(true);
              }}
              className="text-xs text-xa-primary hover:underline"
            >
              {objectif > 0 ? '✏️ Modifier' : '+ Définir un objectif'}
            </button>
          </div>
          {editingObjectif && (
            <div className="flex gap-2 mb-2">
              <input
                type="number"
                value={objectifInput}
                onChange={(e) => setObjectifInput(e.target.value)}
                placeholder="Ex: 500000"
                className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-xa-border bg-xa-bg text-xa-text focus:outline-none focus:border-xa-primary"
              />
              <button
                onClick={() => {
                  const val = parseInt(objectifInput, 10);
                  if (!isNaN(val) && val > 0) {
                    setObjectif(val);
                    localStorage.setItem('xa-objectif-journalier', String(val));
                  }
                  setEditingObjectif(false);
                }}
                className="px-3 py-1.5 text-sm rounded-lg bg-xa-primary text-white font-semibold"
              >
                ✓
              </button>
            </div>
          )}
          {objectif > 0 && !editingObjectif && (
            <>
              <div className="flex justify-between text-xs text-xa-muted mb-1">
                <span>{formatFCFA(todayCA)}</span>
                <span>
                  {formatFCFA(objectif)} ({Math.min(Math.round((todayCA / objectif) * 100), 100)}%)
                </span>
              </div>
              <div className="w-full bg-xa-border rounded-full h-2 overflow-hidden">
                <div
                  className="h-2 rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min((todayCA / objectif) * 100, 100)}%`,
                    backgroundColor: todayCA >= objectif ? '#17e8bb' : 'var(--xa-primary)',
                  }}
                />
              </div>
              {todayCA >= objectif && (
                <p className="text-xs text-emerald-500 font-semibold mt-1">🎯 Objectif atteint !</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function Tooltip({ value, barHeight }: { value: string; barHeight: number }) {
  return (
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
      {value}
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
  );
}

function PeriodToggle({ period, setPeriod }: { period: Period; setPeriod: (p: Period) => void }) {
  return (
    <div className="flex gap-1 bg-xa-bg rounded-lg p-1">
      {(['7j', '30j', 'mois'] as Period[]).map((p) => (
        <button
          key={p}
          onClick={() => setPeriod(p)}
          className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
            period === p ? 'bg-xa-primary text-white' : 'text-xa-muted hover:text-xa-text'
          }`}
        >
          {p === '7j' ? '7 jours' : p === '30j' ? '30 jours' : 'Mois'}
        </button>
      ))}
    </div>
  );
}

function MetricToggle({ metric, setMetric }: { metric: Metric; setMetric: (m: Metric) => void }) {
  const options: { key: Metric; label: string }[] = [
    { key: 'ca', label: '💰 CA' },
    { key: 'benefice', label: '📈 Bénéfice' },
    { key: 'transactions', label: '🧾 Ventes' },
  ];
  return (
    <div className="flex gap-1 mb-4">
      {options.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => setMetric(key)}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors border ${
            metric === key
              ? 'bg-xa-primary/10 border-xa-primary text-xa-primary'
              : 'border-xa-border text-xa-muted hover:border-xa-primary/50'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function BoutiqueLegend({ boutiques, metric }: { boutiques: Boutique[]; metric: Metric }) {
  if (boutiques.length === 0 || metric === 'transactions') return null;
  return (
    <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-xa-border">
      {boutiques.map((b) => (
        <div key={b.id} className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: b.couleur_theme }} />
          <span className="text-xs text-xa-muted">{b.nom}</span>
        </div>
      ))}
    </div>
  );
}
