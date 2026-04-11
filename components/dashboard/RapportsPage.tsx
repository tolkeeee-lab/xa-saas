'use client';

import type { RapportsData } from '@/lib/supabase/getRapports';
import { formatFCFA } from '@/lib/format';
import StatCard from './StatCard';

interface RapportsPageProps {
  data: RapportsData;
}

export default function RapportsPage({ data }: RapportsPageProps) {
  const { moisStats, boutiques, ca_mois, benefice_net, cout_achats, marge_nette } = data;

  const maxCA = Math.max(...moisStats.map((m) => m.ca), 1);
  const totalBoutiquesCA = boutiques.reduce((s, b) => s + b.ca, 0);

  function handleExport() {
    window.print();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-xa-text">Rapports</h1>
          <p className="text-xa-muted text-sm mt-1">Tableau de bord financier réseau</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-xa-border text-xa-text text-sm hover:bg-xa-bg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Exporter PDF
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="CA réseau ce mois"
          value={formatFCFA(ca_mois)}
          subtitle="Toutes boutiques"
          accent
        />
        <StatCard
          title="Bénéfice net réseau"
          value={formatFCFA(benefice_net)}
          subtitle="Après charges"
        />
        <StatCard
          title="Coût achats"
          value={formatFCFA(cout_achats)}
          subtitle="Prix d'achat total"
        />
        <StatCard
          title="Marge nette"
          value={`${marge_nette}%`}
          subtitle="Sur le CA"
        />
      </div>

      {/* CA 6 months chart */}
      <div className="bg-xa-surface border border-xa-border rounded-xl p-6">
        <h2 className="text-sm font-semibold text-xa-text mb-4">Évolution CA — 6 derniers mois</h2>
        <div className="flex items-end gap-3 h-40">
          {moisStats.map((m, i) => {
            const isLast = i === moisStats.length - 1;
            const pct = maxCA > 0 ? Math.round((m.ca / maxCA) * 100) : 0;
            return (
              <div key={m.mois} className="flex-1 flex flex-col items-center gap-1">
                {m.ca > 0 && (
                  <span className="text-xs text-xa-muted text-center leading-tight">
                    {formatFCFA(m.ca)}
                  </span>
                )}
                <div className="w-full flex flex-col justify-end" style={{ height: '100px' }}>
                  <div
                    className={`w-full rounded-t-md transition-all ${
                      isLast
                        ? 'bg-xa-primary'
                        : 'bg-xa-surface border border-xa-border'
                    }`}
                    style={{ height: `${Math.max(pct, 2)}%` }}
                  />
                </div>
                <span className="text-xs text-xa-muted">{m.mois}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Répartition par boutique */}
      {boutiques.length > 0 && (
        <div className="bg-xa-surface border border-xa-border rounded-xl p-6">
          <h2 className="text-sm font-semibold text-xa-text mb-4">Répartition par boutique</h2>
          <div className="space-y-3">
            {boutiques.map((b) => {
              const pct = totalBoutiquesCA > 0 ? Math.round((b.ca / totalBoutiquesCA) * 100) : 0;
              return (
                <div key={b.id}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-xa-text">{b.nom}</span>
                    <span className="text-xa-muted">
                      {formatFCFA(b.ca)} · {pct}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-xa-bg overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: b.couleur_theme,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tableau rapport consolidé */}
      <div className="bg-xa-surface border border-xa-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-xa-border">
          <h2 className="text-sm font-semibold text-xa-text">Rapport mensuel consolidé</h2>
        </div>
        {boutiques.length === 0 ? (
          <p className="text-xa-muted text-sm p-6">Aucune donnée disponible.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-xa-border text-xs text-xa-muted uppercase tracking-wider">
                  <th className="text-left px-4 py-3">Boutique</th>
                  <th className="text-right px-4 py-3">CA</th>
                  <th className="text-right px-4 py-3">Coût achat</th>
                  <th className="text-right px-4 py-3">Marge brute</th>
                  <th className="text-right px-4 py-3">Charges</th>
                  <th className="text-right px-4 py-3">Bénéfice net</th>
                  <th className="text-right px-4 py-3">Évol.</th>
                </tr>
              </thead>
              <tbody>
                {boutiques.map((b) => (
                  <tr key={b.id} className="border-b border-xa-border last:border-0 hover:bg-xa-bg/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: b.couleur_theme }}
                        />
                        <span className="font-medium text-xa-text">{b.nom}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-xa-text">{formatFCFA(b.ca)}</td>
                    <td className="px-4 py-3 text-right text-xa-muted">{formatFCFA(b.cout_achat)}</td>
                    <td className="px-4 py-3 text-right text-xa-text">{formatFCFA(b.marge_brute)}</td>
                    <td className="px-4 py-3 text-right text-xa-muted">{formatFCFA(b.charges)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-xa-text">{formatFCFA(b.benefice_net)}</td>
                    <td className={`px-4 py-3 text-right text-xs font-semibold ${b.evolution >= 0 ? 'text-green-400' : 'text-xa-danger'}`}>
                      {b.evolution >= 0 ? '+' : ''}{b.evolution}%
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
