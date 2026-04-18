'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Chart from 'chart.js/auto';
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

const BOUTIQUE_COLORS = ['#3fa7d6', '#59cd90', '#f79d84', '#fac05e'];
const CATEGORY_COLORS = ['#3fa7d6', '#f79d84', '#59cd90', '#fac05e', '#f38a7c'];
const MAX_RECENT_TRANSACTIONS = 6;
const MAX_STOCK_ALERTS = 4;

const BOUTIQUE_NAMES_DEMO = ['Akpakpa', 'Zogbadjè', 'Cadjehoun', 'Fidjrossè'];

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

function formatShort(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${Math.round(n / 1000)}k`;
  return String(Math.round(n));
}

// ─── Card style helper ────────────────────────────────────────────────────────

function cardStyle(delay: number = 0): React.CSSProperties {
  return {
    background: 'var(--sp-cream)',
    border: '1px solid var(--sp-rule2)',
    borderRadius: 10,
    padding: '1.35rem 1.4rem',
    boxShadow: '0 1px 3px rgba(28,26,22,.06)',
    animation: `riseIn 0.5s cubic-bezier(.22,1,.36,1) ${delay}ms both`,
  };
}

function SectionTitle({ label }: { label: string }) {
  return (
    <p style={{
      fontFamily: "'Playfair Display', serif",
      fontStyle: 'italic',
      fontSize: 15,
      fontWeight: 700,
      color: 'var(--sp-ink)',
      marginBottom: '0.75rem',
    }}>
      {label}
    </p>
  );
}

function MutedLabel({ label }: { label: string }) {
  return (
    <span style={{
      fontSize: 10.5,
      letterSpacing: '.1em',
      color: 'var(--sp-muted)',
      textTransform: 'uppercase',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {label}
    </span>
  );
}

// ─── Evolution badge ──────────────────────────────────────────────────────────

function EvoBadge({ delta }: { delta: number | null }) {
  if (delta === null) return null;
  const positive = delta >= 0;
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 2,
      fontSize: 12,
      fontWeight: 700,
      padding: '2px 8px',
      borderRadius: 999,
      backgroundColor: positive ? 'rgba(89,205,144,0.15)' : 'rgba(243,138,124,0.15)',
      color: positive ? '#2d9e61' : '#c0392b',
      fontFamily: "'DM Mono', monospace",
    }}>
      {positive ? '▲' : '▼'} {Math.abs(delta)}%
    </span>
  );
}

// ─── Left Panel ───────────────────────────────────────────────────────────────

function LeftPanel({
  totalCA,
  totalTx,
  clientsCount,
  totalAlertes,
  totalBenefice,
  getDelta,
  boutiques,
  weeklyStats,
  alertesStock,
}: {
  totalCA: number;
  totalTx: number;
  clientsCount: number;
  totalAlertes: number;
  totalBenefice: number;
  getDelta: (key: 'ca' | 'transactions') => number | null;
  boutiques: Boutique[];
  weeklyStats: DayStat[];
  alertesStock: AlertesStockData;
}) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

  const boutiqueCA = boutiques
    .map((b) => ({
      boutique: b,
      ca: weeklyStats.filter((s) => s.boutique_id === b.id).reduce((sum, s) => sum + s.ca, 0),
    }))
    .sort((a, b) => b.ca - a.ca);
  const maxCA = Math.max(...boutiqueCA.map((x) => x.ca), 1);
  const top4Boutiques = boutiqueCA.slice(0, 4);
  const topAlerts = alertesStock.alertes.slice(0, MAX_STOCK_ALERTS);

  return (
    <aside style={{
      width: 380,
      minHeight: '100vh',
      background: 'var(--sp-cream2)',
      borderRight: '1px solid var(--sp-rule2)',
      padding: '2rem 1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem',
      position: 'sticky',
      top: 0,
      height: '100vh',
      overflowY: 'auto',
    }}>
      {/* Eyebrow */}
      <div style={{ animation: 'riseIn 0.5s cubic-bezier(.22,1,.36,1) 0ms both' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <MutedLabel label={dateStr} />
          <span style={{
            fontSize: 10.5,
            letterSpacing: '.1em',
            color: 'var(--sp-emerald)',
            textTransform: 'uppercase',
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--sp-emerald)', display: 'inline-block' }} />
            Temps réel
          </span>
        </div>
      </div>

      {/* Hero CA */}
      <div style={{ animation: 'riseIn 0.5s cubic-bezier(.22,1,.36,1) 40ms both' }}>
        <MutedLabel label="CA — 7 derniers jours" />
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginTop: 6 }}>
          <span style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 60,
            fontWeight: 900,
            color: 'var(--sp-ink)',
            lineHeight: 1,
          }}>
            {totalCA >= 1000 ? (totalCA / 1000).toFixed(1) : String(totalCA)}
          </span>
          <span style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 22,
            color: 'var(--sp-muted)',
            marginBottom: 8,
          }}>
            k F
          </span>
        </div>
        <div style={{ marginTop: 6 }}>
          <EvoBadge delta={getDelta('ca')} />
        </div>
      </div>

      <div style={{ height: 1, background: 'var(--sp-rule2)' }} />

      {/* Sub-KPIs 2×2 */}
      <div style={{ animation: 'riseIn 0.5s cubic-bezier(.22,1,.36,1) 80ms both' }}>
        <SectionTitle label="Indicateurs clés" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          {([
            {
              label: 'Commandes',
              value: totalTx,
              badge: <EvoBadge delta={getDelta('transactions')} />,
            },
            {
              label: 'Clients',
              value: clientsCount,
              badge: <span style={{ fontSize: 10, color: 'var(--sp-sky)', fontWeight: 600 }}>actifs</span>,
            },
            {
              label: 'Alertes',
              value: totalAlertes,
              badge: totalAlertes > 0
                ? <span style={{ fontSize: 10, color: 'var(--sp-salmon)', fontWeight: 600 }}>⚠</span>
                : <span style={{ fontSize: 10, color: 'var(--sp-emerald)', fontWeight: 600 }}>OK</span>,
            },
            {
              label: 'Bénéfice',
              value: formatShort(totalBenefice),
              badge: null,
            },
          ] as Array<{ label: string; value: string | number; badge: React.ReactNode }>).map(({ label, value, badge }) => (
            <div key={label} style={{
              background: 'var(--sp-cream)',
              border: '1px solid var(--sp-rule)',
              borderRadius: 8,
              padding: '0.65rem 0.75rem',
            }}>
              <MutedLabel label={label} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <span style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 22,
                  fontWeight: 500,
                  color: 'var(--sp-ink)',
                  lineHeight: 1,
                }}>
                  {value}
                </span>
                {badge}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ height: 1, background: 'var(--sp-rule2)' }} />

      {/* Classement boutiques */}
      <div style={{ animation: 'riseIn 0.5s cubic-bezier(.22,1,.36,1) 160ms both' }}>
        <SectionTitle label="Classement boutiques" />
        {top4Boutiques.length === 0 ? (
          <p style={{ color: 'var(--sp-muted)', fontSize: 13 }}>Aucune boutique</p>
        ) : (
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {top4Boutiques.map((item, i) => {
              const pct = Math.round((item.ca / maxCA) * 100);
              const color = BOUTIQUE_COLORS[i % BOUTIQUE_COLORS.length];
              return (
                <li key={item.boutique.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, alignItems: 'center' }}>
                    <span style={{ fontSize: 12.5, color: 'var(--sp-ink)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontFamily: "'DM Mono', monospace", color: 'var(--sp-faint)', fontSize: 12 }}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />
                      {item.boutique.nom}
                    </span>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: 'var(--sp-ink2)' }}>
                      {formatShort(item.ca)}
                    </span>
                  </div>
                  <div style={{ height: 3, background: 'var(--sp-rule2)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2 }} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div style={{ height: 1, background: 'var(--sp-rule2)' }} />

      {/* Alertes actives */}
      <div style={{ animation: 'riseIn 0.5s cubic-bezier(.22,1,.36,1) 240ms both' }}>
        <SectionTitle label="Alertes actives" />
        {topAlerts.length === 0 ? (
          <p style={{ color: 'var(--sp-muted)', fontSize: 13 }}>Aucune alerte</p>
        ) : (
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {topAlerts.map((alerte) => {
              const isCritical = alerte.stock_actuel === 0;
              return (
                <li key={alerte.id} style={{
                  borderLeft: `3px solid ${isCritical ? 'var(--sp-salmon)' : 'var(--sp-gold)'}`,
                  paddingLeft: 10,
                  background: isCritical ? 'var(--sp-salmon-bg)' : 'var(--sp-gold-bg)',
                  borderRadius: '0 6px 6px 0',
                  padding: '6px 8px 6px 10px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12.5, color: 'var(--sp-ink)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {alerte.nom}
                      </p>
                      <p style={{ fontSize: 11, color: 'var(--sp-muted)', marginTop: 2 }}>{alerte.boutique_nom}</p>
                    </div>
                    <span style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 11,
                      color: isCritical ? 'var(--sp-salmon)' : 'var(--sp-gold)',
                      fontWeight: 700,
                      flexShrink: 0,
                    }}>
                      {alerte.stock_actuel}/{alerte.seuil_alerte}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <Link
          href="/dashboard/alertes-stock"
          style={{
            display: 'block',
            marginTop: '0.75rem',
            fontSize: 11,
            letterSpacing: '.08em',
            textTransform: 'uppercase',
            color: 'var(--sp-salmon)',
            fontWeight: 600,
            textAlign: 'center',
          }}
        >
          Réapprovisionner →
        </Link>
      </div>
    </aside>
  );
}

// ─── Multi-line Revenue Chart (Chart.js) ─────────────────────────────────────

type RevPeriod = '7J' | '30J' | 'MOIS' | 'ANNÉE';

function RevenueMultiLineChart({
  weeklyStats,
  moisStats,
  boutiques,
}: {
  weeklyStats: DayStat[];
  moisStats: MoisStat[];
  boutiques: Boutique[];
}) {
  const [period, setPeriod] = useState<RevPeriod>('7J');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  const top4 = boutiques.slice(0, 4);
  const top4Ca = top4.map((b) =>
    weeklyStats.filter((s) => s.boutique_id === b.id).reduce((sum, s) => sum + s.ca, 0)
  );
  const totalCA = top4Ca.reduce((s, v) => s + v, 0);
  const totalCaDelta: number | null = null; // simplified — computed externally

  useEffect(() => {
    if (!canvasRef.current) return;

    const days = period === '7J' ? getDaysBack(7) : getDaysBack(30);
    const labels = days.map(formatDayLabel);

    const datasets = top4.map((b, i) => ({
      label: b.nom,
      data: days.map((date) =>
        weeklyStats.filter((s) => s.boutique_id === b.id && s.date === date).reduce((sum, s) => sum + s.ca, 0)
      ),
      borderColor: BOUTIQUE_COLORS[i % BOUTIQUE_COLORS.length],
      borderWidth: 2.5,
      tension: 0.42,
      pointRadius: 0,
      fill: false,
    }));

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    chartRef.current = new Chart(canvasRef.current, {
      type: 'line',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1C1A16',
            titleColor: '#C4BFB4',
            bodyColor: '#F7F3EC',
            padding: 10,
            cornerRadius: 6,
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#8C8679', font: { family: 'DM Mono', size: 10 }, maxRotation: 0 },
          },
          y: {
            grid: { color: 'rgba(28,26,22,.06)' },
            ticks: { color: '#8C8679', font: { family: 'DM Mono', size: 10 } },
          },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, weeklyStats, boutiques]);

  return (
    <div style={cardStyle(0)}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <p style={{ fontSize: 10.5, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--sp-muted)', fontFamily: "'DM Sans', sans-serif" }}>
            Revenus multi-boutiques
          </p>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginTop: 4 }}>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700, color: 'var(--sp-ink)', lineHeight: 1 }}>
              {formatShort(totalCA)}
            </span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: 'var(--sp-muted)', marginBottom: 4 }}>
              {totalCaDelta !== null ? (totalCaDelta >= 0 ? `+${totalCaDelta}%` : `${totalCaDelta}%`) : 'FCFA'}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['7J', '30J'] as RevPeriod[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              style={{
                padding: '3px 10px',
                fontSize: 11,
                fontWeight: 600,
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer',
                background: period === p ? 'var(--sp-sky)' : 'transparent',
                color: period === p ? '#fff' : 'var(--sp-muted)',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
        {top4.map((b, i) => (
          <span key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--sp-ink2)' }}>
            <span style={{ width: 16, height: 3, borderRadius: 2, background: BOUTIQUE_COLORS[i % BOUTIQUE_COLORS.length], display: 'inline-block' }} />
            {b.nom}
          </span>
        ))}
      </div>

      <div style={{ height: 220, position: 'relative' }}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}

// ─── Hourly Bar Chart (Chart.js) ──────────────────────────────────────────────

function HourlyBarChart({ hourlyStats }: { hourlyStats: number[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const values = hours.map((h) => hourlyStats[h] ?? 0);

  const sorted = [...values.map((v, i) => ({ v, i }))].sort((a, b) => b.v - a.v);
  const top2Indices = new Set(sorted.slice(0, 2).map((x) => x.i));

  const peakIdx = sorted[0]?.i ?? 0;
  const peakLabel = `${String(peakIdx).padStart(2, '0')}:00`;

  useEffect(() => {
    if (!canvasRef.current) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    chartRef.current = new Chart(canvasRef.current, {
      type: 'bar',
      data: {
        labels: hours.map((h) => `${String(h).padStart(2, '0')}h`),
        datasets: [{
          data: values,
          backgroundColor: values.map((_, i) =>
            top2Indices.has(i) ? 'rgba(63,167,214,.85)' : 'rgba(63,167,214,.18)'
          ),
          borderRadius: 4,
          borderSkipped: false,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1C1A16', bodyColor: '#F7F3EC', padding: 8 } },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#8C8679', font: { family: 'DM Mono', size: 9 } } },
          y: { display: false },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hourlyStats]);

  return (
    <div style={cardStyle(80)}>
      <SectionTitle label="Heures de pointe" />
      <div style={{ height: 130, position: 'relative' }}>
        <canvas ref={canvasRef} />
      </div>
      {values[peakIdx] > 0 && (
        <div style={{ marginTop: 10 }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 11,
            fontWeight: 600,
            background: 'var(--sp-sky-bg)',
            color: 'var(--sp-sky)',
            borderRadius: 999,
            padding: '3px 10px',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--sp-sky)', display: 'inline-block' }} />
            PIC {peakLabel}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Category Donut (Chart.js) ────────────────────────────────────────────────

function CategoryDonut({ salesByCategory }: { salesByCategory: CategoryStat[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);
  const top5 = salesByCategory.slice(0, 5);

  useEffect(() => {
    if (!canvasRef.current) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    chartRef.current = new Chart(canvasRef.current, {
      type: 'doughnut',
      data: {
        labels: top5.map((c) => c.categorie),
        datasets: [{
          data: top5.map((c) => c.ca_total),
          backgroundColor: CATEGORY_COLORS,
          borderWidth: 0,
        }],
      },
      options: {
        responsive: false,
        cutout: '70%',
        plugins: {
          legend: { display: false },
          tooltip: { backgroundColor: '#1C1A16', bodyColor: '#F7F3EC', padding: 8 },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salesByCategory]);

  return (
    <div style={cardStyle(160)}>
      <SectionTitle label="Catégories" />
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <canvas ref={canvasRef} width={96} height={96} />
        <div style={{ flex: 1, minWidth: 0 }}>
          {top5.map((cat, i) => (
            <div key={cat.categorie} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: CATEGORY_COLORS[i % CATEGORY_COLORS.length], flexShrink: 0, display: 'inline-block' }} />
                <span style={{ fontSize: 11.5, color: 'var(--sp-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {cat.categorie}
                </span>
              </div>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--sp-ink2)', flexShrink: 0, marginLeft: 8 }}>
                {formatShort(cat.ca_total)}
              </span>
            </div>
          ))}
          {top5.length === 0 && (
            <p style={{ color: 'var(--sp-muted)', fontSize: 12 }}>Aucune donnée</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Heatmap fréquentation (pure divs) ───────────────────────────────────────

function HeatmapFrequentation({ hourlyStats }: { hourlyStats: number[] }) {
  const OPACITIES = [0.1, 0.24, 0.42, 0.65, 1];
  // Build 4×16 grid (4 weeks × 6h blocks approx)
  const cells: number[] = [];
  for (let row = 0; row < 16; row++) {
    for (let col = 0; col < 4; col++) {
      const hour = (row + col * 6) % 24;
      cells.push(hourlyStats[hour] ?? 0);
    }
  }
  const maxVal = Math.max(...cells, 1);

  function opacityIndex(v: number): number {
    const ratio = v / maxVal;
    if (ratio < 0.2) return 0;
    if (ratio < 0.4) return 1;
    if (ratio < 0.6) return 2;
    if (ratio < 0.8) return 3;
    return 4;
  }

  return (
    <div style={cardStyle(240)}>
      <SectionTitle label="Heatmap fréquentation" />
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 3,
      }}>
        {cells.map((v, i) => (
          <div
            key={i}
            title={`${v} ventes`}
            style={{
              height: 16,
              borderRadius: 2,
              background: `rgba(63,167,214,${OPACITIES[opacityIndex(v)]})`,
            }}
          />
        ))}
      </div>
      <div style={{ display: 'flex', gap: 4, marginTop: 10, alignItems: 'center' }}>
        <span style={{ fontSize: 10, color: 'var(--sp-muted)' }}>Faible</span>
        {OPACITIES.map((op, i) => (
          <span key={i} style={{ width: 12, height: 12, borderRadius: 2, background: `rgba(63,167,214,${op})`, display: 'inline-block' }} />
        ))}
        <span style={{ fontSize: 10, color: 'var(--sp-muted)' }}>Élevé</span>
      </div>
    </div>
  );
}

// ─── Objectifs du mois ────────────────────────────────────────────────────────

function ObjectifsMois({ weeklyStats }: { weeklyStats: DayStat[] }) {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  const caMonth = weeklyStats
    .filter((s) => s.date >= firstDay && s.date <= lastDay)
    .reduce((sum, s) => sum + s.ca, 0);

  const objectif = 5_000_000;
  const pct = Math.min(Math.round((caMonth / objectif) * 100), 100);

  return (
    <div style={cardStyle(0)}>
      <SectionTitle label="Objectifs du mois" />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: 'var(--sp-muted)' }}>CA mensuel</span>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: 'var(--sp-ink)', fontWeight: 600 }}>
          {formatShort(caMonth)} / {formatShort(objectif)}
        </span>
      </div>
      <div style={{ height: 8, background: 'var(--sp-rule2)', borderRadius: 4, overflow: 'hidden', marginBottom: 6 }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: pct >= 80 ? 'var(--sp-emerald)' : pct >= 50 ? 'var(--sp-sky)' : 'var(--sp-gold)',
          borderRadius: 4,
          transition: 'width 0.6s ease',
        }} />
      </div>
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--sp-muted)' }}>
        {pct}% atteint
      </span>
    </div>
  );
}

// ─── Top Produits ─────────────────────────────────────────────────────────────

function TopProduits({ salesByCategory }: { salesByCategory: CategoryStat[] }) {
  const top5 = salesByCategory.slice(0, 5);
  const maxQty = Math.max(...top5.map((c) => c.quantite_totale), 1);

  return (
    <div style={cardStyle(80)}>
      <SectionTitle label="Top catégories ventes" />
      {top5.length === 0 ? (
        <p style={{ color: 'var(--sp-muted)', fontSize: 13 }}>Aucune donnée</p>
      ) : (
        <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {top5.map((cat, i) => {
            const pct = Math.round((cat.quantite_totale / maxQty) * 100);
            return (
              <li key={cat.categorie}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: 'var(--sp-ink)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontFamily: "'DM Mono', monospace", color: 'var(--sp-faint)', fontSize: 11 }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    {cat.categorie}
                  </span>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--sp-ink2)' }}>
                    {cat.quantite_totale} u
                  </span>
                </div>
                <div style={{ height: 3, background: 'var(--sp-rule2)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: CATEGORY_COLORS[i % CATEGORY_COLORS.length], borderRadius: 2 }} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ─── Personnel (boutiques avec badges) ───────────────────────────────────────

function PersonnelCard({ boutiques, weeklyStats }: { boutiques: Boutique[]; weeklyStats: DayStat[] }) {
  const boutiqueCA = boutiques.map((b) => ({
    boutique: b,
    ca: weeklyStats.filter((s) => s.boutique_id === b.id).reduce((sum, s) => sum + s.ca, 0),
    tx: weeklyStats.filter((s) => s.boutique_id === b.id).reduce((sum, s) => sum + s.transactions, 0),
  }));

  return (
    <div style={cardStyle(160)}>
      <SectionTitle label="Personnel / Boutiques" />
      {boutiques.length === 0 ? (
        <p style={{ color: 'var(--sp-muted)', fontSize: 13 }}>Aucune boutique</p>
      ) : (
        <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {boutiqueCA.map((item, i) => (
            <li key={item.boutique.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: BOUTIQUE_COLORS[i % BOUTIQUE_COLORS.length],
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#fff',
                  fontFamily: "'DM Mono', monospace",
                  flexShrink: 0,
                }}>
                  {(item.boutique.nom ?? BOUTIQUE_NAMES_DEMO[i] ?? '?').charAt(0).toUpperCase()}
                </span>
                <div>
                  <p style={{ fontSize: 12.5, color: 'var(--sp-ink)', fontWeight: 500 }}>{item.boutique.nom}</p>
                  <p style={{ fontSize: 10.5, color: 'var(--sp-muted)' }}>{item.tx} tx • {formatShort(item.ca)} F</p>
                </div>
              </div>
              <span style={{
                fontSize: 10,
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 999,
                background: item.ca > 0 ? 'var(--sp-emerald-bg)' : 'var(--sp-rule)',
                color: item.ca > 0 ? '#2d9e61' : 'var(--sp-muted)',
                fontFamily: "'DM Mono', monospace",
              }}>
                {item.ca > 0 ? 'Actif' : 'Inactif'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Score santé boutiques ───────────────────────────────────────────────────

function ScoreSante({
  boutiques,
  weeklyStats,
  alertesStock,
}: {
  boutiques: Boutique[];
  weeklyStats: DayStat[];
  alertesStock: AlertesStockData;
}) {
  const totalBoutiques = boutiques.length;
  const boutiqueActives = boutiques.filter((b) =>
    weeklyStats.some((s) => s.boutique_id === b.id && s.ca > 0)
  ).length;
  const alertesCount = alertesStock.nb_ruptures + alertesStock.nb_bas;
  const score = totalBoutiques === 0
    ? 0
    : Math.max(0, Math.round(
        (boutiqueActives / Math.max(totalBoutiques, 1)) * 70
        - alertesCount * 5
        + 30
      ));
  const clamped = Math.min(score, 100);

  const scoreColor = clamped >= 75 ? 'var(--sp-emerald)' : clamped >= 50 ? 'var(--sp-gold)' : 'var(--sp-salmon)';

  return (
    <div style={cardStyle(0)}>
      <SectionTitle label="Score santé boutiques" />
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ position: 'relative', width: 80, height: 80, flexShrink: 0 }}>
          <svg width={80} height={80} viewBox="0 0 80 80">
            <circle cx={40} cy={40} r={32} fill="none" stroke="var(--sp-rule2)" strokeWidth={8} />
            <circle
              cx={40} cy={40} r={32}
              fill="none"
              stroke={scoreColor}
              strokeWidth={8}
              strokeDasharray={`${(clamped / 100) * 2 * Math.PI * 32} ${2 * Math.PI * 32}`}
              strokeDashoffset={2 * Math.PI * 32 * 0.25}
              strokeLinecap="round"
              style={{ transition: 'stroke-dasharray 0.8s ease' }}
            />
          </svg>
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
          }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 18, fontWeight: 700, color: 'var(--sp-ink)' }}>{clamped}</span>
            <span style={{ fontSize: 9, color: 'var(--sp-muted)', letterSpacing: '.05em' }}>/100</span>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          {[
            { label: 'Boutiques actives', value: `${boutiqueActives}/${totalBoutiques}`, ok: boutiqueActives === totalBoutiques },
            { label: 'Alertes stock', value: String(alertesCount), ok: alertesCount === 0 },
          ].map(({ label, value, ok }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--sp-muted)' }}>{label}</span>
              <span style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 12,
                fontWeight: 600,
                color: ok ? 'var(--sp-emerald)' : 'var(--sp-salmon)',
              }}>
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Prévision + CTA ──────────────────────────────────────────────────────────

function PrevisionCard({ weeklyStats }: { weeklyStats: DayStat[] }) {
  const last7 = getDaysBack(7);
  const avgDay = weeklyStats
    .filter((s) => last7.includes(s.date))
    .reduce((sum, s) => sum + s.ca, 0) / 7;

  const previsionMois = Math.round(avgDay * 30);

  return (
    <div style={{
      ...cardStyle(80),
      background: 'var(--sp-ink)',
      borderColor: 'transparent',
      color: 'var(--sp-cream)',
    }}>
      <p style={{
        fontSize: 10.5,
        letterSpacing: '.1em',
        textTransform: 'uppercase',
        color: 'var(--sp-faint)',
        fontFamily: "'DM Sans', sans-serif",
        marginBottom: 6,
      }}>
        Prévision mensuelle
      </p>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 12 }}>
        <span style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 36,
          fontWeight: 700,
          color: 'var(--sp-cream)',
          lineHeight: 1,
        }}>
          {formatShort(previsionMois)}
        </span>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'var(--sp-muted)', marginBottom: 4 }}>
          FCFA
        </span>
      </div>
      <p style={{ fontSize: 11.5, color: 'var(--sp-faint)', marginBottom: 16, lineHeight: 1.5 }}>
        Basé sur la moyenne des 7 derniers jours ({formatShort(Math.round(avgDay))} F/j)
      </p>
      <Link
        href="/dashboard/rapports"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 16px',
          borderRadius: 8,
          background: 'var(--sp-sky)',
          color: '#fff',
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: '.04em',
          textDecoration: 'none',
        }}
      >
        Voir les rapports →
      </Link>
    </div>
  );
}

// ─── Recent Transactions ──────────────────────────────────────────────────────

function RecentOrders({
  transactions,
  boutiques,
}: {
  transactions: RecentTx[];
  boutiques: Boutique[];
}) {
  const boutiqueMap = new Map(boutiques.map((b) => [b.id, b]));

  return (
    <div style={cardStyle(320)}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <SectionTitle label="Transactions récentes" />
        <Link href="/dashboard/transactions" style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--sp-sky)', letterSpacing: '.06em', textTransform: 'uppercase' }}>
          Voir tout
        </Link>
      </div>

      {transactions.length === 0 ? (
        <p style={{ color: 'var(--sp-muted)', fontSize: 13, textAlign: 'center', padding: '2rem 0' }}>Aucune transaction</p>
      ) : (
        <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {transactions.slice(0, MAX_RECENT_TRANSACTIONS).map((tx, i) => {
            const boutique = boutiqueMap.get(tx.boutique_id);
            const date = new Date(tx.created_at);
            const dateStr = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
            const timeStr = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
            return (
              <li key={tx.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 11,
                  color: 'var(--sp-faint)',
                  minWidth: 18,
                }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--sp-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {tx.client_nom ?? boutique?.nom ?? 'Client anonyme'}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--sp-muted)' }}>
                    {dateStr} · {timeStr}
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, fontWeight: 500, color: 'var(--sp-ink)' }}>
                    {formatFCFA(tx.montant_total)}
                  </span>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 600,
                    padding: '1px 6px',
                    borderRadius: 4,
                    background: tx.statut === 'validee' ? 'rgba(89,205,144,0.15)' : 'rgba(243,138,124,0.15)',
                    color: tx.statut === 'validee' ? '#2d9e61' : '#c0392b',
                  }}>
                    {tx.statut === 'validee' ? 'OK' : 'ANN'}
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

  const totalBenefice = weeklyStats
    .filter((s) => last7Days.includes(s.date))
    .reduce((sum, s) => sum + s.benefice, 0);

  const now = new Date();
  const periodLabel = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  return (
    <div
      style={{ background: 'var(--sp-cream)', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif", color: 'var(--sp-ink)', fontSize: 14 }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr' }}>
        {/* Left Panel */}
        <LeftPanel
          totalCA={totalCA}
          totalTx={totalTx}
          clientsCount={clientsCount}
          totalAlertes={totalAlertes}
          totalBenefice={totalBenefice}
          getDelta={getDelta}
          boutiques={boutiques}
          weeklyStats={weeklyStats}
          alertesStock={alertesStock}
        />

        {/* Right Panel */}
        <main style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', minWidth: 0 }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <p style={{
              fontFamily: "'Playfair Display', serif",
              fontStyle: 'italic',
              fontSize: 15,
              color: 'var(--sp-muted)',
              margin: 0,
            }}>
              Tableau de bord · {periodLabel}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {(['7J', '30J', 'Mois', 'Année'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  style={{
                    padding: '4px 12px',
                    fontSize: 11,
                    fontWeight: 600,
                    borderRadius: 6,
                    border: '1px solid var(--sp-rule2)',
                    cursor: 'pointer',
                    background: 'transparent',
                    color: 'var(--sp-muted)',
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  {tab}
                </button>
              ))}
              <button
                type="button"
                style={{
                  padding: '4px 14px',
                  fontSize: 11,
                  fontWeight: 600,
                  borderRadius: 6,
                  border: 'none',
                  cursor: 'pointer',
                  background: 'var(--sp-ink)',
                  color: 'var(--sp-cream)',
                  fontFamily: "'DM Sans', sans-serif",
                  marginLeft: 4,
                }}
              >
                Exporter
              </button>
            </div>
          </div>

          {/* Row 1 — Revenue multi-line chart */}
          <RevenueMultiLineChart weeklyStats={weeklyStats} moisStats={moisStats} boutiques={boutiques} />

          {/* Row 2 — Grid 3: Heures de pointe / Catégories / Heatmap */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
            <HourlyBarChart hourlyStats={hourlyStats} />
            <CategoryDonut salesByCategory={salesByCategory} />
            <HeatmapFrequentation hourlyStats={hourlyStats} />
          </div>

          {/* Row 3 — Grid 3: Objectifs / Top produits / Personnel */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
            <ObjectifsMois weeklyStats={weeklyStats} />
            <TopProduits salesByCategory={salesByCategory} />
            <PersonnelCard boutiques={boutiques} weeklyStats={weeklyStats} />
          </div>

          {/* Row 4 — Grid 2: Score santé / Prévision + CTA */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <ScoreSante boutiques={boutiques} weeklyStats={weeklyStats} alertesStock={alertesStock} />
            <PrevisionCard weeklyStats={weeklyStats} />
          </div>

          {/* Row 5 — Recent transactions */}
          <RecentOrders transactions={recentTransactions} boutiques={boutiques} />
        </main>
      </div>
    </div>
  );
}
