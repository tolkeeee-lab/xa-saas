'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import type { AlertesStockData, AlerteStockRow } from '@/lib/supabase/getAlertesStock';
import StatCard from './StatCard';

interface AlertesStockPageProps {
  data: AlertesStockData;
}

type FiltreStatut = 'tous' | 'rupture' | 'bas';

function StatutBadge({ statut }: { statut: AlerteStockRow['statut'] }) {
  if (statut === 'rupture') {
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-xa-danger/20 text-xa-danger">
        Rupture
      </span>
    );
  }
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-500">
      Stock bas
    </span>
  );
}

export default function AlertesStockPage({ data }: AlertesStockPageProps) {
  const { alertes, nb_ruptures, nb_bas } = data;

  const [filtreStatut, setFiltreStatut] = useState<FiltreStatut>('tous');
  const [filtreBoutique, setFiltreBoutique] = useState<string>('toutes');
  const [recherche, setRecherche] = useState('');
  const [rechercheDebounced, setRechercheDebounced] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setRechercheDebounced(recherche), 200);
    return () => clearTimeout(timer);
  }, [recherche]);

  const boutiquesUniques = Array.from(
    new Map(alertes.map((a) => [a.boutique_id, { id: a.boutique_id, nom: a.boutique_nom, couleur: a.boutique_couleur }])).values(),
  );

  const filtrer = useCallback(
    (row: AlerteStockRow): boolean => {
      if (filtreStatut !== 'tous' && row.statut !== filtreStatut) return false;
      if (filtreBoutique !== 'toutes' && row.boutique_id !== filtreBoutique) return false;
      if (rechercheDebounced) {
        const q = rechercheDebounced.toLowerCase();
        if (!row.nom.toLowerCase().includes(q) && !row.categorie.toLowerCase().includes(q)) return false;
      }
      return true;
    },
    [filtreStatut, filtreBoutique, rechercheDebounced],
  );

  const alertesFiltrees = alertes.filter(filtrer);

  return (
    <div className="space-y-5">
      {/* En-tête */}
      <div>
        <h2 className="text-xl font-bold text-xa-text">🚨 Alertes Stock</h2>
        <p className="text-sm text-xa-muted mt-0.5">Produits en rupture ou sous seuil d&apos;alerte</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="En rupture"
          value={nb_ruptures}
          emoji="🔴"
          color="#ff3341"
          animate
        />
        <StatCard
          title="Stock bas"
          value={nb_bas}
          emoji="🟡"
          color="#eab308"
          animate
        />
        <StatCard
          title="Total alertes"
          value={alertes.length}
          emoji="⚠️"
          accent
          animate
        />
      </div>

      {/* Filtres */}
      <div className="bg-xa-surface border border-xa-border rounded-xl p-4 flex flex-wrap gap-3 items-center">
        {/* Filtre statut */}
        <div className="flex items-center gap-1">
          {(['tous', 'rupture', 'bas'] as FiltreStatut[]).map((s) => (
            <button
              key={s}
              onClick={() => setFiltreStatut(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filtreStatut === s
                  ? 'bg-xa-primary text-white'
                  : 'text-xa-muted hover:bg-xa-bg'
              }`}
            >
              {s === 'tous' ? 'Tous' : s === 'rupture' ? 'Ruptures uniquement' : 'Stock bas uniquement'}
            </button>
          ))}
        </div>

        {/* Filtre boutique (si plusieurs) */}
        {boutiquesUniques.length > 1 && (
          <select
            value={filtreBoutique}
            onChange={(e) => setFiltreBoutique(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-xs bg-xa-bg border border-xa-border text-xa-text focus:outline-none focus:ring-1 focus:ring-xa-primary"
          >
            <option value="toutes">Toutes les boutiques</option>
            {boutiquesUniques.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nom}
              </option>
            ))}
          </select>
        )}

        {/* Recherche */}
        <div className="flex-1 min-w-[160px]">
          <input
            type="text"
            placeholder="Rechercher un produit…"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg text-xs bg-xa-bg border border-xa-border text-xa-text placeholder:text-xa-muted focus:outline-none focus:ring-1 focus:ring-xa-primary"
          />
        </div>
      </div>

      {/* Tableau ou état vide */}
      {alertesFiltrees.length === 0 ? (
        <div className="bg-xa-surface border border-xa-border rounded-xl p-10 flex flex-col items-center gap-3 text-center">
          {alertes.length === 0 ? (
            <>
              <span className="text-5xl">✅</span>
              <p className="text-base font-semibold text-xa-text">
                Tous vos stocks sont en bonne santé !
              </p>
              <p className="text-sm text-xa-muted">Aucun produit en rupture ou sous seuil d&apos;alerte.</p>
            </>
          ) : (
            <>
              <span className="text-4xl">🔍</span>
              <p className="text-sm text-xa-muted">Aucun résultat pour ces filtres.</p>
            </>
          )}
        </div>
      ) : (
        <div className="bg-xa-surface border border-xa-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-xa-border">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-xa-muted uppercase tracking-wider">
                    Produit
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-xa-muted uppercase tracking-wider">
                    Catégorie
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-xa-muted uppercase tracking-wider">
                    Boutique
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-xa-muted uppercase tracking-wider">
                    Stock actuel
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-xa-muted uppercase tracking-wider">
                    Seuil d&apos;alerte
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-xa-muted uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-xa-muted uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {alertesFiltrees.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-xa-border/50 last:border-b-0 hover:bg-xa-bg/50 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-xa-text">{row.nom}</td>
                    <td className="px-4 py-3 text-xa-muted">{row.categorie}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: row.boutique_couleur }}
                        />
                        <span className="text-xa-text">{row.boutique_nom}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold text-xa-text">
                      {row.stock_actuel}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-xa-muted">
                      {row.seuil_alerte}
                    </td>
                    <td className="px-4 py-3">
                      <StatutBadge statut={row.statut} />
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href="/dashboard/produits"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-xa-primary/10 text-xa-primary hover:bg-xa-primary/20 transition-colors"
                      >
                        Réapprovisionner
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
