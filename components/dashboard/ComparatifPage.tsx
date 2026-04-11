'use client';

import { formatFCFA } from '@/lib/format';
import type { BoutiqueComparatif, RuptureItem } from '@/lib/supabase/getComparatif';

type ComparatifPageProps = {
  boutiques: BoutiqueComparatif[];
  ruptures: RuptureItem[];
};

function getPerformanceBadge(marge: number) {
  if (marge >= 25) {
    return (
      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/20">
        Excellent
      </span>
    );
  }
  if (marge >= 15) {
    return (
      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-xa-primary/10 text-xa-primary">
        Bien
      </span>
    );
  }
  return (
    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/20">
      Moyen
    </span>
  );
}

export default function ComparatifPage({ boutiques, ruptures }: ComparatifPageProps) {
  const totalCA = boutiques.reduce((s, b) => s + b.ca, 0);
  const totalTx = boutiques.reduce((s, b) => s + b.nbTx, 0);
  const avgMarge =
    boutiques.length > 0
      ? Math.round(boutiques.reduce((s, b) => s + b.marge, 0) / boutiques.length)
      : 0;
  const avgPanier = totalTx > 0 ? Math.round(totalCA / totalTx) : 0;
  const bestBoutique = boutiques[0];
  const maxCA = bestBoutique?.ca ?? 1;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-xa-text">Comparatif boutiques</h1>
        <p className="text-sm text-xa-muted mt-0.5">
          Performance mensuelle de votre réseau
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-xa-surface border border-xa-border rounded-xl p-4">
          <p className="text-xs font-semibold text-xa-muted uppercase tracking-wider mb-1">
            Meilleure boutique
          </p>
          <p className="text-lg font-bold text-xa-text truncate">
            {bestBoutique?.nom ?? '—'}
          </p>
          {bestBoutique && (
            <p className="text-xs text-xa-muted mt-0.5">{formatFCFA(bestBoutique.ca)}</p>
          )}
        </div>
        <div className="bg-xa-surface border border-xa-border rounded-xl p-4">
          <p className="text-xs font-semibold text-xa-muted uppercase tracking-wider mb-1">
            Marge moy. réseau
          </p>
          <p className="text-2xl font-bold text-xa-text">{avgMarge}%</p>
        </div>
        <div className="bg-xa-surface border border-xa-border rounded-xl p-4">
          <p className="text-xs font-semibold text-xa-muted uppercase tracking-wider mb-1">
            Panier moyen
          </p>
          <p className="text-2xl font-bold text-xa-text">{formatFCFA(avgPanier)}</p>
        </div>
        <div className="bg-xa-primary/10 border border-xa-border rounded-xl p-4">
          <p className="text-xs font-semibold text-xa-muted uppercase tracking-wider mb-1">
            CA mensuel réseau
          </p>
          <p className="text-2xl font-bold text-xa-primary">{formatFCFA(totalCA)}</p>
        </div>
      </div>

      {/* Classement CA */}
      {boutiques.length > 0 && (
        <div className="bg-xa-surface border border-xa-border rounded-xl p-4">
          <h2 className="font-semibold text-xa-text text-sm mb-4">Classement CA mensuel</h2>
          <div className="space-y-3">
            {boutiques.map((b, i) => (
              <div key={b.id} className="flex items-center gap-3">
                <span className="text-xs font-bold text-xa-muted w-5 shrink-0">
                  {i + 1}.
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-xa-text truncate">{b.nom}</span>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span
                        className="text-xs font-semibold px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor: b.couleur_theme + '22',
                          color: b.couleur_theme,
                        }}
                      >
                        {b.marge}%
                      </span>
                      <span className="text-sm font-semibold text-xa-text">
                        {formatFCFA(b.ca)}
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-xa-border rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full transition-all"
                      style={{
                        width: `${Math.round((b.ca / maxCA) * 100)}%`,
                        backgroundColor: b.couleur_theme,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI table */}
      {boutiques.length > 0 && (
        <div className="bg-xa-surface border border-xa-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-xa-border">
            <h2 className="font-semibold text-xa-text text-sm">KPIs par boutique</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-xa-border bg-xa-bg">
                  {['Boutique', 'CA mois', 'Transactions', 'Panier moyen', 'Marge', 'Performance'].map(
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
                {boutiques.map((b) => (
                  <tr
                    key={b.id}
                    className="border-b border-xa-border last:border-0 hover:bg-xa-bg transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: b.couleur_theme }}
                        />
                        <span className="font-medium text-xa-text">{b.nom}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-xa-text">
                      {formatFCFA(b.ca)}
                    </td>
                    <td className="px-4 py-3 text-xa-text">{b.nbTx}</td>
                    <td className="px-4 py-3 text-xa-text">{formatFCFA(b.panierMoyen)}</td>
                    <td className="px-4 py-3 text-xa-text">{b.marge}%</td>
                    <td className="px-4 py-3">{getPerformanceBadge(b.marge)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Ruptures table */}
      <div className="bg-xa-surface border border-xa-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-xa-border">
          <h2 className="font-semibold text-xa-text text-sm">
            Ruptures de stock par boutique
          </h2>
        </div>
        {ruptures.length === 0 ? (
          <p className="text-xa-muted text-sm p-6 text-center">
            Aucune rupture de stock. 🎉
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-xa-border bg-xa-bg">
                  {['Boutique', 'Produit', 'Stock'].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-2.5 text-xs font-semibold text-xa-muted uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ruptures.map((r, i) => (
                  <tr
                    key={i}
                    className="border-b border-xa-border last:border-0 hover:bg-xa-bg transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: r.boutique_couleur }}
                        />
                        <span className="text-xa-text">{r.boutique_nom}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-xa-text">{r.produit_nom}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-xa-danger dark:bg-red-900/20">
                        {r.stock_actuel}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
