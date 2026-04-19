'use client';

import { useMemo } from 'react';
import { useDashboardFilter } from '@/context/DashboardFilterContext';
import type { BoutiqueSummary } from '@/lib/supabase/dashboard/hero';
import type { ActivityEvent } from '@/lib/supabase/dashboard/activity';
import { formatFCFA } from '@/lib/format';

type Props = {
  boutiques: BoutiqueSummary[];
  activityEvents: ActivityEvent[];
};

export default function HeroBoutique({ boutiques, activityEvents }: Props) {
  const { activeStoreId } = useDashboardFilter();

  const boutique = useMemo(
    () => boutiques.find((b) => b.id === activeStoreId) ?? null,
    [boutiques, activeStoreId],
  );

  if (!boutique) return null;

  const delta = boutique.ca_yesterday > 0
    ? ((boutique.ca_today - boutique.ca_yesterday) / boutique.ca_yesterday) * 100
    : null;

  const boutiqueAlerts = activityEvents.filter(
    (ev) =>
      ev.boutique?.id === boutique.id &&
      (ev.type === 'alert' || ev.type === 'stock') &&
      (ev.severity === 'warning' || ev.severity === 'danger'),
  ).slice(0, 3);

  const healthColor =
    boutique.health_score >= 75
      ? 'var(--xa-green)'
      : boutique.health_score >= 50
        ? 'var(--xa-amber)'
        : 'var(--xa-red)';

  return (
    <div className="xa-hero">
      {/* Title */}
      <div className="xa-hero-title">{boutique.nom}</div>
      <div className="xa-hero-sub">
        {boutique.ville}
        {boutique.quartier ? ` · ${boutique.quartier}` : ''}
      </div>

      {/* CA du jour */}
      <div className="xa-hero-ca">{formatFCFA(boutique.ca_today)}</div>
      {delta !== null && (
        <div
          className="xa-hero-delta"
          style={{ color: delta >= 0 ? 'var(--xa-green)' : 'var(--xa-red)' }}
        >
          {delta >= 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(1)}% vs hier
        </div>
      )}

      {/* 4 mini KPIs */}
      <div className="xa-hero-kpis">
        <div className="xa-hero-kpi">
          <div className="xa-hero-kpi-lbl">Commandes</div>
          <div className="xa-hero-kpi-val">{boutique.orders_today}</div>
        </div>
        <div className="xa-hero-kpi">
          <div className="xa-hero-kpi-lbl">Panier moy.</div>
          <div className="xa-hero-kpi-val">{boutique.panier_moyen > 0 ? formatFCFA(boutique.panier_moyen) : '—'}</div>
        </div>
        <div className="xa-hero-kpi">
          <div className="xa-hero-kpi-lbl">Personnel</div>
          <div className="xa-hero-kpi-val">{boutique.employes_actifs}</div>
        </div>
        <div className="xa-hero-kpi">
          <div className="xa-hero-kpi-lbl">Alertes stock</div>
          <div
            className="xa-hero-kpi-val"
            style={{ color: boutique.stock_alerts > 0 ? 'var(--xa-amber)' : 'var(--xa-ink)' }}
          >
            {boutique.stock_alerts}
          </div>
        </div>
      </div>

      {/* Health score */}
      <div style={{ marginTop: '0.9rem' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontFamily: 'var(--font-plex-mono), monospace',
            fontSize: 9,
            color: 'var(--xa-muted)',
            letterSpacing: '.1em',
            textTransform: 'uppercase',
            marginBottom: 4,
          }}
        >
          <span>Santé boutique</span>
          <span style={{ color: healthColor, fontWeight: 700 }}>{boutique.health_score}/100</span>
        </div>
        <div
          style={{
            height: 4,
            background: 'var(--xa-bg3)',
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${boutique.health_score}%`,
              background: healthColor,
              borderRadius: 2,
              transition: 'width .4s ease',
            }}
          />
        </div>
      </div>

      {/* Alertes boutique */}
      {boutiqueAlerts.length > 0 && (
        <div style={{ marginTop: '0.9rem' }}>
          <div
            style={{
              fontFamily: 'var(--font-plex-mono), monospace',
              fontSize: 9,
              letterSpacing: '.1em',
              color: 'var(--xa-muted)',
              textTransform: 'uppercase',
              marginBottom: 6,
            }}
          >
            Alertes boutique
          </div>
          {boutiqueAlerts.map((ev) => (
            <div
              key={ev.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 6,
                padding: '0.35rem 0',
                borderBottom: '1px solid var(--xa-rule)',
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: ev.severity === 'danger' ? 'var(--xa-red)' : 'var(--xa-amber)',
                  marginTop: 4,
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 11, color: 'var(--xa-ink)' }}>{ev.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
