'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import type { AlertesStockData, AlerteStockRow } from '@/lib/supabase/getAlertesStock';

type AlertesStockPageProps = {
  data: AlertesStockData;
};

type StatutFilter = 'tous' | 'rupture' | 'bas';

export default function AlertesStockPage({ data }: AlertesStockPageProps) {
  const [statutFilter, setStatutFilter] = useState<StatutFilter>('tous');
  const [boutiqueFilter, setBoutiqueFilter] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedSearch(search), 200);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [search]);

  // Unique boutiques from alertes
  const boutiques = Array.from(
    new Map(data.alertes.map((a) => [a.boutique_id, { id: a.boutique_id, nom: a.boutique_nom }])).values(),
  );

  const hasFilters = statutFilter !== 'tous' || boutiqueFilter !== '' || debouncedSearch !== '';

  const filtered = data.alertes.filter((a) => {
    if (statutFilter !== 'tous' && a.statut !== statutFilter) return false;
    if (boutiqueFilter && a.boutique_id !== boutiqueFilter) return false;
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      if (!a.nom.toLowerCase().includes(q) && !a.categorie.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-xa-text">⚠️ Alertes Stock</h1>
        <p className="text-sm text-xa-muted mt-0.5">
          Produits en rupture ou sous le seuil d&apos;alerte
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div
          className="bg-xa-surface border border-xa-border rounded-xl p-3"
          style={{ animation: 'xa-fade-up 0.4s ease both' }}
        >
          <p className="text-xs font-semibold text-xa-muted uppercase tracking-wider mb-1">Ruptures</p>
          <p className="text-lg font-bold text-xa-danger">{data.nb_ruptures}</p>
        </div>
        <div
          className="bg-xa-surface border border-xa-border rounded-xl p-3"
          style={{ animation: 'xa-fade-up 0.4s ease both', animationDelay: '0.05s' }}
        >
          <p className="text-xs font-semibold text-xa-muted uppercase tracking-wider mb-1">Stock bas</p>
          <p className="text-lg font-bold text-yellow-500">{data.nb_bas}</p>
        </div>
        <div
          className="bg-xa-surface border border-xa-border rounded-xl p-3"
          style={{ animation: 'xa-fade-up 0.4s ease both', animationDelay: '0.1s' }}
        >
          <p className="text-xs font-semibold text-xa-muted uppercase tracking-wider mb-1">Total alertes</p>
          <p className="text-lg font-bold text-xa-text">{data.alertes.length}</p>
        </div>
      </div>

      {/* État vide global */}
      {data.alertes.length === 0 ? (
        <div className="bg-xa-surface border border-xa-border rounded-xl p-12 text-center">
          <p className="text-3xl mb-3">✅</p>
          <p className="font-semibold text-xa-text">Tous les stocks sont suffisants</p>
          <p className="text-sm text-xa-muted mt-1">Aucun produit en rupture ou sous seuil d&apos;alerte.</p>
        </div>
      ) : (
        <>
          {/* Filtres */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Statut toggle */}
            <div className="flex rounded-lg border border-xa-border overflow-hidden">
              {(['tous', 'rupture', 'bas'] as StatutFilter[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatutFilter(s)}
                  className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                    statutFilter === s
                      ? 'bg-xa-primary text-white'
                      : 'text-xa-muted hover:bg-xa-bg'
                  }`}
                >
                  {s === 'tous' ? 'Tous' : s === 'rupture' ? 'Ruptures' : 'Stock bas'}
                </button>
              ))}
            </div>

            {/* Boutique dropdown (only if > 1) */}
            {boutiques.length > 1 && (
              <select
                value={boutiqueFilter}
                onChange={(e) => setBoutiqueFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-xs focus:outline-none focus:ring-2 focus:ring-xa-primary"
              >
                <option value="">Toutes les boutiques</option>
                {boutiques.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.nom}
                  </option>
                ))}
              </select>
            )}

            {/* Recherche */}
            <input
              type="text"
              placeholder="Rechercher un produit…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-xs focus:outline-none focus:ring-2 focus:ring-xa-primary min-w-[180px]"
            />

            {/* Réinitialiser */}
            {hasFilters && (
              <button
                onClick={() => {
                  setStatutFilter('tous');
                  setBoutiqueFilter('');
                  setSearch('');
                }}
                className="px-3 py-1.5 rounded-lg border border-xa-border text-xa-muted text-xs hover:bg-xa-bg transition-colors"
              >
                Réinitialiser
              </button>
            )}
          </div>

          {/* Tableau */}
          {filtered.length === 0 ? (
            <div className="bg-xa-surface border border-xa-border rounded-xl p-12 text-center">
              <p className="text-xa-muted">Aucun résultat pour ces filtres.</p>
            </div>
          ) : (
            <div className="bg-xa-surface border border-xa-border rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-xa-border bg-xa-bg">
                      {['Produit', 'Catégorie', 'Boutique', 'Stock actuel', 'Seuil alerte', 'Statut', 'Action'].map(
                        (h) => (
                          <th
                            key={h}
                            className="text-left px-4 py-2.5 text-xs font-semibold text-xa-muted uppercase tracking-wider"
                          >
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((a) => (
                      <AlerteRow key={a.id} alerte={a} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function AlerteRow({ alerte: a }: { alerte: AlerteStockRow }) {
  return (
    <tr className="border-b border-xa-border last:border-0 hover:bg-xa-bg transition-colors">
      <td className="px-4 py-3 font-medium text-xa-text">{a.nom}</td>
      <td className="px-4 py-3 text-xa-muted">{a.categorie}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: a.boutique_couleur }}
          />
          <span className="text-xa-text">{a.boutique_nom}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={`font-bold ${a.stock_actuel === 0 ? 'text-xa-danger' : 'text-yellow-500'}`}>
          {a.stock_actuel}
        </span>
      </td>
      <td className="px-4 py-3 text-xa-muted">{a.seuil_alerte}</td>
      <td className="px-4 py-3">
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            a.statut === 'rupture'
              ? 'bg-xa-danger/20 text-xa-danger'
              : 'bg-yellow-500/20 text-yellow-500'
          }`}
        >
          {a.statut === 'rupture' ? 'Rupture' : 'Stock bas'}
        </span>
      </td>
      <td className="px-4 py-3">
        <Link
          href={`/dashboard/produits?boutique=${a.boutique_id}`}
          className="px-3 py-1 rounded-lg border border-xa-border text-xa-text text-xs font-semibold hover:bg-xa-bg transition-colors whitespace-nowrap"
        >
          Réapprovisionner
        </Link>
      </td>
    </tr>
  );
}
