'use client';

import { useState, useEffect } from 'react';
import { formatFCFA } from '@/lib/format';
import type { Boutique, ProduitPublic } from '@/types/database';
import type { StocksConsolidesData, StockConsolideRow } from '@/lib/supabase/getStocksConsolides';
import AddProduitModal from './AddProduitModal';

type StockStatus = 'ok' | 'bas' | 'rupture';

function StatusBadge({ statut }: { statut: StockStatus }) {
  if (statut === 'rupture') {
    return <span className="text-xs font-semibold text-xa-danger">Rupture</span>;
  }
  if (statut === 'bas') {
    return <span className="text-xs font-semibold text-yellow-500">Stock bas</span>;
  }
  return <span className="text-xs font-semibold text-green-500">OK</span>;
}

function StockCell({ value, seuil_alerte }: { value: number; seuil_alerte: number }) {
  let color = 'text-xa-text';
  if (value === 0) color = 'text-xa-danger font-semibold';
  else if (value <= seuil_alerte) color = 'text-yellow-500 font-semibold';
  return <span className={color}>{value}</span>;
}

interface StocksTableProps {
  data: StocksConsolidesData;
  boutiques: Boutique[];
}

export default function StocksTable({ data, boutiques }: StocksTableProps) {
  const [showModal, setShowModal] = useState(false);
  const [filterBoutique, setFilterBoutique] = useState<string>('all');
  const [rows, setRows] = useState<StockConsolideRow[]>(data.produits);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput.toLowerCase().trim());
    }, 200);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const statCards = [
    {
      label: 'Références',
      value: data.totalRefs,
      icon: '📦',
      color: 'text-xa-primary',
    },
    {
      label: 'Valeur réseau',
      value: formatFCFA(data.valeurReseau),
      icon: '💰',
      color: 'text-green-500',
    },
    {
      label: 'Ruptures',
      value: data.ruptures,
      icon: '🔴',
      color: 'text-xa-danger',
    },
    {
      label: 'Stocks bas',
      value: data.stocksBas,
      icon: '🟠',
      color: 'text-yellow-500',
    },
  ];

  // Filter boutique columns
  const visibleBoutiques =
    filterBoutique === 'all'
      ? data.boutiques
      : data.boutiques.filter((b) => b.id === filterBoutique);

  // Filter rows by search query
  const filteredRows = searchQuery
    ? rows.filter(
        (p) =>
          p.nom.toLowerCase().includes(searchQuery) ||
          p.categorie.toLowerCase().includes(searchQuery),
      )
    : rows;

  function handleProduitAdded(produit: ProduitPublic) {
    // Add a new row to the local state for immediate UI update
    const newRow: StockConsolideRow = {
      id: produit.id,
      nom: produit.nom,
      categorie: produit.categorie ?? 'Général',
      stocks: { [produit.boutique_id]: produit.stock_actuel },
      total: produit.stock_actuel,
      seuil_alerte: produit.seuil_alerte,
      statut: produit.stock_actuel === 0 ? 'rupture' : produit.stock_actuel <= produit.seuil_alerte ? 'bas' : 'ok',
    };
    setRows((prev) => [...prev, newRow]);
    setShowModal(false);
  }

  return (
    <div className="space-y-5">
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map((card) => (
          <div key={card.label} className="bg-xa-surface border border-xa-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <span>{card.icon}</span>
              <span className="text-xs text-xa-muted">{card.label}</span>
            </div>
            <p className={`text-xl font-bold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Table header + actions */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={filterBoutique}
          onChange={(e) => setFilterBoutique(e.target.value)}
          className="px-3 py-2 rounded-lg border border-xa-border bg-xa-surface text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary"
        >
          <option value="all">Toutes les boutiques</option>
          {data.boutiques.map((b) => (
            <option key={b.id} value={b.id}>{b.nom}</option>
          ))}
        </select>

        <div className="relative flex-1 min-w-[200px]">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Rechercher un produit, une boutique…"
            className="w-full bg-xa-bg border border-xa-border rounded-xl px-4 py-2.5 text-sm text-xa-text placeholder-xa-muted focus:outline-none focus:ring-2 focus:ring-xa-primary pr-8"
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xa-muted hover:text-xa-text transition-colors"
              aria-label="Réinitialiser la recherche"
            >
              ✕
            </button>
          )}
        </div>

        <span className="text-xs text-xa-muted whitespace-nowrap">
          {filteredRows.length} produit(s)
        </span>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-xa-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Produit
        </button>
      </div>

      {/* Table */}
      {filteredRows.length === 0 ? (
        <div className="bg-xa-surface border border-xa-border rounded-xl p-12 text-center">
          <p className="text-xa-muted">Aucun produit trouvé.</p>
        </div>
      ) : (
        <div className="bg-xa-surface border border-xa-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-xa-border bg-xa-bg">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-xa-muted uppercase tracking-wider whitespace-nowrap">
                    Produit
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-xa-muted uppercase tracking-wider whitespace-nowrap">
                    Catégorie
                  </th>
                  {visibleBoutiques.map((b) => (
                    <th
                      key={b.id}
                      className="text-center px-3 py-3 text-xs font-semibold text-xa-muted uppercase tracking-wider whitespace-nowrap"
                    >
                      {b.nom}
                    </th>
                  ))}
                  <th className="text-center px-3 py-3 text-xs font-semibold text-xa-muted uppercase tracking-wider">
                    Total
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-xa-muted uppercase tracking-wider">
                    Statut
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-xa-border last:border-0 hover:bg-xa-bg transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-xa-text">{row.nom}</td>
                    <td className="px-4 py-3 text-xa-muted">{row.categorie}</td>
                    {visibleBoutiques.map((b) => (
                      <td key={b.id} className="px-3 py-3 text-center">
                        <StockCell
                          value={row.stocks[b.id] ?? 0}
                          seuil_alerte={row.seuil_alerte}
                        />
                      </td>
                    ))}
                    <td className="px-3 py-3 text-center font-semibold text-xa-text">
                      {row.total}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge statut={row.statut} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add product modal */}
      {showModal && (
        <AddProduitModal
          boutiques={boutiques}
          defaultBoutiqueId={filterBoutique !== 'all' ? filterBoutique : boutiques[0]?.id}
          onClose={() => setShowModal(false)}
          onSuccess={handleProduitAdded}
        />
      )}
    </div>
  );
}
