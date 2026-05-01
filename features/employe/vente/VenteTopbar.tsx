'use client';

import type { VenteKpi, BoutiqueInfo, EmployeInfo } from './types';

interface Props {
  kpi: VenteKpi;
  boutique: BoutiqueInfo;
  employe: EmployeInfo;
}

export default function VenteTopbar({ kpi, boutique, employe }: Props) {
  // Formatter FCFA
  const fmt = (n: number) =>
    n >= 1_000_000
      ? (n / 1_000_000).toFixed(1) + 'M'
      : n >= 1_000
      ? (n / 1_000).toFixed(1) + 'k'
      : n.toString();

  return (
    <div style={{ background: 'var(--xa-ink)', flexShrink: 0 }}>
      {/* Row 1 : logo + boutique + settings */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 18px 12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            background: 'var(--xa-green)', color: 'var(--xa-ink)',
            fontFamily: 'var(--font-familjen, system-ui)',
            fontSize: 10, fontWeight: 900, padding: '4px 8px',
            borderRadius: 7, letterSpacing: 2, flexShrink: 0,
          }}>xà</div>
          <div>
            <div style={{
              fontFamily: 'var(--font-familjen, system-ui)',
              fontSize: 13, fontWeight: 700, color: 'white', lineHeight: 1.2,
            }}>{boutique.nom}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,.5)', marginTop: 1 }}>
              {boutique.ville ?? ''} · {employe.prenom}
            </div>
          </div>
        </div>
        <div style={{ fontSize: 18 }}>📊</div>
      </div>

      {/* KPI strip */}
      <div style={{
        display: 'flex', gap: 8, padding: '0 18px 14px',
        overflowX: 'auto', scrollbarWidth: 'none',
      }}>
        {/* CA jour */}
        <div style={{
          flex: 1, background: 'rgba(0,200,83,.18)', border: '1px solid rgba(0,200,83,.25)',
          borderRadius: 12, padding: '10px 12px', minWidth: 90,
        }}>
          <div style={{
            fontFamily: 'var(--font-plex-mono, monospace)',
            fontSize: 16, fontWeight: 700, color: 'var(--xa-green)', lineHeight: 1,
          }}>{fmt(kpi.ca_jour)}</div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,.5)', marginTop: 3, textTransform: 'uppercase', letterSpacing: '.5px' }}>CA aujourd&apos;hui</div>
        </div>

        {/* Nb ventes */}
        <div style={{
          flex: 1, background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.1)',
          borderRadius: 12, padding: '10px 12px', minWidth: 70,
        }}>
          <div style={{
            fontFamily: 'var(--font-plex-mono, monospace)',
            fontSize: 16, fontWeight: 700, color: 'white', lineHeight: 1,
          }}>{kpi.nb_ventes_jour}</div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,.5)', marginTop: 3, textTransform: 'uppercase', letterSpacing: '.5px' }}>Ventes</div>
        </div>

        {/* Dettes */}
        <div style={{
          flex: 1, background: 'rgba(214,40,40,.2)', border: '1px solid rgba(214,40,40,.3)',
          borderRadius: 12, padding: '10px 12px', minWidth: 90,
        }}>
          <div style={{
            fontFamily: 'var(--font-plex-mono, monospace)',
            fontSize: 16, fontWeight: 700, color: 'var(--xa-red)', lineHeight: 1,
          }}>{fmt(kpi.total_dettes)}</div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,.5)', marginTop: 3, textTransform: 'uppercase', letterSpacing: '.5px' }}>Dettes</div>
        </div>
      </div>
    </div>
  );
}
