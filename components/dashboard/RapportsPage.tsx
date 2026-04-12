'use client';

import { useState, useCallback } from 'react';
import type { RapportsData, RapportsPeriodeData, BoutiqueRapport } from '@/lib/supabase/getRapports';
import { formatFCFA, formatDate } from '@/lib/format';
import StatCard from './StatCard';

interface RapportsPageProps {
  data: RapportsData;
  periodeData: RapportsPeriodeData;
  initialDateDebut: string;
  initialDateFin: string;
}

type Raccourci = 'aujourd_hui' | 'cette_semaine' | 'ce_mois' | '30_jours' | 'personnalise';

function toDateInput(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default function RapportsPage({
  data,
  periodeData: initialPeriodeData,
  initialDateDebut,
  initialDateFin,
}: RapportsPageProps) {
  const { moisStats } = data;

  const [dateDebut, setDateDebut] = useState(initialDateDebut);
  const [dateFin, setDateFin] = useState(initialDateFin);
  const [raccourci, setRaccourci] = useState<Raccourci>('ce_mois');
  const [periodeData, setPeriodeData] = useState<RapportsPeriodeData>(initialPeriodeData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const maxCA = Math.max(...moisStats.map((m) => m.ca), 1);
  const totalBoutiquesCA = periodeData.boutiques.reduce((s, b) => s + b.ca, 0);

  const appliquerPeriode = useCallback(
    async (debut: string, fin: string) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/rapports?dateDebut=${debut}&dateFin=${fin}`);
        if (!res.ok) {
          const json = (await res.json()) as { error?: string };
          throw new Error(json.error ?? 'Erreur serveur');
        }
        const json = (await res.json()) as RapportsPeriodeData;
        setPeriodeData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  function applyRaccourci(r: Raccourci) {
    const now = new Date();
    let debut = dateDebut;
    let fin = dateFin;

    if (r === 'aujourd_hui') {
      debut = toDateInput(now);
      fin = toDateInput(now);
    } else if (r === 'cette_semaine') {
      const day = now.getDay(); // 0=Sun
      const diff = day === 0 ? -6 : 1 - day;
      const lundi = new Date(now);
      lundi.setDate(now.getDate() + diff);
      const dimanche = new Date(lundi);
      dimanche.setDate(lundi.getDate() + 6);
      debut = toDateInput(lundi);
      fin = toDateInput(dimanche);
    } else if (r === 'ce_mois') {
      debut = toDateInput(new Date(now.getFullYear(), now.getMonth(), 1));
      fin = toDateInput(new Date(now.getFullYear(), now.getMonth() + 1, 0));
    } else if (r === '30_jours') {
      const trentJoursAvant = new Date(now);
      trentJoursAvant.setDate(now.getDate() - 29);
      debut = toDateInput(trentJoursAvant);
      fin = toDateInput(now);
    }

    setRaccourci(r);
    setDateDebut(debut);
    setDateFin(fin);

    if (r !== 'personnalise') {
      void appliquerPeriode(debut, fin);
    }
  }

  function handleAppliquer() {
    void appliquerPeriode(dateDebut, dateFin);
  }

  function exportCSV(rows: BoutiqueRapport[]) {
    const header = ['Boutique', 'CA (FCFA)', 'Coût achat (FCFA)', 'Marge brute (FCFA)', 'Charges (FCFA)', 'Bénéfice net (FCFA)'];
    const lines = rows.map((r) =>
      [r.nom, r.ca, r.cout_achat, r.marge_brute, r.charges, r.benefice_net].join(';'),
    );
    const csv = [header.join(';'), ...lines].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapports-xa-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const raccourcis: { label: string; value: Raccourci }[] = [
    { label: "Aujourd'hui", value: 'aujourd_hui' },
    { label: 'Cette semaine', value: 'cette_semaine' },
    { label: 'Ce mois', value: 'ce_mois' },
    { label: '30 derniers jours', value: '30_jours' },
    { label: 'Personnalisé', value: 'personnalise' },
  ];

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between print:pb-2 print:border-b print:border-xa-border">
        <div>
          <h1 className="text-2xl font-bold text-xa-text">Rapports</h1>
          <p className="text-xa-muted text-sm mt-1">Tableau de bord financier réseau</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap print:hidden">
          <button
            onClick={() => exportCSV(periodeData.boutiques)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-xa-border text-xa-text text-sm hover:bg-xa-bg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-xa-border text-xa-text text-sm hover:bg-xa-bg transition-colors"
          >
            🖨️ Imprimer
          </button>
        </div>
      </div>

      {/* Sélecteur de période */}
      <div className="bg-xa-surface border border-xa-border rounded-xl p-4 space-y-3 print:hidden">
        <h2 className="text-sm font-semibold text-xa-text">Période</h2>
        {/* Raccourcis */}
        <div className="flex flex-wrap gap-2">
          {raccourcis.map((r) => (
            <button
              key={r.value}
              onClick={() => applyRaccourci(r.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                raccourci === r.value
                  ? 'bg-xa-primary text-white'
                  : 'border border-xa-border text-xa-muted hover:bg-xa-bg'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
        {/* Date inputs */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-xs text-xa-muted">Du</label>
            <input
              type="date"
              value={dateDebut}
              onChange={(e) => {
                setDateDebut(e.target.value);
                setRaccourci('personnalise');
              }}
              className="bg-xa-bg border border-xa-border rounded-lg px-3 py-1.5 text-sm text-xa-text focus:outline-none focus:ring-2 focus:ring-xa-primary"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-xa-muted">Au</label>
            <input
              type="date"
              value={dateFin}
              onChange={(e) => {
                setDateFin(e.target.value);
                setRaccourci('personnalise');
              }}
              className="bg-xa-bg border border-xa-border rounded-lg px-3 py-1.5 text-sm text-xa-text focus:outline-none focus:ring-2 focus:ring-xa-primary"
            />
          </div>
          <button
            onClick={handleAppliquer}
            disabled={loading}
            className="px-4 py-1.5 rounded-lg bg-xa-primary text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Chargement…' : 'Appliquer'}
          </button>
        </div>
        {error && <p className="text-xa-danger text-xs">{error}</p>}
      </div>

      {/* Stats cards de la période */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="CA de la période"
          value={loading ? '—' : formatFCFA(periodeData.ca_total)}
          subtitle={`${formatDate(dateDebut)} – ${formatDate(dateFin)}`}
          accent
        />
        <StatCard
          title="Bénéfice net"
          value={loading ? '—' : formatFCFA(periodeData.benefice_net)}
          subtitle="Après charges"
        />
        <StatCard
          title="Coût achats"
          value={loading ? '—' : formatFCFA(periodeData.cout_achats)}
          subtitle="Prix d'achat total"
        />
        <StatCard
          title="Marge nette"
          value={loading ? '—' : `${periodeData.marge_nette}%`}
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

      {/* Historique journalier */}
      {periodeData.historiqueJournalier.length > 0 && (
        <div className="bg-xa-surface border border-xa-border rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-xa-border">
            <h2 className="text-sm font-semibold text-xa-text">Historique journalier</h2>
          </div>
          {loading ? (
            <p className="text-xa-muted text-sm p-6">Chargement…</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-xa-border text-xs text-xa-muted uppercase tracking-wider">
                    <th className="text-left px-4 py-3">Date</th>
                    <th className="text-right px-4 py-3">CA du jour</th>
                    <th className="text-right px-4 py-3">Transactions</th>
                    <th className="text-right px-4 py-3">Évolution</th>
                  </tr>
                </thead>
                <tbody>
                  {periodeData.historiqueJournalier.map((jour, idx) => {
                    const hasCA = jour.ca > 0;
                    // Array is sorted desc, so idx+1 is the previous chronological day
                    const jourPrecedent = periodeData.historiqueJournalier[idx + 1];
                    const prevCA = jourPrecedent?.ca ?? 0;
                    const evo = prevCA > 0 ? Math.round(((jour.ca - prevCA) / prevCA) * 100) : null;

                    return (
                      <tr
                        key={jour.date}
                        className={`border-b border-xa-border last:border-0 transition-colors ${
                          hasCA ? 'hover:bg-xa-bg/50' : 'opacity-50'
                        }`}
                      >
                        <td className="px-4 py-3 text-xa-text font-medium">
                          <div className="flex items-center gap-2">
                            {hasCA && (
                              <span className="inline-block w-2 h-2 rounded-full bg-xa-primary shrink-0" />
                            )}
                            {formatDate(jour.date)}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={hasCA ? 'font-semibold text-xa-text' : 'text-xa-muted'}>
                            {formatFCFA(jour.ca)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-xa-muted">{jour.transactions}</td>
                        <td className="px-4 py-3 text-right text-xs font-semibold">
                          {evo !== null ? (
                            <span className={evo >= 0 ? 'text-green-500' : 'text-xa-danger'}>
                              {evo >= 0 ? '+' : ''}
                              {evo}%
                            </span>
                          ) : (
                            <span className="text-xa-muted">—</span>
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
      )}

      {/* Répartition par boutique */}
      {periodeData.boutiques.length > 0 && (
        <div className="bg-xa-surface border border-xa-border rounded-xl p-6">
          <h2 className="text-sm font-semibold text-xa-text mb-4">Répartition par boutique</h2>
          <div className="space-y-3">
            {periodeData.boutiques.map((b) => {
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
          <h2 className="text-sm font-semibold text-xa-text">Rapport consolidé — période</h2>
        </div>
        {periodeData.boutiques.length === 0 ? (
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
                </tr>
              </thead>
              <tbody>
                {periodeData.boutiques.map((b) => (
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

