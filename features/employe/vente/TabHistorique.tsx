'use client';

import { useState } from 'react';
import type { Transaction, TransactionGroupe } from './types';

// ── Formatters ────────────────────────────────────────────────────────────────
const MONTHS = ['jan.','fév.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'];
const DAYS_SHORT = ['Dim.','Lun.','Mar.','Mer.','Jeu.','Ven.','Sam.'];

function fmtMontant(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (Math.round(n / 100) / 10) + 'k';
  return String(n);
}

function fmtHeure(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function fmtDateLabel(dateStr: string): string {
  const t = todayStr();
  const y = yesterdayStr();
  if (dateStr === t) return "Aujourd'hui";
  if (dateStr === y) return 'Hier';
  const d = new Date(dateStr + 'T12:00:00Z');
  return `${DAYS_SHORT[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = (day === 0 ? -6 : 1 - day);
  d.setUTCDate(d.getUTCDate() + diff);
  return d;
}

function fmtWeekLabel(mondayDate: Date): string {
  return `Sem. du ${mondayDate.getUTCDate()} ${MONTHS[mondayDate.getUTCMonth()]}`;
}

// ── Grouping ──────────────────────────────────────────────────────────────────
function groupByDay(txs: Transaction[]): TransactionGroupe[] {
  const map = new Map<string, Transaction[]>();
  for (const t of txs) {
    const key = t.created_at.slice(0, 10);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(t);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, transactions]) => ({
      label: fmtDateLabel(key),
      transactions,
      total_ca: transactions.reduce((s, t) => s + t.montant_total, 0),
      nb_ventes: transactions.length,
    }));
}

function groupByWeek(txs: Transaction[]): TransactionGroupe[] {
  const map = new Map<string, { monday: Date; transactions: Transaction[] }>();
  for (const t of txs) {
    const d = new Date(t.created_at);
    const monday = getMonday(d);
    const key = monday.toISOString().slice(0, 10);
    if (!map.has(key)) map.set(key, { monday, transactions: [] });
    map.get(key)!.transactions.push(t);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([, { monday, transactions }]) => ({
      label: fmtWeekLabel(monday),
      transactions,
      total_ca: transactions.reduce((s, t) => s + t.montant_total, 0),
      nb_ventes: transactions.length,
    }));
}

// ── Badge ─────────────────────────────────────────────────────────────────────
function ModeBadge({ mode }: { mode: string }) {
  const styles: Record<string, { bg: string; color: string; label: string }> = {
    especes:  { bg: 'rgba(0,200,83,0.15)',    color: 'var(--xa-green, #00C853)', label: '💵 Espèces' },
    momo:     { bg: 'rgba(59,130,246,0.15)',  color: '#3B82F6',                  label: '📱 MoMo' },
    mobile:   { bg: 'rgba(59,130,246,0.15)',  color: '#3B82F6',                  label: '📱 Mobile' },
    credit:   { bg: 'rgba(245,158,11,0.15)',  color: 'var(--xa-amber, #F59E0B)', label: '📝 Crédit' },
    carte:    { bg: 'rgba(139,92,246,0.15)',  color: '#8B5CF6',                  label: '💳 Carte' },
  };
  const s = styles[mode] ?? { bg: 'rgba(0,0,0,0.08)', color: 'var(--xa-muted)', label: mode };
  return (
    <span style={{
      background: s.bg, color: s.color,
      borderRadius: 20, padding: '2px 8px',
      fontSize: 10, fontWeight: 600,
      fontFamily: 'var(--font-familjen, system-ui)',
      whiteSpace: 'nowrap',
    }}>{s.label}</span>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
interface Props {
  transactions: Transaction[];
}

type Periode = '7j' | '30j' | 'mois';
type ModeFilter = 'tous' | 'especes' | 'credit';

export default function TabHistorique({ transactions }: Props) {
  const [periode, setPeriode] = useState<Periode>('7j');
  const [modeFilter, setModeFilter] = useState<ModeFilter>('tous');
  const [search, setSearch] = useState('');
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());

  function toggleId(id: string) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  // Filter by period
  const now = new Date();
  const todayIso = now.toISOString().slice(0, 10);
  const filtered = transactions.filter((t) => {
    const d = t.created_at.slice(0, 10);
    if (periode === '7j') {
      const limit = new Date(now);
      limit.setDate(limit.getDate() - 6);
      return d >= limit.toISOString().slice(0, 10);
    }
    if (periode === '30j') {
      const limit = new Date(now);
      limit.setDate(limit.getDate() - 29);
      return d >= limit.toISOString().slice(0, 10);
    }
    if (periode === 'mois') {
      return d.slice(0, 7) === todayIso.slice(0, 7);
    }
    return true;
  }).filter((t) => {
    if (modeFilter === 'tous') return true;
    return t.mode_paiement === modeFilter;
  }).filter((t) => {
    if (!search) return true;
    const q = search.toLowerCase();
    if (t.client_nom?.toLowerCase().includes(q)) return true;
    return t.lignes.some((l) => l.nom_produit.toLowerCase().includes(q));
  });

  const groupes = periode === '30j' ? groupByWeek(filtered) : groupByDay(filtered);

  const btnBase: React.CSSProperties = {
    borderRadius: 20, padding: '5px 12px', fontSize: 11, fontWeight: 600,
    fontFamily: 'var(--font-familjen, system-ui)', cursor: 'pointer', border: 'none',
    transition: 'all .15s',
  };
  const btnActive: React.CSSProperties = { ...btnBase, background: 'var(--xa-ink)', color: 'white' };
  const btnInactive: React.CSSProperties = {
    ...btnBase,
    background: 'var(--xa-surface)', color: 'var(--xa-muted)',
    border: '1px solid var(--xa-border)',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* ── Controls bar ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'var(--xa-bg)', paddingBottom: 10,
      }}>
        {/* Period tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          {(['7j','30j','mois'] as Periode[]).map((p) => (
            <button key={p} onClick={() => setPeriode(p)}
              style={periode === p ? btnActive : btnInactive}>
              {p === '7j' ? '7J' : p === '30j' ? '30J' : 'MOIS'}
            </button>
          ))}
        </div>
        {/* Mode filter */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          {([
            ['tous','Tous'],
            ['especes','💵 Espèces'],
            ['credit','📝 Crédit'],
          ] as [ModeFilter, string][]).map(([m, label]) => (
            <button key={m} onClick={() => setModeFilter(m)}
              style={modeFilter === m ? btnActive : btnInactive}>
              {label}
            </button>
          ))}
        </div>
        {/* Search */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--xa-surface)', border: '1px solid var(--xa-border)',
          borderRadius: 12, padding: '8px 12px',
        }}>
          <span style={{ fontSize: 14, color: 'var(--xa-muted)' }}>🔍</span>
          <input
            type="text"
            placeholder="Client, produit…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1, border: 'none', background: 'none', outline: 'none',
              fontSize: 13, color: 'var(--xa-ink)', fontFamily: 'var(--font-familjen, system-ui)',
            }}
          />
        </div>
      </div>

      {/* ── Groups ── */}
      {groupes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--xa-muted)', fontSize: 13 }}>
          Aucune transaction sur cette période
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {groupes.map((g) => (
            <div key={g.label}>
              {/* Group header */}
              <div style={{
                background: 'var(--xa-ink)', color: 'white',
                borderRadius: 12, padding: '10px 16px', marginBottom: 6,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{
                    fontFamily: 'var(--font-familjen, system-ui)',
                    fontSize: 13, fontWeight: 700,
                  }}>{g.label}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>
                    {g.nb_ventes} vente{g.nb_ventes > 1 ? 's' : ''}
                  </div>
                </div>
                <div style={{
                  fontFamily: 'var(--font-plex-mono, monospace)',
                  fontSize: 15, fontWeight: 700,
                }}>{fmtMontant(g.total_ca)} F</div>
              </div>

              {/* Transactions */}
              {g.transactions.map((t) => {
                const isOpen = openIds.has(t.id);
                return (
                  <div key={t.id} style={{
                    background: 'var(--xa-surface)', border: '1px solid var(--xa-border)',
                    borderRadius: 10, marginBottom: 4, overflow: 'hidden',
                  }}>
                    <div
                      onClick={() => toggleId(t.id)}
                      style={{
                        padding: '10px 14px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 10,
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                          <span style={{
                            fontFamily: 'var(--font-plex-mono, monospace)',
                            fontSize: 11, color: 'var(--xa-muted)',
                          }}>{fmtHeure(t.created_at)}</span>
                          <ModeBadge mode={t.mode_paiement} />
                        </div>
                        <div style={{
                          fontFamily: 'var(--font-familjen, system-ui)',
                          fontSize: 13, fontWeight: 600, color: 'var(--xa-ink)',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>
                          {t.client_nom ?? 'Client'}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{
                          fontFamily: 'var(--font-plex-mono, monospace)',
                          fontSize: 13, fontWeight: 600, color: 'var(--xa-ink)',
                        }}>{fmtMontant(t.montant_total)} F</div>
                        <div style={{ fontSize: 14, color: 'var(--xa-muted)', marginTop: 2 }}>
                          {isOpen ? '▾' : '▸'}
                        </div>
                      </div>
                    </div>
                    {isOpen && (
                      <div style={{
                        borderTop: '1px solid var(--xa-border)',
                        background: 'rgba(0,200,83,0.04)',
                        padding: '8px 14px',
                      }}>
                        {t.lignes.length === 0 ? (
                          <div style={{ fontSize: 11, color: 'var(--xa-muted)', fontStyle: 'italic' }}>
                            Détail non disponible
                          </div>
                        ) : (
                          t.lignes.map((l, i) => (
                            <div key={i} style={{
                              display: 'flex', justifyContent: 'space-between',
                              alignItems: 'center', padding: '4px 0',
                              borderBottom: i < t.lignes.length - 1 ? '1px dashed var(--xa-border)' : 'none',
                              fontSize: 12,
                            }}>
                              <span style={{ flex: 1, color: 'var(--xa-ink)' }}>{l.nom_produit}</span>
                              <span style={{ color: 'var(--xa-muted)', margin: '0 8px' }}>×{l.quantite}</span>
                              <span style={{
                                fontFamily: 'var(--font-plex-mono, monospace)',
                                fontWeight: 500, color: 'var(--xa-ink)',
                              }}>{fmtMontant(l.sous_total)} F</span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
