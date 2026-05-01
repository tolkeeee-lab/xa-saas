'use client';

import type { Transaction, TopProduit } from './types';

interface Props {
  txJour: Transaction[];
  topProduits: TopProduit[];
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(n)) + ' F';
}

function todayFr() {
  return new Date().toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function initials(name: string | null) {
  if (!name) return '🧑';
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

function timeFr(iso: string) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function modeBadgeColor(mode: string): string {
  if (mode === 'especes') return 'var(--xa-green)';
  if (mode === 'credit') return 'var(--xa-amber)';
  return 'var(--xa-blue)'; // mobile / momo / carte
}

function modeLabel(mode: string): string {
  const map: Record<string, string> = {
    especes: 'Espèces',
    momo: 'MoMo',
    mobile: 'Mobile',
    carte: 'Carte',
    credit: 'Crédit',
  };
  return map[mode] ?? mode;
}

// ─── Section 1 : KPI CA du jour ──────────────────────────────────────────────

function KpiCaJour({ txJour }: { txJour: Transaction[] }) {
  const caTotal = txJour
    .filter((t) => t.mode_paiement !== 'credit')
    .reduce((s, t) => s + (t.montant_total ?? 0), 0);
  const nbTx = txJour.length;

  return (
    <div
      style={{
        background: 'var(--xa-surface)',
        border: '1px solid var(--xa-border)',
        borderRadius: 16,
        padding: 16,
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-plex-mono, monospace)',
          fontSize: 28,
          fontWeight: 700,
          color: 'var(--xa-ink)',
          lineHeight: 1,
        }}
      >
        {fmt(caTotal)}
      </div>
      <div style={{ fontSize: 12, color: 'var(--xa-muted)', marginTop: 6 }}>
        {nbTx} transaction{nbTx !== 1 ? 's' : ''} · {todayFr()}
      </div>
    </div>
  );
}

// ─── Section 2 : Heatmap par heure ──────────────────────────────────────────

const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];

function HeatmapHeure({ txJour }: { txJour: Transaction[] }) {
  const counts: Record<number, number> = {};
  for (const tx of txJour) {
    const h = new Date(tx.created_at).getHours();
    counts[h] = (counts[h] ?? 0) + 1;
  }
  const max = Math.max(...Object.values(counts), 1);

  return (
    <div
      style={{
        background: 'var(--xa-surface)',
        border: '1px solid var(--xa-border)',
        borderRadius: 16,
        padding: 16,
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-familjen, system-ui)',
          fontSize: 13,
          fontWeight: 700,
          color: 'var(--xa-ink)',
          marginBottom: 12,
        }}
      >
        🕐 Activité par heure
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          gap: 4,
        }}
      >
        {HOURS.map((h) => {
          const count = counts[h] ?? 0;
          const opacity = count > 0 ? (count / max) * 0.75 + 0.15 : undefined;
          const bg =
            count > 0
              ? `rgba(0, 200, 83, ${opacity})`
              : 'rgba(0,0,0,0.05)';
          return (
            <div key={h} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
              <div
                style={{
                  aspectRatio: '1',
                  width: '100%',
                  borderRadius: 4,
                  background: bg,
                }}
              />
              <span
                style={{
                  fontSize: 7,
                  fontFamily: 'var(--font-plex-mono, monospace)',
                  color: 'var(--xa-muted)',
                }}
              >
                {h}h
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Section 3 : Ventes du jour ─────────────────────────────────────────────

function VentesJour({ txJour }: { txJour: Transaction[] }) {
  return (
    <div
      style={{
        background: 'var(--xa-surface)',
        border: '1px solid var(--xa-border)',
        borderRadius: 16,
        padding: 16,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-familjen, system-ui)',
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--xa-ink)',
          }}
        >
          🛒 Ventes du jour
        </div>
        <span
          style={{
            background: 'rgba(0,200,83,.15)',
            color: 'var(--xa-green)',
            fontSize: 10,
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: 20,
            fontFamily: 'var(--font-plex-mono, monospace)',
          }}
        >
          {todayFr()}
        </span>
      </div>

      {txJour.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--xa-muted)', fontSize: 13, padding: '20px 0' }}>
          Aucune vente aujourd&apos;hui
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {txJour.map((tx) => {
            const ini = initials(tx.client_nom);
            const hasInitials = typeof ini === 'string' && ini !== '🧑';
            const produitsSummary = tx.lignes.map((l) => l.nom_produit).join(', ') || '—';
            return (
              <div
                key={tx.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 0',
                  borderBottom: '1px solid var(--xa-border)',
                }}
              >
                {/* Avatar */}
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: 'rgba(0,200,83,.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: hasInitials ? 12 : 18,
                    fontWeight: 700,
                    color: 'var(--xa-green)',
                    fontFamily: 'var(--font-familjen, system-ui)',
                    flexShrink: 0,
                  }}
                >
                  {ini}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: 'var(--xa-ink)',
                      fontFamily: 'var(--font-familjen, system-ui)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {tx.client_nom ?? 'Client anonyme'}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: 'var(--xa-muted)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {produitsSummary}
                  </div>
                </div>

                {/* Montant + mode + heure */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-plex-mono, monospace)',
                      fontSize: 13,
                      fontWeight: 700,
                      color: 'var(--xa-ink)',
                    }}
                  >
                    {fmt(tx.montant_total)}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 2 }}>
                    <span
                      style={{
                        background: `color-mix(in srgb, ${modeBadgeColor(tx.mode_paiement)} 15%, transparent)`,
                        color: modeBadgeColor(tx.mode_paiement),
                        fontSize: 9,
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: 10,
                        fontFamily: 'var(--font-plex-mono, monospace)',
                      }}
                    >
                      {modeLabel(tx.mode_paiement)}
                    </span>
                    <span style={{ fontSize: 10, color: 'var(--xa-muted)', fontFamily: 'var(--font-plex-mono, monospace)' }}>
                      {timeFr(tx.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Section 4 : Top produits ────────────────────────────────────────────────

function TopProduits({ topProduits }: { topProduits: TopProduit[] }) {
  const maxRev = Math.max(...topProduits.map((p) => p.total_rev), 1);

  return (
    <div
      style={{
        background: 'var(--xa-surface)',
        border: '1px solid var(--xa-border)',
        borderRadius: 16,
        padding: 16,
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-familjen, system-ui)',
          fontSize: 13,
          fontWeight: 700,
          color: 'var(--xa-ink)',
          marginBottom: 12,
        }}
      >
        🔥 Top produits — 30 jours
      </div>

      {topProduits.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--xa-muted)', fontSize: 13, padding: '20px 0' }}>
          Aucune donnée
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {topProduits.map((p) => {
            const barWidth = `${((p.total_rev / maxRev) * 100).toFixed(1)}%`;
            return (
              <div key={p.produit_id ?? p.nom_produit}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  {/* Icon */}
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: 'rgba(0,200,83,.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 16,
                      flexShrink: 0,
                    }}
                  >
                    📦
                  </div>
                  {/* Name + stats */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span
                        style={{
                          fontFamily: 'var(--font-familjen, system-ui)',
                          fontSize: 12,
                          fontWeight: 700,
                          color: 'var(--xa-ink)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {p.nom_produit}
                      </span>
                      <span
                        style={{
                          fontFamily: 'var(--font-plex-mono, monospace)',
                          fontSize: 12,
                          color: 'var(--xa-green)',
                          fontWeight: 700,
                          flexShrink: 0,
                          marginLeft: 8,
                        }}
                      >
                        {fmt(p.total_rev)}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--xa-muted)', marginBottom: 4 }}>
                      {p.total_qte} unité{p.total_qte !== 1 ? 's' : ''}
                    </div>
                    {/* Progress bar */}
                    <div
                      style={{
                        height: 4,
                        borderRadius: 2,
                        background: 'rgba(0,0,0,0.07)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: barWidth,
                          borderRadius: 2,
                          background: `rgba(0, 200, 83, 0.7)`,
                          transition: 'width .4s ease',
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────

export default function TabVentes({ txJour, topProduits }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <KpiCaJour txJour={txJour} />
      <HeatmapHeure txJour={txJour} />
      <VentesJour txJour={txJour} />
      <TopProduits topProduits={topProduits} />
    </div>
  );
}
