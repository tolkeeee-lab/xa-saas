'use client';

import { useState, useMemo } from 'react';
import { formatFCFA, formatDateTime } from '@/lib/format';
import type { TransactionsData, TransactionWithDetails } from '@/lib/supabase/getTransactions';

type TransactionsPageProps = {
  data: TransactionsData;
};

type StatutFilter = 'tous' | 'validee' | 'annulee';

function exportCSV(transactions: TransactionWithDetails[]) {
  const headers = ['Date', 'Boutique', 'Employé', 'Mode paiement', 'Montant', 'Bénéfice', 'Statut', 'Client'];
  const rows = transactions.map((t) => [
    t.created_at,
    t.boutique_nom,
    t.employe_nom ?? '',
    t.mode_paiement,
    String(t.montant_total),
    String(t.benefice_total),
    t.statut,
    t.client_nom ?? '',
  ]);
  const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const MODE_PAIEMENT_COLORS: Record<string, string> = {
  cash: 'bg-xa-border/40 text-xa-muted',
  especes: 'bg-xa-border/40 text-xa-muted',
  momo: 'bg-baby-blue-ice-500/20 text-baby-blue-ice-400',
  carte: 'bg-violet-500/20 text-violet-400',
  credit: 'bg-powder-petal-500/20 text-powder-petal-400',
  dette: 'bg-powder-petal-500/20 text-powder-petal-400',
};

export default function TransactionsPage({ data }: TransactionsPageProps) {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [boutiqueFilter, setBoutiqueFilter] = useState('');
  const [statutFilter, setStatutFilter] = useState<StatutFilter>('tous');

  const hasFilters = dateFrom !== '' || dateTo !== '' || boutiqueFilter !== '' || statutFilter !== 'tous';

  const filtered = useMemo(() => {
    return data.transactions.filter((t) => {
      if (statutFilter !== 'tous' && t.statut !== statutFilter) return false;
      if (boutiqueFilter && t.boutique_id !== boutiqueFilter) return false;
      if (dateFrom && t.created_at < dateFrom) return false;
      if (dateTo && t.created_at > dateTo + 'T23:59:59') return false;
      return true;
    });
  }, [data.transactions, statutFilter, boutiqueFilter, dateFrom, dateTo]);

  const nbValidees = filtered.filter((t) => t.statut === 'validee').length;
  const nbAnnulees = filtered.filter((t) => t.statut === 'annulee').length;
  const caFiltered = filtered
    .filter((t) => t.statut === 'validee')
    .reduce((s, t) => s + t.montant_total, 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-xa-text">📋 Historique des transactions</h1>
          <p className="text-sm text-xa-muted mt-0.5">
            Consultez et exportez l&apos;ensemble de vos ventes
          </p>
        </div>
        <button
          onClick={() => exportCSV(filtered)}
          className="px-4 py-2 rounded-lg bg-xa-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          ⬇ Exporter CSV
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div
          className="bg-xa-surface border border-xa-border rounded-xl p-3"
          style={{ animation: 'xa-fade-up 0.4s ease both' }}
        >
          <p className="text-xs font-semibold text-xa-muted uppercase tracking-wider mb-1">CA total</p>
          <p className="text-lg font-bold text-xa-primary">{formatFCFA(caFiltered)}</p>
        </div>
        <div
          className="bg-xa-surface border border-xa-border rounded-xl p-3"
          style={{ animation: 'xa-fade-up 0.4s ease both', animationDelay: '0.05s' }}
        >
          <p className="text-xs font-semibold text-xa-muted uppercase tracking-wider mb-1">Transactions</p>
          <p className="text-lg font-bold text-xa-text">{filtered.length}</p>
        </div>
        <div
          className="bg-xa-surface border border-xa-border rounded-xl p-3"
          style={{ animation: 'xa-fade-up 0.4s ease both', animationDelay: '0.1s' }}
        >
          <p className="text-xs font-semibold text-xa-muted uppercase tracking-wider mb-1">Validées</p>
          <p className="text-lg font-bold text-aquamarine-600">{nbValidees}</p>
        </div>
        <div
          className="bg-xa-surface border border-xa-border rounded-xl p-3"
          style={{ animation: 'xa-fade-up 0.4s ease both', animationDelay: '0.15s' }}
        >
          <p className="text-xs font-semibold text-xa-muted uppercase tracking-wider mb-1">Annulées</p>
          <p className="text-lg font-bold text-xa-danger">{nbAnnulees}</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="px-3 py-1.5 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-xs focus:outline-none focus:ring-2 focus:ring-xa-primary"
          title="Date début"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="px-3 py-1.5 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-xs focus:outline-none focus:ring-2 focus:ring-xa-primary"
          title="Date fin"
        />
        {data.boutiques.length > 1 && (
          <select
            value={boutiqueFilter}
            onChange={(e) => setBoutiqueFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-xs focus:outline-none focus:ring-2 focus:ring-xa-primary"
          >
            <option value="">Toutes les boutiques</option>
            {data.boutiques.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nom}
              </option>
            ))}
          </select>
        )}
        <div className="flex rounded-lg border border-xa-border overflow-hidden">
          {(['tous', 'validee', 'annulee'] as StatutFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatutFilter(s)}
              className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                statutFilter === s
                  ? 'bg-xa-primary text-white'
                  : 'text-xa-muted hover:bg-xa-bg'
              }`}
            >
              {s === 'tous' ? 'Tous' : s === 'validee' ? 'Validées' : 'Annulées'}
            </button>
          ))}
        </div>
        {hasFilters && (
          <button
            onClick={() => {
              setDateFrom('');
              setDateTo('');
              setBoutiqueFilter('');
              setStatutFilter('tous');
            }}
            className="px-3 py-1.5 rounded-lg border border-xa-border text-xa-muted text-xs hover:bg-xa-bg transition-colors"
          >
            Réinitialiser
          </button>
        )}
      </div>

      {/* Tableau ou état vide */}
      {filtered.length === 0 ? (
        <div className="bg-xa-surface border border-xa-border rounded-xl p-12 text-center">
          <p className="text-xa-muted">
            {hasFilters ? 'Aucun résultat pour ces filtres.' : 'Aucune transaction enregistrée.'}
          </p>
        </div>
      ) : (
        <div className="bg-xa-surface border border-xa-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-xa-border bg-xa-bg">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-xa-muted uppercase tracking-wider">
                    Date/Heure
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-xa-muted uppercase tracking-wider">
                    Boutique
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-xa-muted uppercase tracking-wider hidden sm:table-cell">
                    Employé
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-xa-muted uppercase tracking-wider">
                    Mode
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-xa-muted uppercase tracking-wider">
                    Montant
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-xa-muted uppercase tracking-wider hidden sm:table-cell">
                    Bénéfice
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-xa-muted uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-xa-muted uppercase tracking-wider hidden sm:table-cell">
                    Client
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <TransactionRow key={t.id} transaction={t} boutiques={data.boutiques} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function TransactionRow({
  transaction: t,
  boutiques,
}: {
  transaction: TransactionWithDetails;
  boutiques: { id: string; nom: string; couleur_theme: string }[];
}) {
  const boutique = boutiques.find((b) => b.id === t.boutique_id);
  const modeCls = MODE_PAIEMENT_COLORS[t.mode_paiement] ?? 'bg-xa-border/40 text-xa-muted';

  return (
    <tr className="border-b border-xa-border last:border-0 hover:bg-xa-bg transition-colors">
      <td className="px-4 py-3 text-xa-muted whitespace-nowrap">
        {formatDateTime(t.created_at)}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: boutique?.couleur_theme ?? 'var(--xa-muted)' }}
          />
          <span className="text-xa-text">{t.boutique_nom}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-xa-muted hidden sm:table-cell">
        {t.employe_nom ?? '—'}
      </td>
      <td className="px-4 py-3">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${modeCls}`}>
          {t.mode_paiement}
        </span>
      </td>
      <td className="px-4 py-3 font-semibold text-xa-text whitespace-nowrap">
        {formatFCFA(t.montant_total)}
      </td>
      <td className="px-4 py-3 hidden sm:table-cell">
        <span className={t.benefice_total > 0 ? 'text-aquamarine-600 font-semibold' : 'text-xa-muted'}>
          {formatFCFA(t.benefice_total)}
        </span>
      </td>
      <td className="px-4 py-3">
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            t.statut === 'validee'
              ? 'bg-aquamarine-500/20 text-aquamarine-500'
              : 'bg-xa-danger/20 text-xa-danger'
          }`}
        >
          {t.statut === 'validee' ? 'Validée' : 'Annulée'}
        </span>
      </td>
      <td className="px-4 py-3 text-xa-muted hidden sm:table-cell">
        {t.client_nom ?? '—'}
      </td>
    </tr>
  );
}
