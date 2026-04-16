'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
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
    <div className="bg-xa-surface border border-xa-border rounded-lg px-3 py-2 shadow-lg text-sm">
      <p className="text-xa-muted text-xs mb-0.5">{label}</p>
      <p className="font-semibold text-white">{formatted}</p>
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
    <div className="bg-xa-surface border border-xa-border rounded-lg px-3 py-2 shadow-lg text-sm">
      <p className="text-xa-muted text-xs mb-0.5">{label}</p>
      <p className="font-semibold text-white">{formatFCFA(payload[0].value)}</p>
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

  const kpiCards: Array<{
    key: KpiKey;
    title: string;
    value: string | number;
    sparkKey: Metric | null;
    color: string;
  }> = [
    {
      key: 'ca',
      title: "CA aujourd'hui",
      value: formatFCFA(globalStats.ca),
      sparkKey: 'ca',
      color: '#14d9eb',
    },
    {
      key: 'transactions',
      title: 'Transactions',
      value: globalStats.transactions,
      sparkKey: 'transactions',
      color: '#17e8bb',
    },
    {
      key: 'benefice',
      title: 'Bénéfice net',
      value: formatFCFA(globalStats.benefice),
      sparkKey: 'benefice',
      color: '#6c2ed1',
    },
    {
      // boutiques count is static; no meaningful sparkline
      key: 'boutiques',
      title: 'Boutiques actives',
      value: boutiques.length,
      sparkKey: null,
      color: '#8a58da',
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
    ca: '#14d9eb',
    transactions: '#17e8bb',
    benefice: '#6c2ed1',
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
          <motion.button
            key={card.key}
            type="button"
            onClick={() => setSelectedKpi(card.key)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={[
              'bg-xa-surface border rounded-xl p-4 text-left transition-all duration-200 cursor-pointer w-full',
              selectedKpi === card.key
                ? 'border-xa-primary shadow-lg shadow-xa-primary/20'
                : 'border-xa-border hover:border-xa-primary/40',
            ].join(' ')}
          >
            <p className="text-xa-muted text-xs uppercase tracking-wider mb-1">{card.title}</p>
            <p className="text-xl font-bold text-white mb-3">{card.value}</p>
            {/* Sparkline — only for metrics that vary over time */}
            {card.sparkKey !== null && (
              <div className="h-10">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sparklineData}>
                    <Line
                      type="monotone"
                      dataKey={card.sparkKey}
                      stroke={card.color}
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </motion.button>
        ))}
      </div>

      {/* Main trend + Top produits */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main AreaChart */}
        <div className="xl:col-span-2 bg-xa-surface border border-xa-border rounded-xl p-5">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
            <h3 className="text-sm font-semibold text-white">Tendance</h3>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Metric toggles */}
              <div className="flex rounded-lg overflow-hidden border border-xa-border">
                {(['ca', 'transactions', 'benefice'] as Metric[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMetric(m)}
                    className={[
                      'px-3 py-1 text-xs font-medium transition-colors',
                      metric === m
                        ? 'bg-xa-primary text-white'
                        : 'text-xa-muted hover:text-white',
                    ].join(' ')}
                  >
                    {metricLabels[m]}
                  </button>
                ))}
              </div>
              {/* Period toggles */}
              <div className="flex rounded-lg overflow-hidden border border-xa-border">
                {(['7j', '30j'] as Period[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPeriod(p)}
                    className={[
                      'px-3 py-1 text-xs font-medium transition-colors',
                      period === p
                        ? 'bg-xa-primary text-white'
                        : 'text-xa-muted hover:text-white',
                    ].join(' ')}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={metricColors[metric]} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={metricColors[metric]} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#9ca3af', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  interval={period === '7j' ? 0 : 4}
                />
                <YAxis
                  tick={{ fill: '#9ca3af', fontSize: 10 }}
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
                    strokeOpacity={0.5}
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
        <div className="bg-xa-surface border border-xa-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Top produits du mois</h3>
          {top5.length === 0 ? (
            <p className="text-xa-muted text-sm text-center py-8">Aucun produit vendu</p>
          ) : (
            <ul className="space-y-4">
              {top5.map((produit, i) => {
                const pct = Math.round((produit.quantite_totale / maxQty) * 100);
                return (
                  <li key={produit.produit_id ?? produit.nom}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-white truncate max-w-[60%]">
                        <span className="text-xa-muted text-xs mr-1">{i + 1}.</span>
                        {produit.nom}
                      </span>
                      <span className="text-xs text-xa-muted">
                        {produit.quantite_totale} &middot; {formatFCFA(produit.ca_total)}
                      </span>
                    </div>
                    <div className="h-1.5 bg-xa-border rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-xa-primary"
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.5, delay: i * 0.05 }}
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
      <div className="bg-xa-surface border border-xa-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-5">CA — 6 derniers mois</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={moisStats} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              <XAxis
                dataKey="mois"
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#9ca3af', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
                width={40}
              />
              <Tooltip content={<BarTooltip />} />
              <Bar dataKey="ca" radius={[4, 4, 0, 0]} isAnimationActive animationDuration={600}>
                {moisStats.map((entry) => (
                  <Cell
                    key={entry.mois}
                    fill={entry.mois === currentMonthLabel ? '#6c2ed1' : '#6c2ed180'}
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
