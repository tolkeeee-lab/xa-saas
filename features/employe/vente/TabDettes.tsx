'use client';

import { useState } from 'react';
import type { DetteFiche } from './types';

const MONTHS = ['jan.','fév.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'];

function fmtMontant(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'k';
  return String(n);
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

function initiales(nom: string): string {
  const parts = nom.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return nom.slice(0, 2).toUpperCase();
}

interface Props {
  dettes: DetteFiche[];
}

export default function TabDettes({ dettes }: Props) {
  const [search, setSearch] = useState('');
  const [filtre, setFiltre] = useState<'actives' | 'toutes'>('actives');

  const actives = dettes.filter((d) => d.reste_a_payer > 0);
  const displayed = (filtre === 'actives' ? actives : dettes).filter((d) => {
    if (!search) return true;
    return d.client_nom.toLowerCase().includes(search.toLowerCase());
  });

  const totalReste = actives.reduce((s, d) => s + d.reste_a_payer, 0);

  const btnBase: React.CSSProperties = {
    borderRadius: 20, padding: '5px 14px', fontSize: 11, fontWeight: 600,
    fontFamily: 'var(--font-familjen, system-ui)', cursor: 'pointer', border: 'none',
    transition: 'all .15s',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* ── KPI total dettes ── */}
      <div style={{
        background: 'rgba(214,40,40,0.1)', border: '1px solid rgba(214,40,40,0.25)',
        borderRadius: 14, padding: '14px 16px', marginBottom: 12,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <div style={{
            fontFamily: 'var(--font-familjen, system-ui)',
            fontSize: 12, fontWeight: 600, color: 'var(--xa-muted)',
            textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4,
          }}>Total restant dû</div>
          <div style={{
            fontFamily: 'var(--font-plex-mono, monospace)',
            fontSize: 24, fontWeight: 700, color: 'var(--xa-red, #D62828)', lineHeight: 1,
          }}>{fmtMontant(totalReste)} F</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontFamily: 'var(--font-plex-mono, monospace)',
            fontSize: 20, fontWeight: 700, color: 'var(--xa-red, #D62828)',
          }}>{actives.length}</div>
          <div style={{ fontSize: 10, color: 'var(--xa-muted)', marginTop: 2 }}>
            client{actives.length > 1 ? 's' : ''} débiteur{actives.length > 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* ── Controls ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'var(--xa-bg)', paddingBottom: 10,
      }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          {(['actives', 'toutes'] as const).map((f) => (
            <button key={f} onClick={() => setFiltre(f)} style={filtre === f
              ? { ...btnBase, background: 'var(--xa-ink)', color: 'white' }
              : { ...btnBase, background: 'var(--xa-surface)', color: 'var(--xa-muted)', border: '1px solid var(--xa-border)' }
            }>
              {f === 'actives' ? `⚠️ Actives (${actives.length})` : 'Toutes'}
            </button>
          ))}
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--xa-surface)', border: '1px solid var(--xa-border)',
          borderRadius: 12, padding: '8px 12px',
        }}>
          <span style={{ fontSize: 14, color: 'var(--xa-muted)' }}>🔍</span>
          <input
            type="text"
            placeholder="Rechercher un client…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1, border: 'none', background: 'none', outline: 'none',
              fontSize: 13, color: 'var(--xa-ink)', fontFamily: 'var(--font-familjen, system-ui)',
            }}
          />
        </div>
      </div>

      {/* ── List ── */}
      {displayed.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🎉</div>
          <div style={{
            fontFamily: 'var(--font-familjen, system-ui)',
            fontSize: 14, fontWeight: 700, color: 'var(--xa-ink)',
          }}>Aucune dette active</div>
          <div style={{ fontSize: 12, color: 'var(--xa-muted)', marginTop: 4 }}>
            Tous les clients sont à jour !
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {displayed.map((d) => {
            const pct = d.montant_total > 0 ? (d.montant_recu / d.montant_total) * 100 : 0;
            const isPaid = d.reste_a_payer <= 0;
            return (
              <div key={d.id} style={{
                background: 'var(--xa-surface)',
                border: `1px solid ${isPaid ? 'rgba(0,200,83,0.3)' : 'rgba(214,40,40,0.2)'}`,
                borderRadius: 12, padding: '12px 14px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {/* Avatar */}
                  <div style={{
                    width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                    background: isPaid ? 'rgba(0,200,83,0.15)' : 'rgba(214,40,40,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-familjen, system-ui)',
                    fontSize: 13, fontWeight: 700,
                    color: isPaid ? 'var(--xa-green, #00C853)' : 'var(--xa-red, #D62828)',
                  }}>
                    {initiales(d.client_nom)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{
                        fontFamily: 'var(--font-familjen, system-ui)',
                        fontSize: 13, fontWeight: 700, color: 'var(--xa-ink)',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        maxWidth: '55%',
                      }}>{d.client_nom}</div>
                      <div style={{
                        fontFamily: 'var(--font-plex-mono, monospace)',
                        fontSize: 13, fontWeight: 700,
                        color: isPaid ? 'var(--xa-green, #00C853)' : 'var(--xa-red, #D62828)',
                      }}>{isPaid ? '✓ Soldé' : `${fmtMontant(d.reste_a_payer)} F`}</div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                      <div style={{ fontSize: 10, color: 'var(--xa-muted)' }}>
                        {fmtDate(d.created_at)} · {fmtMontant(d.montant_total)} F total
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--xa-muted)' }}>
                        payé {fmtMontant(d.montant_recu)} F
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div style={{
                      marginTop: 6, height: 4, borderRadius: 4,
                      background: 'var(--xa-border)',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        height: '100%', borderRadius: 4,
                        width: `${Math.min(100, pct)}%`,
                        background: isPaid ? 'var(--xa-green, #00C853)' : 'var(--xa-red, #D62828)',
                        transition: 'width .4s ease',
                      }} />
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
