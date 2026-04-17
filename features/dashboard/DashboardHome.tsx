'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatFCFA } from '@/lib/format';
import type { DayStat } from '@/lib/supabase/getWeeklyStats';
import type { AlertesStockData } from '@/lib/supabase/getAlertesStock';
import type { CategoryStat } from '@/lib/supabase/getSalesByCategory';
import type { Boutique } from '@/types/database';
import type { MoisStat } from '@/lib/supabase/getRapports';

// ─── Types ────────────────────────────────────────────────────────────────────

export type RecentTx = {
  id: string;
  client_nom: string | null;
  montant_total: number;
  created_at: string;
  statut: 'validee' | 'annulee';
  boutique_id: string;
};

export type DashboardHomeProps = {
  weeklyStats: DayStat[];
  moisStats: MoisStat[];
  alertesStock: AlertesStockData;
  salesByCategory: CategoryStat[];
  boutiques: Boutique[];
  recentTransactions: RecentTx[];
  clientsCount: number;
  hourlyStats: number[]; // 24 values, one per hour
};

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_COLORS = ['#6c2ed1', '#17e8bb', '#f5740a', '#ff0011'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDaysBack(n: number): string[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (n - 1 - i));
    return d.toISOString().split('T')[0];
  });
}

function formatDayLabel(date: string): string {
  const d = new Date(date + 'T00:00:00');
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

/** Compute SVG area + line paths from a list of numeric values. */
function buildAreaPaths(
  values: number[],
  w: number,
  h: number,
  padX: number = 4,
  padY: number = 8,
): { line: string; area: string } {
  if (values.length < 2) return { line: '', area: '' };
  const max = Math.max(...values, 1);
  const pts = values.map((v, i) => ({
    x: padX + (i / (values.length - 1)) * (w - 2 * padX),
    y: padY + (1 - v / max) * (h - 2 * padY),
  }));

  let line = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const cur = pts[i];
    const cx1 = prev.x + (cur.x - prev.x) / 3;
    const cx2 = cur.x - (cur.x - prev.x) / 3;
    line += ` C ${cx1} ${prev.y} ${cx2} ${cur.y} ${cur.x} ${cur.y}`;
  }

  const area =
    `${line} L ${pts[pts.length - 1].x} ${h} L ${pts[0].x} ${h} Z`;
  return { line, area };
}

/** Build an SVG donut arc path for one segment. */
function buildArcPath(
  cx: number,
  cy: number,
  r: number,
  innerR: number,
  startAngle: number,
  endAngle: number,
): string {
  const cos = Math.cos;
  const sin = Math.sin;
  const x1 = cx + r * cos(startAngle);
  const y1 = cy + r * sin(startAngle);
  const x2 = cx + r * cos(endAngle);
  const y2 = cy + r * sin(endAngle);
  const ix1 = cx + innerR * cos(endAngle);
  const iy1 = cy + innerR * sin(endAngle);
  const ix2 = cx + innerR * cos(startAngle);
  const iy2 = cy + innerR * sin(startAngle);
  const large = endAngle - startAngle > Math.PI ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${innerR} ${innerR} 0 ${large} 0 ${ix2} ${iy2} Z`;
}

function getInitials(name: string | null): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

const AVATAR_COLORS = [
  'bg-xa-primary text-white',
  'bg-mauve-200 text-mauve-800',
  'bg-aquamarine-100 text-aquamarine-700',
  'bg-powder-petal-100 text-powder-petal-700',
];

// ─── Sub-components ───────────────────────────────────────────────────────────

// Stat card — Row 1
function StatCard({
  title,
  value,
  icon,
  badge,
  iconBg,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  badge: React.ReactNode;
  iconBg: string;
}) {
  return (
    <div className="bg-xa-surface border border-xa-border rounded-2xl p-5 shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-start justify-between">
        <span className={`inline-flex rounded-2xl p-3 shadow-sm ${iconBg}`}>{icon}</span>
        <span>{badge}</span>
      </div>
      <p className="text-xs font-semibold text-xa-muted uppercase tracking-wider mt-4">{title}</p>
      <p className="text-4xl font-black text-xa-text">{value}</p>
    </div>
  );
}

// Evolution badge
function EvoBadge({ delta }: { delta: number | null }) {
  if (delta === null) return null;
  const positive = delta >= 0;
  return (
    <span
      className={[
        'inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full',
        positive
          ? 'bg-aquamarine-100 text-aquamarine-700'
          : 'bg-cotton-rose-100 text-cotton-rose-600',
      ].join(' ')}
    >
      {positive ? '▲' : '▼'} {Math.abs(delta)}%
    </span>
  );
}

// ─── Revenue Area Chart (Row 2 left) ─────────────────────────────────────────

type RevPeriod = '7J' | '30J' | 'MOIS' | 'ANNÉE';

function RevenueChart({
  weeklyStats,
  moisStats,
}: {
  weeklyStats: DayStat[];
  moisStats: MoisStat[];
}) {
  const [period, setPeriod] = useState<RevPeriod>('30J');

  // Build (label, value) pairs based on period
  const chartData: Array<{ label: string; value: number }> = (() => {
    if (period === '7J') {
      return getDaysBack(7).map((date) => ({
        label: formatDayLabel(date),
        value: weeklyStats.filter((s) => s.date === date).reduce((sum, s) => sum + s.ca, 0),
      }));
    }
    if (period === '30J') {
      return getDaysBack(30).map((date) => ({
        label: formatDayLabel(date),
        value: weeklyStats.filter((s) => s.date === date).reduce((sum, s) => sum + s.ca, 0),
      }));
    }
    if (period === 'MOIS') {
      return moisStats.map((m) => ({ label: m.mois, value: m.ca }));
    }
    // ANNÉE — roll up moisStats to same year buckets (or just show all months)
    return moisStats.map((m) => ({ label: m.mois, value: m.ca }));
  })();

  const values = chartData.map((d) => d.value);
  const W = 500;
  const H = 180;
  const { line, area } = buildAreaPaths(values, W, H, 0, 8);

  // Y-axis tick values
  const maxVal = Math.max(...values, 1);
  const yTicks = [0, Math.round(maxVal / 2), maxVal];

  // X-axis: show every nth label to avoid crowding
  const step = period === '30J' ? 5 : 1;

  return (
    <div className="bg-xa-surface border border-xa-border rounded-2xl p-6 lg:col-span-2 shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h3 className="text-xs font-semibold text-xa-muted uppercase tracking-wider">Évolution des revenus</h3>
        <div className="flex gap-1">
          {(['7J', '30J', 'MOIS', 'ANNÉE'] as RevPeriod[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={[
                'px-3 py-1 text-xs font-semibold rounded-lg transition-colors',
                period === p
                  ? 'bg-xa-primary text-white'
                  : 'text-xa-muted hover:text-xa-text',
              ].join(' ')}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="flex gap-3">
        {/* Y-axis labels */}
        <div className="flex flex-col justify-between text-right pb-5" style={{ minWidth: 44 }}>
          {yTicks.reverse().map((v) => (
            <span key={v} className="text-xs text-xa-muted leading-none">
              {v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)}
            </span>
          ))}
        </div>

        {/* SVG */}
        <div className="flex-1 flex flex-col">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="w-full"
            style={{ height: H }}
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6c2ed1" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#6c2ed1" stopOpacity="0.02" />
              </linearGradient>
            </defs>
            {area && <path d={area} fill="url(#revGrad)" />}
            {line && (
              <path d={line} fill="none" stroke="#6c2ed1" strokeWidth="2.5" strokeLinecap="round" />
            )}
          </svg>

          {/* X-axis labels */}
          <div className="flex justify-between mt-1">
            {chartData.map((d, i) => (
              <span
                key={i}
                className="text-xs text-xa-muted"
                style={{ display: i % step === 0 ? 'block' : 'none' }}
              >
                {d.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Peak Hours Bar Chart (Row 2 right) ──────────────────────────────────────

function PeakHoursChart({ hourlyStats }: { hourlyStats: number[] }) {
  // Show hours 8 to 20
  const hours = Array.from({ length: 13 }, (_, i) => i + 8);
  const values = hours.map((h) => hourlyStats[h] ?? 0);
  const max = Math.max(...values, 1);

  // Find top 2 hours
  const sorted = [...values.map((v, i) => ({ v, i }))].sort((a, b) => b.v - a.v);
  const top2Indices = new Set(sorted.slice(0, 2).map((x) => x.i));

  // Peak label
  const peakIdx = sorted[0]?.i ?? 0;
  const peakHour = hours[peakIdx];
  const peakLabel = `${String(peakHour).padStart(2, '0')}:00 — ${String(peakHour + 1).padStart(2, '0')}:00`;

  const BAR_MAX_H = 96;

  return (
    <div className="bg-xa-surface border border-xa-border rounded-2xl p-6 shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold text-xa-muted uppercase tracking-wider">Heures de pointe</h3>
      </div>

      {/* Bar chart */}
      <div className="flex items-end gap-1.5" style={{ height: BAR_MAX_H }}>
        {values.map((v, i) => {
          const barH = Math.max(Math.round((v / max) * (BAR_MAX_H - 8)), 6);
          const isPeak = top2Indices.has(i);
          return (
            <div key={i} className="flex flex-col justify-end flex-1 h-full">
              <div
                className="w-full rounded-md transition-all duration-300"
                style={{
                  height: `${barH}px`,
                  backgroundColor: isPeak ? '#6c2ed1' : '#c4abed',
                  boxShadow: isPeak ? '0 2px 8px rgba(108,46,209,0.35)' : 'none',
                }}
              />
            </div>
          );
        })}
      </div>

      {/* X-axis */}
      <div className="flex justify-between mt-1">
        {hours.map((h, i) => (
          <span
            key={h}
            className="text-xs text-xa-muted flex-1 text-center"
            style={{ display: i % 2 === 0 ? 'block' : 'none' }}
          >
            {String(h).padStart(2, '0')}h
          </span>
        ))}
      </div>

      {/* Peak badge */}
      {max > 0 && (
        <div className="mt-3 flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs font-semibold bg-mauve-50 text-mauve-600 rounded-full px-3 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-xa-primary inline-block" />
            PIC IDENTIFIÉ {peakLabel}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Category Donut (Row 3 first) ─────────────────────────────────────────────

function CategoryDonut({ salesByCategory }: { salesByCategory: CategoryStat[] }) {
  const top5 = salesByCategory.slice(0, 5);
  const total = top5.reduce((s, c) => s + c.ca_total, 0);
  const CX = 70;
  const CY = 70;
  const R = 55;
  const INNER = 35;

  // Build arc paths
  let angle = -Math.PI / 2;
  const arcs = top5.map((cat, i) => {
    const sweep = total > 0 ? (cat.ca_total / total) * 2 * Math.PI : 0;
    const startAngle = angle;
    const endAngle = angle + sweep;
    angle = endAngle;
    return {
      ...cat,
      color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
      path: sweep > 0.01 ? buildArcPath(CX, CY, R, INNER, startAngle, endAngle) : '',
    };
  });

  return (
    <div className="bg-xa-surface border border-xa-border rounded-2xl p-6 shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200">
      <h3 className="text-xs font-semibold text-xa-muted uppercase tracking-wider mb-4">Ventes par catégorie</h3>

      {top5.length === 0 ? (
        <p className="text-xa-muted text-sm text-center py-8">Aucune donnée</p>
      ) : (
        <div className="flex flex-col items-center gap-4">
          {/* Donut SVG */}
          <svg width={140} height={140} viewBox="0 0 140 140">
            {arcs.map((arc) =>
              arc.path ? (
                <path key={arc.categorie} d={arc.path} fill={arc.color} />
              ) : null,
            )}
            {/* Center text */}
            <text x="70" y="66" textAnchor="middle" style={{ fontSize: 11, fontWeight: 700, fill: '#0f061d' }}>
              {total >= 1000 ? `${Math.round(total / 1000)}k` : String(total)}
            </text>
            <text x="70" y="78" textAnchor="middle" style={{ fontSize: 8, fill: '#7c5aa8' }}>
              FCFA
            </text>
          </svg>

          {/* Legend */}
          <div className="w-full space-y-1.5">
            {arcs.map((arc) => (
              <div key={arc.categorie} className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: arc.color }}
                  />
                  <span className="text-xs text-xa-text font-medium truncate">{arc.categorie}</span>
                </div>
                <span className="text-xs font-semibold text-xa-text ml-2 shrink-0">
                  {formatFCFA(arc.ca_total)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Recent Orders (Row 3 second) ────────────────────────────────────────────

function RecentOrders({
  transactions,
  boutiques,
}: {
  transactions: RecentTx[];
  boutiques: Boutique[];
}) {
  const boutiqueMap = new Map(boutiques.map((b) => [b.id, b]));

  return (
    <div className="bg-xa-surface border border-xa-border rounded-2xl p-6 shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold text-xa-muted uppercase tracking-wider">Commandes récentes</h3>
        <Link
          href="/dashboard/transactions"
          className="text-xs font-semibold text-xa-primary uppercase tracking-wider"
        >
          VOIR TOUT
        </Link>
      </div>

      {transactions.length === 0 ? (
        <p className="text-xa-muted text-sm text-center py-8">Aucune transaction</p>
      ) : (
        <ul className="space-y-3">
          {transactions.map((tx, i) => {
            const boutique = boutiqueMap.get(tx.boutique_id);
            const initials = getInitials(tx.client_nom ?? boutique?.nom ?? null);
            const date = new Date(tx.created_at);
            const dateStr = date.toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'short',
            });
            const timeStr = date.toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
            });
            return (
              <li key={tx.id} className="flex items-center gap-3">
                <div
                  className={[
                    'w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0',
                    AVATAR_COLORS[i % AVATAR_COLORS.length],
                  ].join(' ')}
                >
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-xa-text truncate">
                    {tx.client_nom ?? 'Client anonyme'}
                  </p>
                  <p className="text-xs text-xa-muted">
                    {dateStr} · {timeStr}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-sm font-semibold text-xa-text">
                    {formatFCFA(tx.montant_total)}
                  </span>
                  <span
                    className={[
                      'text-xs font-semibold px-1.5 py-0.5 rounded',
                      tx.statut === 'validee'
                        ? 'bg-aquamarine-100 text-aquamarine-700'
                        : 'bg-cotton-rose-100 text-cotton-rose-600',
                    ].join(' ')}
                  >
                    {tx.statut === 'validee' ? 'LIVRÉ' : 'ANNULÉ'}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ─── Stock Alerts (Row 3 third) ───────────────────────────────────────────────

function StockAlerts({ alertesStock }: { alertesStock: AlertesStockData }) {
  const top4 = alertesStock.alertes.slice(0, 4);

  return (
    <div className="bg-xa-surface border border-xa-border rounded-2xl p-6 shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200">
      <h3 className="text-xs font-semibold text-xa-muted uppercase tracking-wider mb-4">Alertes stocks critiques</h3>

      {top4.length === 0 ? (
        <p className="text-xa-muted text-sm text-center py-8">Aucune alerte</p>
      ) : (
        <ul className="space-y-3">
          {top4.map((alerte) => {
            const pct =
              alerte.seuil_alerte > 0
                ? Math.round((alerte.stock_actuel / alerte.seuil_alerte) * 100)
                : 0;
            return (
              <li key={alerte.id} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-xa-text truncate max-w-[140px]">
                    {alerte.nom}
                  </span>
                  <span className="text-xs font-bold text-xa-danger ml-2 shrink-0">
                    {alerte.stock_actuel}/{alerte.seuil_alerte}
                  </span>
                </div>
                <div className="h-1.5 bg-xa-border rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-xa-danger"
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-xa-muted">{alerte.boutique_nom}</p>
              </li>
            );
          })}
        </ul>
      )}

      <Link
        href="/dashboard/alertes-stock"
        className="mt-4 w-full flex items-center justify-center text-xs font-semibold text-xa-danger uppercase tracking-wider py-2"
      >
        RÉAPPROVISIONNER
      </Link>
    </div>
  );
}

// ─── Boutique Performance (Row 3 fourth) ─────────────────────────────────────

function BoutiquePerformance({
  boutiques,
  weeklyStats,
}: {
  boutiques: Boutique[];
  weeklyStats: DayStat[];
}) {
  // Aggregate CA per boutique from last 30 days
  const boutiqueCA = boutiques.map((b) => ({
    boutique: b,
    ca: weeklyStats
      .filter((s) => s.boutique_id === b.id)
      .reduce((sum, s) => sum + s.ca, 0),
  }));
  boutiqueCA.sort((a, b) => b.ca - a.ca);

  const maxCA = Math.max(...boutiqueCA.map((x) => x.ca), 1);

  // Simple bar chart: 4 bars
  const top4 = boutiqueCA.slice(0, 4);
  const PERF_MAX_H = 80;

  return (
    <div className="bg-xa-surface border border-xa-border rounded-2xl p-6 shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200">
      <h3 className="text-xs font-semibold text-xa-muted uppercase tracking-wider mb-4">Performance des boutiques</h3>

      {top4.length === 0 ? (
        <p className="text-xa-muted text-sm text-center py-8">Aucune boutique</p>
      ) : (
        <>
          {/* Mini bar chart */}
          <div className="flex items-end gap-2 mb-4" style={{ height: PERF_MAX_H }}>
            {top4.map((item) => {
              const barH = Math.max(Math.round((item.ca / maxCA) * (PERF_MAX_H - 6)), 6);
              return (
                <div key={item.boutique.id} className="flex flex-col justify-end items-center flex-1 h-full gap-1">
                  <div
                    className="w-full rounded-md"
                    style={{
                      height: `${barH}px`,
                      backgroundColor: '#6c2ed1',
                      boxShadow: '0 2px 8px rgba(108,46,209,0.25)',
                    }}
                  />
                  <span className="text-xs text-xa-muted truncate w-full text-center" style={{ fontSize: 9 }}>
                    {item.boutique.nom}
                  </span>
                </div>
              );
            })}
          </div>

          {/* List */}
          <ul className="space-y-2">
            {top4.map((item) => (
              <li key={item.boutique.id} className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-xa-primary shrink-0" />
                <span className="text-sm text-xa-text flex-1 truncate">{item.boutique.nom}</span>
                <span className="text-xs font-semibold text-xa-montant">
                  {formatFCFA(item.ca)}
                </span>
                <Link
                  href={`/dashboard/boutiques`}
                  className="text-xs text-xa-muted"
                >
                  &gt;
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function DashboardHome({
  weeklyStats,
  moisStats,
  alertesStock,
  salesByCategory,
  boutiques,
  recentTransactions,
  clientsCount,
  hourlyStats,
}: DashboardHomeProps) {
  // ── KPI computations ────────────────────────────────────────────────────────

  // Aggregate last 7 days vs previous 7 days for delta badges
  const last7Days = getDaysBack(7);
  const prev7Start = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 13);
    return d.toISOString().split('T')[0];
  })();
  const prev7End = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  })();

  const last7Total = (key: 'ca' | 'transactions') =>
    weeklyStats
      .filter((s) => last7Days.includes(s.date))
      .reduce((sum, s) => sum + s[key], 0);

  const prev7Total = (key: 'ca' | 'transactions') =>
    weeklyStats
      .filter((s) => s.date >= prev7Start && s.date <= prev7End)
      .reduce((sum, s) => sum + s[key], 0);

  function getDelta(key: 'ca' | 'transactions'): number | null {
    const cur = last7Total(key);
    const prev = prev7Total(key);
    if (prev === 0) return null;
    return Math.round(((cur - prev) / prev) * 100);
  }

  const totalCA = last7Total('ca');
  const totalTx = last7Total('transactions');
  const totalAlertes = alertesStock.nb_ruptures + alertesStock.nb_bas;

  const caIcon = (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
    </svg>
  );
  const txIcon = (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
  const clientIcon = (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
  const alerteIcon = (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );

  return (
    <div className="p-6 bg-xa-bg min-h-screen space-y-6">
      {/* ── Row 1 — 4 KPI cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Volume de vente"
          value={formatFCFA(totalCA)}
          icon={caIcon}
          iconBg="bg-aquamarine-50 text-aquamarine-600"
          badge={<EvoBadge delta={getDelta('ca')} />}
        />
        <StatCard
          title="Commandes"
          value={totalTx}
          icon={txIcon}
          iconBg="bg-aquamarine-50 text-aquamarine-600"
          badge={<EvoBadge delta={getDelta('transactions')} />}
        />
        <StatCard
          title="Clients"
          value={clientsCount}
          icon={clientIcon}
          iconBg="bg-cotton-rose-50 text-cotton-rose-500"
          badge={
            <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full bg-cotton-rose-100 text-cotton-rose-600">
              actifs
            </span>
          }
        />
        <StatCard
          title="Alertes stocks"
          value={totalAlertes}
          icon={alerteIcon}
          iconBg="bg-powder-petal-50 text-powder-petal-500"
          badge={
            totalAlertes > 0 ? (
              <span className="inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-full bg-powder-petal-100 text-powder-petal-700">
                PRIORITÉ HAUTE
              </span>
            ) : (
              <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full bg-aquamarine-100 text-aquamarine-700">
                OK
              </span>
            )
          }
        />
      </div>

      {/* ── Row 2 — Revenue chart + Peak hours ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <RevenueChart weeklyStats={weeklyStats} moisStats={moisStats} />
        <PeakHoursChart hourlyStats={hourlyStats} />
      </div>

      {/* ── Row 3 — 4 blocks ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <CategoryDonut salesByCategory={salesByCategory} />
        <RecentOrders transactions={recentTransactions} boutiques={boutiques} />
        <StockAlerts alertesStock={alertesStock} />
        <BoutiquePerformance boutiques={boutiques} weeklyStats={weeklyStats} />
      </div>
    </div>
  );
}
