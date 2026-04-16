'use client';

import { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  BarChart,
  Bar,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { formatFCFA } from '@/lib/format';
import type { DayStat } from '@/lib/supabase/getWeeklyStats';
import type { MoisStat } from '@/lib/supabase/getRapports';
import type { TopProduit } from '@/lib/supabase/getTopProduits';
import type { Boutique } from '@/types/database';

type DashboardChartsProps = {
  weeklyStats: DayStat[];
  moisStats: MoisStat[];
  topProduits: TopProduit[];
  globalStats: { ca: number; transactions: number; benefice: number };
  boutiques: Boutique[];
};

type Metric = 'ca' | 'transactions' | 'benefice';
type Period = '7j' | '30j';
type KpiKey = 'ca' | 'transactions' | 'benefice' | 'boutiques';

// Custom tooltip for the main area chart
function AreaTooltip({
  active,
  payload,
  label,
  metric,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
  metric: Metric;
}) {
  if (!active || !payload?.length) return null;
  const value = payload[0].value;
  const formatted = metric === 'transactions' ? String(value) : formatFCFA(value);
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg px-3 py-2 shadow-md text-sm">
      <p className="text-zinc-400 text-xs mb-0.5">{label}</p>
      <p className="font-semibold text-zinc-900 dark:text-white">{formatted}</p>
    </div>
  );
}

// Custom tooltip for bar chart
function BarTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg px-3 py-2 shadow-md text-sm">
      <p className="text-zinc-400 text-xs mb-0.5">{label}</p>
      <p className="font-semibold text-zinc-900 dark:text-white">{formatFCFA(payload[0].value)}</p>
    </div>
  );
}

function getDaysForPeriod(period: Period): string[] {
  const count = period === '7j' ? 7 : 30;
  const days: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

function formatDayLabel(date: string): string {
  const d = new Date(date + 'T00:00:00');
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export default function DashboardCharts({
  weeklyStats,
  moisStats,
  topProduits,
  globalStats,
  boutiques,
}: DashboardChartsProps) {
  const [selectedKpi, setSelectedKpi] = useState<KpiKey>('ca');
  const [period, setPeriod] = useState<Period>('7j');
  const [metric, setMetric] = useState<Metric>('ca');

  // ── KPI cards ─────────────────────────────────────────────────────────────

  const last7Days = getDaysForPeriod('7j');

  // Aggregate weeklyStats by date for sparklines
  const sparklineData = last7Days.map((date) => {
    const dayStat = weeklyStats.filter((s) => s.date === date);
    return {
      date,
      ca: dayStat.reduce((acc, s) => acc + s.ca, 0),
      transactions: dayStat.reduce((acc, s) => acc + s.transactions, 0),
      benefice: dayStat.reduce((acc, s) => acc + s.benefice, 0),
    };
  });

  // Badge: compare today (last item) vs yesterday (second to last)
  function getDeltaBadge(key: Metric): string | null {
    if (sparklineData.length < 2) return null;
    const today = sparklineData[sparklineData.length - 1][key];
    const yesterday = sparklineData[sparklineData.length - 2][key];
    if (yesterday === 0) return null;
    const delta = Math.round(((today - yesterday) / yesterday) * 100);
    if (delta === 0) return null;
    return delta > 0 ? `+${delta}%` : `${delta}%`;
  }

  const kpiCards: Array<{
    key: KpiKey;
    title: string;
    value: string | number;
    sparkKey: Metric | null;
    badge: string | null;
  }> = [
    {
      key: 'ca',
      title: "CA aujourd'hui",
      value: formatFCFA(globalStats.ca),
      sparkKey: 'ca',
      badge: getDeltaBadge('ca'),
    },
    {
      key: 'transactions',
      title: 'Transactions',
      value: globalStats.transactions,
      sparkKey: 'transactions',
      badge: getDeltaBadge('transactions'),
    },
    {
      key: 'benefice',
      title: 'Bénéfice net',
      value: formatFCFA(globalStats.benefice),
      sparkKey: 'benefice',
      badge: getDeltaBadge('benefice'),
    },
    {
      // boutiques count is static; no meaningful sparkline
      key: 'boutiques',
      title: 'Boutiques actives',
      value: boutiques.length,
      sparkKey: null,
      badge: null,
    },
  ];

  // ── Main trend chart ───────────────────────────────────────────────────────

  // weeklyStats contains last 30 days of data (as fetched by getWeeklyStats),
  // allowing both 7j and 30j period views to work correctly.
  const trendDays = getDaysForPeriod(period);
  const trendData = trendDays.map((date) => {
    const dayStat = weeklyStats.filter((s) => s.date === date);
    return {
      date,
      label: formatDayLabel(date),
      ca: dayStat.reduce((acc, s) => acc + s.ca, 0),
      transactions: dayStat.reduce((acc, s) => acc + s.transactions, 0),
      benefice: dayStat.reduce((acc, s) => acc + s.benefice, 0),
    };
  });

  const trendValues = trendData.map((d) => d[metric]);
  const avgValue =
    trendValues.length > 0
      ? Math.round(trendValues.reduce((a, b) => a + b, 0) / trendValues.length)
      : 0;

  const metricLabels: Record<Metric, string> = {
    ca: 'CA',
    transactions: 'Transactions',
    benefice: 'Bénéfice',
  };

  const metricColors: Record<Metric, string> = {
    ca: '#6c2ed1',
    transactions: '#14d9eb',
    benefice: '#17e8bb',
  };

  // ── Top produits ──────────────────────────────────────────────────────────

  const top5 = topProduits.slice(0, 5);
  const maxQty = top5.length > 0 ? Math.max(...top5.map((p) => p.quantite_totale), 1) : 1;

  // ── 6-month bar chart ──────────────────────────────────────────────────────

  const currentMonthLabel = new Date().toLocaleDateString('fr-FR', { month: 'short' });

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card) => (
          <button
            key={card.key}
            type="button"
            onClick={() => setSelectedKpi(card.key)}
            className={[
              'bg-white dark:bg-zinc-900 border rounded-xl p-4 text-left transition-shadow duration-200 cursor-pointer w-full',
              selectedKpi === card.key
                ? 'border-zinc-200 dark:border-zinc-700 shadow-md'
                : 'border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-md',
            ].join(' ')}
          >
            <p className="text-xs text-zinc-400 uppercase tracking-widest mb-1">{card.title}</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-white mb-3">{card.value}</p>
            {/* Sparkline — only for metrics that vary over time */}
            {card.sparkKey !== null && (
              <div className="h-10 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sparklineData}>
                    <Line
                      type="monotone"
                      dataKey={card.sparkKey}
                      stroke="#6c2ed1"
                      strokeWidth={1.5}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
                {card.badge && (
                  <span
                    className={[
                      'absolute bottom-0 right-0 text-xs font-medium px-1.5 py-0.5 rounded',
                      card.badge.startsWith('+')
                        ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40'
                        : 'text-red-500 bg-red-50 dark:bg-red-950/40',
                    ].join(' ')}
                  >
                    {card.badge}
                  </span>
                )}
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Main trend + Top produits */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main AreaChart */}
        <div className="xl:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-1">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Évolution</h3>
              <p className="text-xs text-zinc-400 mt-0.5">Tendance sur la période sélectionnée</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Metric toggles */}
              <div className="flex gap-1">
                {(['ca', 'transactions', 'benefice'] as Metric[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMetric(m)}
                    className={[
                      'px-2.5 py-1 text-xs font-medium rounded-full transition-colors',
                      metric === m
                        ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700',
                    ].join(' ')}
                  >
                    {metricLabels[m]}
                  </button>
                ))}
              </div>
              {/* Period toggles */}
              <div className="flex gap-1">
                {(['7j', '30j'] as Period[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPeriod(p)}
                    className={[
                      'px-2.5 py-1 text-xs font-medium rounded-full transition-colors',
                      period === p
                        ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700',
                    ].join(' ')}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="h-56 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={metricColors[metric]} stopOpacity={0.08} />
                    <stop offset="95%" stopColor={metricColors[metric]} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#d4d4d8', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  interval={period === '7j' ? 0 : 4}
                />
                <YAxis
                  tick={{ fill: '#d4d4d8', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) =>
                    metric === 'transactions' ? String(v) : `${Math.round(v / 1000)}k`
                  }
                  width={40}
                />
                <Tooltip content={<AreaTooltip metric={metric} />} />
                {avgValue > 0 && (
                  <ReferenceLine
                    y={avgValue}
                    stroke={metricColors[metric]}
                    strokeDasharray="4 4"
                    strokeOpacity={0.4}
                  />
                )}
                <Area
                  type="monotone"
                  dataKey={metric}
                  stroke={metricColors[metric]}
                  strokeWidth={2}
                  fill="url(#trendGradient)"
                  isAnimationActive
                  animationDuration={600}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top produits */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">Top produits du mois</h3>
          {top5.length === 0 ? (
            <p className="text-zinc-400 text-sm text-center py-8">Aucun produit vendu</p>
          ) : (
            <ul className="space-y-4">
              {top5.map((produit, i) => {
                const pct = Math.round((produit.quantite_totale / maxQty) * 100);
                const rank = String(i + 1).padStart(2, '0');
                return (
                  <li key={produit.produit_id ?? produit.nom}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="flex items-center gap-2 min-w-0">
                        <span className="text-xs text-zinc-400 font-mono shrink-0">{rank}</span>
                        <span className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                          {produit.nom}
                        </span>
                      </span>
                      <span className="text-xs text-zinc-400 shrink-0 ml-2">
                        {formatFCFA(produit.ca_total)}
                      </span>
                    </div>
                    <div className="h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-zinc-900 dark:bg-white"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* 6-month bar chart */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-5">CA — 6 derniers mois</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={moisStats} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
              <XAxis
                dataKey="mois"
                tick={{ fill: '#d4d4d8', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#d4d4d8', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
                width={40}
              />
              <Tooltip content={<BarTooltip />} />
              <Bar dataKey="ca" radius={[3, 3, 0, 0]} isAnimationActive animationDuration={600}>
                {moisStats.map((entry) => (
                  <Cell
                    key={entry.mois}
                    fill={entry.mois === currentMonthLabel ? '#6c2ed1' : '#e4e4e7'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
