'use client';

import { useState, useMemo } from 'react';
import { formatFCFA } from '@/lib/format';
import type { ProduitPublic } from '@/types/database';
import type { EmployeSession } from '@/lib/employe-session';

type ProduitComplet = ProduitPublic & { prix_achat?: number };

type Props = {
  produits: ProduitComplet[];
  session: EmployeSession;
};

export default function EmployeStockPage({ produits, session }: Props) {
  const [recherche, setRecherche] = useState('');
  const [categorieFiltre, setCategorieFiltre] = useState('Tout');

  const categories = useMemo(() => {
    const cats = [...new Set(produits.map((p) => p.categorie).filter(Boolean))].sort();
    return ['Tout', ...cats];
  }, [produits]);

  const filtered = useMemo(() => {
    return produits.filter((p) => {
      const matchSearch =
        !recherche ||
        p.nom.toLowerCase().includes(recherche.toLowerCase()) ||
        p.categorie?.toLowerCase().includes(recherche.toLowerCase());
      const matchCat = categorieFiltre === 'Tout' || p.categorie === categorieFiltre;
      return matchSearch && matchCat;
    });
  }, [produits, recherche, categorieFiltre]);

  const isGerant = session.role === 'gerant';

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
          📦 Stock
        </h1>
        <p
          style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 13,
            color: 'var(--c-muted, #6b7280)',
            margin: '4px 0 0',
          }}
        >
          {session.boutique_nom} · {produits.length} produit{produits.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Filters */}
      <div
        style={{
          display: 'flex',
          gap: 10,
          marginBottom: 16,
          flexWrap: 'wrap',
        }}
      >
        <input
          type="search"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher…"
          style={{
            flex: 1,
            minWidth: 180,
            padding: '8px 12px',
            borderRadius: 10,
            border: '1px solid var(--c-rule2, #e5e7eb)',
            background: 'var(--c-bg, #f9fafb)',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 13,
            color: 'var(--c-ink, #0a120a)',
            outline: 'none',
          }}
        />
        <select
          value={categorieFiltre}
          onChange={(e) => setCategorieFiltre(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: 10,
            border: '1px solid var(--c-rule2, #e5e7eb)',
            background: 'var(--c-bg, #f9fafb)',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 13,
            color: 'var(--c-ink, #0a120a)',
            outline: 'none',
          }}
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Stock table */}
      <div
        style={{
          background: 'var(--c-surface, #fff)',
          border: '1px solid var(--c-rule2, #e5e7eb)',
          borderRadius: 16,
          overflow: 'hidden',
        }}
      >
        {filtered.length === 0 ? (
          <div
            style={{
              padding: 40,
              textAlign: 'center',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 14,
              color: 'var(--c-muted, #6b7280)',
            }}
          >
            Aucun produit trouvé.
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
                  <th
                    style={{
                      padding: '10px 14px',
                      textAlign: 'left',
                      fontFamily: 'Space Mono, monospace',
                      fontSize: 10,
                      fontWeight: 700,
                      color: 'var(--c-muted, #6b7280)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    Produit
                  </th>
                  <th
                    style={{
                      padding: '10px 14px',
                      textAlign: 'left',
                      fontFamily: 'Space Mono, monospace',
                      fontSize: 10,
                      fontWeight: 700,
                      color: 'var(--c-muted, #6b7280)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    Catégorie
                  </th>
                  <th
                    style={{
                      padding: '10px 14px',
                      textAlign: 'right',
                      fontFamily: 'Space Mono, monospace',
                      fontSize: 10,
                      fontWeight: 700,
                      color: 'var(--c-muted, #6b7280)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    Prix vente
                  </th>
                  {isGerant && (
                    <th
                      style={{
                        padding: '10px 14px',
                        textAlign: 'right',
                        fontFamily: 'Space Mono, monospace',
                        fontSize: 10,
                        fontWeight: 700,
                        color: 'var(--c-muted, #6b7280)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                      }}
                    >
                      Prix achat
                    </th>
                  )}
                  <th
                    style={{
                      padding: '10px 14px',
                      textAlign: 'right',
                      fontFamily: 'Space Mono, monospace',
                      fontSize: 10,
                      fontWeight: 700,
                      color: 'var(--c-muted, #6b7280)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    Stock
                  </th>
                  <th
                    style={{
                      padding: '10px 14px',
                      textAlign: 'left',
                      fontFamily: 'Space Mono, monospace',
                      fontSize: 10,
                      fontWeight: 700,
                      color: 'var(--c-muted, #6b7280)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    État
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, idx) => {
                  const isLow = p.stock_actuel <= p.seuil_alerte && p.stock_actuel > 0;
                  const isOut = p.stock_actuel === 0;
                  return (
                    <tr
                      key={p.id}
                      style={{
                        background: idx % 2 === 0 ? 'transparent' : 'var(--c-bg, #f9fafb)',
                        borderBottom: '1px solid var(--c-rule2, #e5e7eb)',
                      }}
                    >
                      <td
                        style={{
                          padding: '10px 14px',
                          fontFamily: 'DM Sans, sans-serif',
                          fontWeight: 600,
                          color: 'var(--c-ink, #0a120a)',
                        }}
                      >
                        {p.nom}
                      </td>
                      <td
                        style={{
                          padding: '10px 14px',
                          fontFamily: 'Space Mono, monospace',
                          fontSize: 11,
                          color: 'var(--c-muted, #6b7280)',
                        }}
                      >
                        {p.categorie}
                      </td>
                      <td
                        style={{
                          padding: '10px 14px',
                          textAlign: 'right',
                          fontFamily: 'Space Mono, monospace',
                          fontSize: 12,
                          color: 'var(--c-ink, #0a120a)',
                          fontWeight: 700,
                        }}
                      >
                        {formatFCFA(p.prix_vente)}
                      </td>
                      {isGerant && (
                        <td
                          style={{
                            padding: '10px 14px',
                            textAlign: 'right',
                            fontFamily: 'Space Mono, monospace',
                            fontSize: 12,
                            color: 'var(--c-muted, #6b7280)',
                          }}
                        >
                          {p.prix_achat !== undefined ? formatFCFA(p.prix_achat) : '—'}
                        </td>
                      )}
                      <td
                        style={{
                          padding: '10px 14px',
                          textAlign: 'right',
                          fontFamily: 'Space Mono, monospace',
                          fontSize: 13,
                          fontWeight: 700,
                          color: isOut
                            ? '#ff3341'
                            : isLow
                            ? '#f59e0b'
                            : 'var(--c-ink, #0a120a)',
                        }}
                      >
                        {p.stock_actuel} {p.unite}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        {isOut ? (
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: 999,
                              background: 'rgba(255,51,65,.12)',
                              color: '#ff3341',
                              fontFamily: 'Space Mono, monospace',
                              fontSize: 9,
                              fontWeight: 700,
                            }}
                          >
                            RUPTURE
                          </span>
                        ) : isLow ? (
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: 999,
                              background: 'rgba(245,158,11,.12)',
                              color: '#d97706',
                              fontFamily: 'Space Mono, monospace',
                              fontSize: 9,
                              fontWeight: 700,
                            }}
                          >
                            FAIBLE
                          </span>
                        ) : (
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: 999,
                              background: 'rgba(0,200,83,.10)',
                              color: '#00a048',
                              fontFamily: 'Space Mono, monospace',
                              fontSize: 9,
                              fontWeight: 700,
                            }}
                          >
                            OK
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
