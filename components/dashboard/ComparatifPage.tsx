'use client';

import { useRouter, usePathname } from 'next/navigation';
import { formatFCFA } from '@/lib/format';
import type { BoutiqueComparatif, RuptureItem, ComparatifPeriode } from '@/lib/supabase/getComparatif';

type ComparatifPageProps = {
  boutiques: BoutiqueComparatif[];
  boutiquesLastPeriod: BoutiqueComparatif[];
  ruptures: RuptureItem[];
  periode: ComparatifPeriode;
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

const PODIUM_MEDALS = ['🥇', '🥈', '🥉'];

const PERIODE_LABELS: Record<ComparatifPeriode, string> = {
  ce_mois: 'Ce mois',
  mois_precedent: 'Mois précédent',
  '3_mois': '3 mois',
};

export default function ComparatifPage({
  boutiques,
  boutiquesLastPeriod,
  ruptures,
  periode,
}: ComparatifPageProps) {
  const router = useRouter();
  const pathname = usePathname();

  const totalCA = boutiques.reduce((s, b) => s + b.ca, 0);
  const totalTx = boutiques.reduce((s, b) => s + b.nbTx, 0);
  const avgMarge =
    boutiques.length > 0
      ? Math.round(boutiques.reduce((s, b) => s + b.marge, 0) / boutiques.length)
      : 0;
  const avgPanier = totalTx > 0 ? Math.round(totalCA / totalTx) : 0;
  const bestBoutique = boutiques[0];
  const maxCA = bestBoutique?.ca ?? 1;
  const maxBenef = Math.max(...boutiques.map((b) => b.benefice), 1);
  const maxCoutAchats = Math.max(...boutiques.map((b) => b.cout_achats), 1);

  // Progression / recul indicators vs last period
  const lastPeriodMap = new Map(boutiquesLastPeriod.map((b) => [b.id, b]));
  const withTrend = boutiques.map((b) => {
    const prev = lastPeriodMap.get(b.id);
    const prevCA = prev?.ca ?? 0;
    const diff = prevCA > 0 ? ((b.ca - prevCA) / prevCA) * 100 : 0;
    return { ...b, prevCA, diffPct: Math.round(diff) };
  });
  const enProgression = withTrend.filter((b) => b.diffPct > 0).sort((a, b) => b.diffPct - a.diffPct)[0];
  const enRecul = withTrend.filter((b) => b.diffPct < 0).sort((a, b) => a.diffPct - b.diffPct)[0];

  function setPeriode(p: ComparatifPeriode) {
    router.push(`${pathname}?periode=${p}`);
  }

  return (
    <div className="space-y-5">
      {/* Header + period selector */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-xa-text">Comparatif boutiques</h1>
          <p className="text-sm text-xa-muted mt-0.5">
            Performance de votre réseau
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {(['ce_mois', 'mois_precedent', '3_mois'] as ComparatifPeriode[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriode(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                periode === p
                  ? 'bg-xa-primary text-white'
                  : 'bg-xa-surface border border-xa-border text-xa-text hover:bg-xa-bg'
              }`}
            >
              {PERIODE_LABELS[p]}
            </button>
          ))}
        </div>
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
            CA réseau (période)
          </p>
          <p className="text-2xl font-bold text-xa-primary">{formatFCFA(totalCA)}</p>
        </div>
      </div>

      {/* Progression / recul indicators */}
      {(enProgression || enRecul) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {enProgression && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-center gap-3">
              <span className="text-2xl">📈</span>
              <div>
                <p className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-0.5">
                  En progression
                </p>
                <p className="font-bold text-xa-text">{enProgression.nom}</p>
                <p className="text-xs text-xa-muted">
                  +{enProgression.diffPct}% vs période précédente
                </p>
              </div>
            </div>
          )}
          {enRecul && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center gap-3">
              <span className="text-2xl">📉</span>
              <div>
                <p className="text-xs font-semibold text-xa-danger uppercase tracking-wider mb-0.5">
                  En recul
                </p>
                <p className="font-bold text-xa-text">{enRecul.nom}</p>
                <p className="text-xs text-xa-muted">
                  {enRecul.diffPct}% vs période précédente
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Podium top 3 */}
      {boutiques.length > 0 && (
        <div className="bg-xa-surface border border-xa-border rounded-xl p-4">
          <h2 className="font-semibold text-xa-text text-sm mb-4">
            Classement CA — {PERIODE_LABELS[periode]}
          </h2>
          <div className="space-y-3">
            {boutiques.map((b, i) => (
              <div key={b.id} className="flex items-center gap-3">
                {i < 3 ? (
                  <span className="text-lg w-7 shrink-0 text-center">{PODIUM_MEDALS[i]}</span>
                ) : (
                  <span className="text-xs font-bold text-xa-muted w-7 shrink-0 text-center">
                    {i + 1}.
                  </span>
                )}
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

      {/* Horizontal bar chart: CA / Bénéfice / Charges */}
      {boutiques.length > 0 && (
        <div className="bg-xa-surface border border-xa-border rounded-xl p-4">
          <h2 className="font-semibold text-xa-text text-sm mb-4">
            CA · Bénéfice · Charges par boutique
          </h2>
          <div className="space-y-5">
            {boutiques.map((b) => (
              <div key={b.id}>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: b.couleur_theme }}
                  />
                  <span className="text-sm font-medium text-xa-text">{b.nom}</span>
                </div>
                <div className="space-y-1.5">
                  <BarRow label="CA" value={b.ca} max={maxCA} color="bg-xa-primary" />
                  <BarRow label="Bénéfice" value={b.benefice} max={maxBenef} color="bg-green-500" />
                  <BarRow label="Coût achats" value={b.cout_achats} max={maxCoutAchats} color="bg-orange-400" />
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
            <h2 className="font-semibold text-xa-text text-sm">KPIs comparatifs par boutique</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-xa-border bg-xa-bg">
                  {[
                    'Boutique',
                    'CA',
                    'Bénéfice',
                    'Charges',
                    'Transactions',
                    'Panier moyen',
                    'Marge',
                    'Performance',
                  ].map((h) => (
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
                    <td className="px-4 py-3 text-green-600 font-medium">
                      {formatFCFA(b.benefice)}
                    </td>
                    <td className="px-4 py-3 text-orange-500">
                      {formatFCFA(b.cout_achats)}
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

function BarRow({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-xa-muted w-16 shrink-0">{label}</span>
      <div className="flex-1 bg-xa-border rounded-full h-2">
        <div
          className={`${color} h-2 rounded-full transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-xa-text font-medium w-24 text-right shrink-0">
        {formatFCFA(value)}
      </span>
    </div>
  );
}
