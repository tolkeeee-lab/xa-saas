'use client';

import { useState } from 'react';
import { formatFCFA } from '@/lib/format';
import type { VenteEmploye, VentesEmployeData } from '@/lib/supabase/getVentesForEmploye';
import type { EmployeSession } from '@/lib/employe-session';

type DateFilter = 'today' | '7d' | '30d';

type Props = {
  initialData: VentesEmployeData;
  session: EmployeSession;
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function nDaysAgoISO(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

const MODE_LABELS: Record<string, string> = {
  especes: '💵 Espèces',
  momo: '📱 Mobile Money',
  carte: '💳 Carte',
  credit: '📝 Crédit',
};

export default function EmployeVentesPage({ initialData, session }: Props) {
  const [data, setData] = useState<VentesEmployeData>(initialData);
  const [dateFilter, setDateFilter] = useState<DateFilter>('today');
  const [mesVentes, setMesVentes] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedVente, setSelectedVente] = useState<VenteEmploye | null>(null);

  async function fetchVentes(filter: DateFilter, myOnly: boolean) {
    setLoading(true);
    const today = todayISO();
    let date_start = today;
    let date_end = today;

    if (filter === '7d') date_start = nDaysAgoISO(7);
    else if (filter === '30d') date_start = nDaysAgoISO(30);

    const params = new URLSearchParams({
      date_start,
      date_end,
      ...(myOnly ? { mes_ventes: '1' } : {}),
    });

    try {
      const res = await fetch(`/api/employe/ventes?${params.toString()}`);
      if (res.ok) {
        const json = (await res.json()) as VentesEmployeData;
        setData(json);
      }
    } catch {
      // keep existing data
    } finally {
      setLoading(false);
    }
  }

  function handleFilterChange(filter: DateFilter) {
    setDateFilter(filter);
    void fetchVentes(filter, mesVentes);
  }

  function handleMesVentesChange(val: boolean) {
    setMesVentes(val);
    void fetchVentes(dateFilter, val);
  }

  const DATE_FILTER_LABELS: Record<DateFilter, string> = {
    today: "Aujourd'hui",
    '7d': '7 derniers jours',
    '30d': '30 derniers jours',
  };

  return (
    <div style={{ padding: '16px 16px 80px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1
          style={{
            fontFamily: '"Black Han Sans", sans-serif',
            fontSize: 22,
            color: 'var(--c-ink, #0a120a)',
            margin: 0,
          }}
        >
          📜 Ventes
        </h1>
        <p
          style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 13,
            color: 'var(--c-muted, #6b7280)',
            margin: '4px 0 0',
          }}
        >
          {session.boutique_nom}
        </p>
      </div>

      {/* KPI bar */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          marginBottom: 16,
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            flex: 1,
            minWidth: 140,
            background: 'var(--c-surface, #fff)',
            border: '1px solid var(--c-rule2, #e5e7eb)',
            borderRadius: 14,
            padding: '14px 18px',
          }}
        >
          <p
            style={{
              fontFamily: 'Space Mono, monospace',
              fontSize: 10,
              fontWeight: 700,
              color: 'var(--c-muted, #6b7280)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              margin: '0 0 6px',
            }}
          >
            CA {DATE_FILTER_LABELS[dateFilter]}
          </p>
          <p
            style={{
              fontFamily: '"Black Han Sans", sans-serif',
              fontSize: 22,
              color: 'var(--c-accent, #00c853)',
              margin: 0,
            }}
          >
            {formatFCFA(data.total_ca)}
          </p>
        </div>
        <div
          style={{
            flex: 1,
            minWidth: 140,
            background: 'var(--c-surface, #fff)',
            border: '1px solid var(--c-rule2, #e5e7eb)',
            borderRadius: 14,
            padding: '14px 18px',
          }}
        >
          <p
            style={{
              fontFamily: 'Space Mono, monospace',
              fontSize: 10,
              fontWeight: 700,
              color: 'var(--c-muted, #6b7280)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              margin: '0 0 6px',
            }}
          >
            Transactions
          </p>
          <p
            style={{
              fontFamily: '"Black Han Sans", sans-serif',
              fontSize: 22,
              color: 'var(--c-ink, #0a120a)',
              margin: 0,
            }}
          >
            {data.total_ventes}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          marginBottom: 16,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        {(['today', '7d', '30d'] as DateFilter[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => handleFilterChange(f)}
            style={{
              padding: '6px 14px',
              borderRadius: 999,
              border: '1px solid',
              borderColor:
                dateFilter === f ? 'var(--c-accent, #00c853)' : 'var(--c-rule2, #e5e7eb)',
              background: dateFilter === f ? 'rgba(0,200,83,.10)' : 'var(--c-surface, #fff)',
              color:
                dateFilter === f ? 'var(--c-accent, #00c853)' : 'var(--c-muted, #6b7280)',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {DATE_FILTER_LABELS[f]}
          </button>
        ))}
        <button
          type="button"
          onClick={() => handleMesVentesChange(!mesVentes)}
          style={{
            padding: '6px 14px',
            borderRadius: 999,
            border: '1px solid',
            borderColor: mesVentes ? 'var(--c-accent, #00c853)' : 'var(--c-rule2, #e5e7eb)',
            background: mesVentes ? 'rgba(0,200,83,.10)' : 'var(--c-surface, #fff)',
            color: mesVentes ? 'var(--c-accent, #00c853)' : 'var(--c-muted, #6b7280)',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Mes ventes
        </button>
      </div>

      {/* Table */}
      <div
        style={{
          background: 'var(--c-surface, #fff)',
          border: '1px solid var(--c-rule2, #e5e7eb)',
          borderRadius: 16,
          overflow: 'hidden',
        }}
      >
        {loading ? (
          <div
            style={{
              padding: 40,
              textAlign: 'center',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 14,
              color: 'var(--c-muted, #6b7280)',
            }}
          >
            Chargement…
          </div>
        ) : data.ventes.length === 0 ? (
          <div
            style={{
              padding: 40,
              textAlign: 'center',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 14,
              color: 'var(--c-muted, #6b7280)',
            }}
          >
            Aucune vente pour cette période.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr
                  style={{
                    background: 'var(--c-bg, #f9fafb)',
                    borderBottom: '1px solid var(--c-rule2, #e5e7eb)',
                  }}
                >
                  {['Heure', 'Client', 'Mode', 'Total'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '10px 14px',
                        textAlign: h === 'Total' ? 'right' : 'left',
                        fontFamily: 'Space Mono, monospace',
                        fontSize: 10,
                        fontWeight: 700,
                        color: 'var(--c-muted, #6b7280)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.ventes.map((v, idx) => {
                  const heure = new Date(v.created_at).toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  return (
                    <tr
                      key={v.id}
                      onClick={() => setSelectedVente(v)}
                      style={{
                        background: idx % 2 === 0 ? 'transparent' : 'var(--c-bg, #f9fafb)',
                        borderBottom: '1px solid var(--c-rule2, #e5e7eb)',
                        cursor: 'pointer',
                      }}
                    >
                      <td
                        style={{
                          padding: '10px 14px',
                          fontFamily: 'Space Mono, monospace',
                          fontSize: 12,
                          color: 'var(--c-muted, #6b7280)',
                        }}
                      >
                        {heure}
                      </td>
                      <td
                        style={{
                          padding: '10px 14px',
                          fontFamily: 'DM Sans, sans-serif',
                          color: 'var(--c-ink, #0a120a)',
                        }}
                      >
                        {v.client_nom ?? '—'}
                      </td>
                      <td
                        style={{
                          padding: '10px 14px',
                          fontFamily: 'DM Sans, sans-serif',
                          fontSize: 12,
                          color: 'var(--c-muted, #6b7280)',
                        }}
                      >
                        {MODE_LABELS[v.mode_paiement] ?? v.mode_paiement}
                      </td>
                      <td
                        style={{
                          padding: '10px 14px',
                          textAlign: 'right',
                          fontFamily: 'Space Mono, monospace',
                          fontSize: 13,
                          fontWeight: 700,
                          color: 'var(--c-ink, #0a120a)',
                        }}
                      >
                        {formatFCFA(v.montant_total)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selectedVente && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,.5)',
            zIndex: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setSelectedVente(null)}
        >
          <div
            style={{
              background: 'var(--c-surface, #fff)',
              borderRadius: 20,
              padding: '24px 20px',
              maxWidth: 400,
              width: '100%',
              boxShadow: '0 8px 32px rgba(0,0,0,.15)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <h3
                style={{
                  fontFamily: '"Black Han Sans", sans-serif',
                  fontSize: 18,
                  color: 'var(--c-ink, #0a120a)',
                  margin: 0,
                }}
              >
                Détail vente
              </h3>
              <button
                type="button"
                onClick={() => setSelectedVente(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: 18,
                  cursor: 'pointer',
                  color: 'var(--c-muted, #6b7280)',
                }}
              >
                ✕
              </button>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 14,
                color: 'var(--c-ink, #0a120a)',
              }}
            >
              <div>
                <span style={{ color: 'var(--c-muted, #6b7280)', marginRight: 8 }}>
                  Client:
                </span>
                {selectedVente.client_nom ?? '—'}
              </div>
              <div>
                <span style={{ color: 'var(--c-muted, #6b7280)', marginRight: 8 }}>
                  Mode:
                </span>
                {MODE_LABELS[selectedVente.mode_paiement] ?? selectedVente.mode_paiement}
              </div>
              <div>
                <span style={{ color: 'var(--c-muted, #6b7280)', marginRight: 8 }}>
                  Total:
                </span>
                <strong style={{ color: 'var(--c-accent, #00c853)' }}>
                  {formatFCFA(selectedVente.montant_total)}
                </strong>
              </div>
              <div>
                <span style={{ color: 'var(--c-muted, #6b7280)', marginRight: 8 }}>
                  Heure:
                </span>
                {new Date(selectedVente.created_at).toLocaleString('fr-FR')}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
