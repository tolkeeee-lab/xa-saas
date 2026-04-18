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

const CATEGORY_COLORS = ['#3fa7d6', '#59cd90', '#f38a7c', '#fac05e', '#f79d84'];
const MAX_RECENT_TRANSACTIONS = 6;
const MAX_STOCK_ALERTS_RIGHT = 6;

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
  const boutiqueCA = boutiques
    .map((b) => ({
      boutique: b,
      ca: weeklyStats.filter((s) => s.boutique_id === b.id).reduce((sum, s) => sum + s.ca, 0),
    }))
    .sort((a, b) => b.ca - a.ca);
  const maxCA = Math.max(...boutiqueCA.map((x) => x.ca), 1);
  const top4Boutiques = boutiqueCA.slice(0, 4);
  const topAlerts = alertesStock.alertes.slice(0, 4);

  const formatShort = (n: number) =>
    n >= 1_000_000
      ? `${(n / 1_000_000).toFixed(1)}M`
      : n >= 1000
      ? `${Math.round(n / 1000)}k`
      : String(Math.round(n));

  return (
    <div style={{
      width: 360,
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
      {/* Hero KPI */}
      <div style={{ animation: 'riseIn 0.5s cubic-bezier(.22,1,.36,1) 0ms both' }}>
        <MutedLabel label="CA — 7 derniers jours" />
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginTop: 6 }}>
          <span style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 58,
            fontWeight: 900,
            color: 'var(--sp-ink)',
            lineHeight: 1,
          }}>
            {formatShort(totalCA)}
          </span>
          <span style={{ fontSize: 13, color: 'var(--sp-muted)', marginBottom: 8 }}>FCFA</span>
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
                  fontSize: 21,
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

      {/* Boutiques ranking */}
      <div style={{ animation: 'riseIn 0.5s cubic-bezier(.22,1,.36,1) 160ms both' }}>
        <SectionTitle label="Classement boutiques" />
        {top4Boutiques.length === 0 ? (
          <p style={{ color: 'var(--sp-muted)', fontSize: 13 }}>Aucune boutique</p>
        ) : (
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {top4Boutiques.map((item, i) => {
              const pct = Math.round((item.ca / maxCA) * 100);
              return (
                <li key={item.boutique.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12.5, color: 'var(--sp-ink)', fontWeight: 500 }}>
                      <span style={{ color: 'var(--sp-muted)', marginRight: 6, fontFamily: "'DM Mono', monospace" }}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      {item.boutique.nom}
                    </span>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: 'var(--sp-ink2)' }}>
                      {formatShort(item.ca)}
                    </span>
                  </div>
                  <div style={{ height: 4, background: 'var(--sp-rule2)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: 'var(--sp-sky)', borderRadius: 2 }} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div style={{ height: 1, background: 'var(--sp-rule2)' }} />

      {/* Stock alerts */}
      <div style={{ animation: 'riseIn 0.5s cubic-bezier(.22,1,.36,1) 240ms both' }}>
        <SectionTitle label="Alertes stocks" />
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
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12.5, color: 'var(--sp-ink)', fontWeight: 500 }}>
                      {alerte.nom}
                    </span>
                    <span style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 11,
                      color: isCritical ? 'var(--sp-salmon)' : 'var(--sp-gold)',
                      fontWeight: 600,
                    }}>
                      {alerte.stock_actuel}/{alerte.seuil_alerte}
                    </span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--sp-muted)' }}>{alerte.boutique_nom}</span>
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
    </div>
  );
}

// ─── Revenue Area Chart ───────────────────────────────────────────────────────

type RevPeriod = '7J' | '30J' | 'MOIS' | 'ANNÉE';

function RevenueChart({
  weeklyStats,
  moisStats,
}: {
  weeklyStats: DayStat[];
  moisStats: MoisStat[];
}) {
  const [period, setPeriod] = useState<RevPeriod>('30J');

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
    return moisStats.map((m) => ({ label: m.mois, value: m.ca }));
  })();

  const values = chartData.map((d) => d.value);
  const W = 500;
  const H = 180;
  const { line, area } = buildAreaPaths(values, W, H, 0, 8);

  const maxVal = Math.max(...values, 1);
  const yTicks = [0, Math.round(maxVal / 2), maxVal];
  const step = period === '30J' ? 5 : 1;

  return (
    <div style={{ ...cardStyle(0), gridColumn: 'span 2' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: 8 }}>
        <SectionTitle label="Évolution des revenus" />
        <div style={{ display: 'flex', gap: 4 }}>
          {(['7J', '30J', 'MOIS', 'ANNÉE'] as RevPeriod[]).map((p) => (
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

      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', textAlign: 'right', paddingBottom: 20, minWidth: 40 }}>
          {[...yTicks].reverse().map((v) => (
            <span key={v} style={{ fontSize: 11, color: 'var(--sp-muted)', fontFamily: "'DM Mono', monospace" }}>
              {v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)}
            </span>
          ))}
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H }} preserveAspectRatio="none">
            <defs>
              <linearGradient id="revGradPremium" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(63,167,214,0.15)" />
                <stop offset="100%" stopColor="rgba(63,167,214,0)" />
              </linearGradient>
            </defs>
            {area && <path d={area} fill="url(#revGradPremium)" />}
            {line && (
              <path d={line} fill="none" stroke="#3fa7d6" strokeWidth="2.5" strokeLinecap="round" />
            )}
          </svg>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            {chartData.map((d, i) => (
              <span
                key={i}
                style={{
                  fontSize: 10,
                  color: 'var(--sp-muted)',
                  display: i % step === 0 ? 'block' : 'none',
                  fontFamily: "'DM Mono', monospace",
                }}
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

// ─── Category Donut ───────────────────────────────────────────────────────────

function CategoryDonut({ salesByCategory }: { salesByCategory: CategoryStat[] }) {
  const top5 = salesByCategory.slice(0, 5);
  const total = top5.reduce((s, c) => s + c.ca_total, 0);
  const CX = 70;
  const CY = 70;
  const R = 55;
  const INNER = 35;

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
    <div style={cardStyle(80)}>
      <SectionTitle label="Ventes par catégorie" />

      {top5.length === 0 ? (
        <p style={{ color: 'var(--sp-muted)', fontSize: 13, textAlign: 'center', padding: '2rem 0' }}>Aucune donnée</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <svg width={140} height={140} viewBox="0 0 140 140">
            {arcs.map((arc) =>
              arc.path ? (
                <path key={arc.categorie} d={arc.path} fill={arc.color} />
              ) : null,
            )}
            <text x="70" y="66" textAnchor="middle" style={{ fontSize: 11, fontWeight: 700, fill: 'var(--sp-ink)', fontFamily: 'DM Mono, monospace' }}>
              {total >= 1000 ? `${Math.round(total / 1000)}k` : String(total)}
            </text>
            <text x="70" y="78" textAnchor="middle" style={{ fontSize: 8, fill: 'var(--sp-muted)' }}>
              FCFA
            </text>
          </svg>

          <div style={{ width: '100%' }}>
            {arcs.map((arc) => (
              <div key={arc.categorie} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: arc.color, flexShrink: 0, display: 'inline-block' }} />
                  <span style={{ fontSize: 12, color: 'var(--sp-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {arc.categorie}
                  </span>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--sp-ink2)', marginLeft: 8, fontFamily: "'DM Mono', monospace", flexShrink: 0 }}>
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
    <div style={cardStyle(160)}>
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

// ─── Peak Hours Bar Chart ─────────────────────────────────────────────────────

function PeakHoursChart({ hourlyStats }: { hourlyStats: number[] }) {
  const hours = Array.from({ length: 13 }, (_, i) => i + 8);
  const values = hours.map((h) => hourlyStats[h] ?? 0);
  const max = Math.max(...values, 1);

  const sorted = [...values.map((v, i) => ({ v, i }))].sort((a, b) => b.v - a.v);
  const top2Indices = new Set(sorted.slice(0, 2).map((x) => x.i));

  const peakIdx = sorted[0]?.i ?? 0;
  const peakHour = hours[peakIdx];
  const peakLabel = `${String(peakHour).padStart(2, '0')}:00 — ${String(peakHour + 1).padStart(2, '0')}:00`;

  const BAR_MAX_H = 96;

  return (
    <div style={cardStyle(240)}>
      <SectionTitle label="Heures de pointe" />

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: BAR_MAX_H }}>
        {values.map((v, i) => {
          const barH = Math.max(Math.round((v / max) * (BAR_MAX_H - 8)), 6);
          const isPeak = top2Indices.has(i);
          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', flex: 1, height: '100%' }}>
              <div style={{
                width: '100%',
                borderRadius: 4,
                height: `${barH}px`,
                backgroundColor: isPeak ? 'var(--sp-gold)' : 'var(--sp-sky)',
                boxShadow: isPeak ? '0 2px 6px rgba(250,192,94,0.4)' : 'none',
                opacity: isPeak ? 1 : 0.7,
              }} />
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        {hours.map((h, i) => (
          <span
            key={h}
            style={{
              fontSize: 10,
              color: 'var(--sp-muted)',
              flex: 1,
              textAlign: 'center',
              display: i % 2 === 0 ? 'block' : 'none',
              fontFamily: "'DM Mono', monospace",
            }}
          >
            {String(h).padStart(2, '0')}h
          </span>
        ))}
      </div>

      {max > 0 && (
        <div style={{ marginTop: 10 }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 11,
            fontWeight: 600,
            background: 'rgba(250,192,94,0.12)',
            color: '#a07800',
            borderRadius: 999,
            padding: '3px 10px',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--sp-gold)', display: 'inline-block' }} />
            PIC {peakLabel}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Boutique Performance ─────────────────────────────────────────────────────

function BoutiquePerformance({
  boutiques,
  weeklyStats,
}: {
  boutiques: Boutique[];
  weeklyStats: DayStat[];
}) {
  const boutiqueCA = boutiques
    .map((b) => ({
      boutique: b,
      ca: weeklyStats.filter((s) => s.boutique_id === b.id).reduce((sum, s) => sum + s.ca, 0),
    }))
    .sort((a, b) => b.ca - a.ca);
  const maxCA = Math.max(...boutiqueCA.map((x) => x.ca), 1);
  const top4 = boutiqueCA.slice(0, 4);

  return (
    <div style={cardStyle(320)}>
      <SectionTitle label="Performance des boutiques" />

      {top4.length === 0 ? (
        <p style={{ color: 'var(--sp-muted)', fontSize: 13, textAlign: 'center', padding: '2rem 0' }}>Aucune boutique</p>
      ) : (
        <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {top4.map((item) => {
            const pct = Math.round((item.ca / maxCA) * 100);
            return (
              <li key={item.boutique.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 12.5, color: 'var(--sp-ink)', fontWeight: 500 }}>{item.boutique.nom}</span>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: 'var(--sp-ink2)' }}>
                    {formatFCFA(item.ca)}
                  </span>
                </div>
                <div style={{ height: 5, background: 'var(--sp-rule2)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: 'var(--sp-sky)', borderRadius: 3 }} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ─── Stock Alerts (Right Panel) ───────────────────────────────────────────────

function StockAlertsRight({ alertesStock }: { alertesStock: AlertesStockData }) {
  const top6 = alertesStock.alertes.slice(0, MAX_STOCK_ALERTS_RIGHT);

  return (
    <div style={cardStyle(400)}>
      <SectionTitle label="Alertes stocks critiques" />

      {top6.length === 0 ? (
        <p style={{ color: 'var(--sp-muted)', fontSize: 13, textAlign: 'center', padding: '2rem 0' }}>Aucune alerte</p>
      ) : (
        <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {top6.map((alerte) => {
            const pct =
              alerte.seuil_alerte > 0
                ? Math.round((alerte.stock_actuel / alerte.seuil_alerte) * 100)
                : 0;
            const isCritical = alerte.stock_actuel === 0;
            return (
              <li key={alerte.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12.5, color: 'var(--sp-ink)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>
                    {alerte.nom}
                  </span>
                  <span style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 11,
                    fontWeight: 700,
                    color: isCritical ? 'var(--sp-salmon)' : 'var(--sp-gold)',
                    marginLeft: 8,
                    flexShrink: 0,
                  }}>
                    {alerte.stock_actuel}/{alerte.seuil_alerte}
                  </span>
                </div>
                <div style={{ height: 4, background: 'var(--sp-rule2)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${Math.min(pct, 100)}%`,
                    background: isCritical ? 'var(--sp-salmon)' : 'var(--sp-gold)',
                    borderRadius: 2,
                  }} />
                </div>
                <p style={{ fontSize: 11, color: 'var(--sp-muted)', marginTop: 2 }}>{alerte.boutique_nom}</p>
              </li>
            );
          })}
        </ul>
      )}

      <Link
        href="/dashboard/alertes-stock"
        style={{
          display: 'block',
          marginTop: '1rem',
          textAlign: 'center',
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '.08em',
          textTransform: 'uppercase',
          color: 'var(--sp-salmon)',
        }}
      >
        Réapprovisionner →
      </Link>
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

  return (
    <div
      className="dashboard-premium"
      style={{ background: 'var(--sp-cream)', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif" }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr' }}>
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
        <div style={{ padding: '2rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', overflowY: 'auto' }}>
          {/* Row 1 — Revenue chart spanning 2 cols */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <RevenueChart weeklyStats={weeklyStats} moisStats={moisStats} />
          </div>

          {/* Row 2 — Donut + Recent Transactions + Peak Hours */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
            <CategoryDonut salesByCategory={salesByCategory} />
            <RecentOrders transactions={recentTransactions} boutiques={boutiques} />
            <PeakHoursChart hourlyStats={hourlyStats} />
          </div>

          {/* Row 3 — Boutique performance + Stock alerts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <BoutiquePerformance boutiques={boutiques} weeklyStats={weeklyStats} />
            <StockAlertsRight alertesStock={alertesStock} />
          </div>
        </div>
      </div>
    </div>
  );
}
