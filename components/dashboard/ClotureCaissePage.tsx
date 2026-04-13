'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatFCFA, formatDate } from '@/lib/format';
import type { ClotureCaissePageData, ClotureCaisseRow } from '@/lib/supabase/getClotureCaisse';

type Props = {
  data: ClotureCaissePageData;
};

type LiveData = {
  ca_theorique: number;
  cash_theorique: number;
  par_mode: Record<string, number>;
  nb_transactions: number;
  cloture_existante: { id: string; cash_reel: number; ecart: number; note: string | null } | null;
};

type ToastState = { message: string; type: 'success' | 'error' } | null;

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function ClotureCaissePage({ data }: Props) {
  const { boutiques, historique: initialHistorique } = data;

  const [selectedBoutiqueId, setSelectedBoutiqueId] = useState<string>(
    boutiques[0]?.id ?? '',
  );
  const [date, setDate] = useState<string>(todayISO());
  const [liveData, setLiveData] = useState<LiveData | null>(null);
  const [loadingLive, setLoadingLive] = useState(false);
  const [cashReel, setCashReel] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const [historique, setHistorique] = useState<ClotureCaisseRow[]>(initialHistorique);

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }

  const fetchLiveData = useCallback(async (boutiqueId: string, d: string) => {
    if (!boutiqueId || !d) return;
    setLoadingLive(true);
    try {
      const res = await fetch(
        `/api/cloture-caisse?boutique_id=${encodeURIComponent(boutiqueId)}&date=${encodeURIComponent(d)}`,
      );
      if (!res.ok) {
        const json = (await res.json()) as { error?: string };
        throw new Error(json.error ?? 'Erreur serveur');
      }
      const json = (await res.json()) as LiveData;
      setLiveData(json);
      if (json.cloture_existante) {
        setCashReel(String(json.cloture_existante.cash_reel));
        setNote(json.cloture_existante.note ?? '');
      } else {
        setCashReel('');
        setNote('');
      }
    } catch {
      setLiveData(null);
    } finally {
      setLoadingLive(false);
    }
  }, []);

  useEffect(() => {
    if (selectedBoutiqueId && date) {
      void fetchLiveData(selectedBoutiqueId, date);
    }
  }, [selectedBoutiqueId, date, fetchLiveData]);

  const cashReelNum = parseFloat(cashReel) || 0;
  const cashTheorique = liveData?.cash_theorique ?? 0;
  const ecart = cashReelNum - cashTheorique;
  const showEcart = cashReel !== '' && liveData !== null;

  const selectedBoutique = boutiques.find((b) => b.id === selectedBoutiqueId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedBoutiqueId || !date || cashReel === '') return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/cloture-caisse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boutique_id: selectedBoutiqueId,
          date,
          cash_reel: cashReelNum,
          note: note || undefined,
        }),
      });

      if (!res.ok) {
        const json = (await res.json()) as { error?: string };
        throw new Error(json.error ?? 'Erreur serveur');
      }

      showToast(
        liveData?.cloture_existante
          ? 'Clôture mise à jour avec succès ✅'
          : 'Clôture validée avec succès ✅',
        'success',
      );

      // Refresh live data and historique
      await fetchLiveData(selectedBoutiqueId, date);

      const histRes = await fetch(
        `/api/cloture-caisse?boutique_id=${encodeURIComponent(selectedBoutiqueId)}&date=${encodeURIComponent(date)}`,
      );
      if (histRes.ok) {
        // Re-fetch full historique by reloading page data from server would require
        // a server action. Instead, update the historique optimistically.
        const boutiqueName = selectedBoutique?.nom ?? '';
        const updatedRow: ClotureCaisseRow = {
          id: liveData?.cloture_existante?.id ?? '',
          boutique_id: selectedBoutiqueId,
          boutique_nom: boutiqueName,
          date,
          ca_theorique: liveData?.ca_theorique ?? 0,
          cash_theorique: cashTheorique,
          cash_reel: cashReelNum,
          ecart,
          nb_transactions: liveData?.nb_transactions ?? 0,
          par_mode: liveData?.par_mode ?? {},
          note: note || null,
          created_at: new Date().toISOString(),
        };
        setHistorique((prev) => {
          const without = prev.filter(
            (r) => !(r.boutique_id === selectedBoutiqueId && r.date === date),
          );
          return [updatedRow, ...without].slice(0, 30);
        });
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur inconnue', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  if (boutiques.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <p className="text-xa-muted mb-4">Aucune boutique active.</p>
        <a
          href="/dashboard/boutiques/new"
          className="px-4 py-2 rounded-lg bg-xa-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Créer une boutique
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6" style={{ animation: 'xa-fade-up 0.4s ease both' }}>
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${
            toast.type === 'success'
              ? 'bg-green-500 text-white'
              : 'bg-xa-danger text-white'
          }`}
          style={{ animation: 'xa-fade-up 0.3s ease both' }}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-xa-text">💰 Clôture de caisse</h1>
        <p className="text-sm text-xa-muted mt-1">
          Saisir le cash réel compté en fin de journée et valider la clôture.
        </p>
      </div>

      {/* Form card */}
      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="bg-xa-surface border border-xa-border rounded-2xl p-6 space-y-6"
      >
        {/* Boutique + Date */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-xa-muted uppercase tracking-wider mb-1.5">
              Boutique
            </label>
            <select
              value={selectedBoutiqueId}
              onChange={(e) => setSelectedBoutiqueId(e.target.value)}
              className="w-full bg-xa-bg border border-xa-border rounded-lg px-3 py-2 text-sm text-xa-text focus:outline-none focus:ring-2 focus:ring-xa-primary"
            >
              {boutiques.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nom}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-xs font-semibold text-xa-muted uppercase tracking-wider mb-1.5">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-xa-bg border border-xa-border rounded-lg px-3 py-2 text-sm text-xa-text focus:outline-none focus:ring-2 focus:ring-xa-primary"
            />
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Espèces théoriques */}
          <div className="bg-xa-bg border border-xa-border rounded-xl p-4">
            <p className="text-xs font-semibold text-xa-muted uppercase tracking-wider mb-2">
              Espèces théoriques
            </p>
            <p className="text-xl font-bold text-xa-text tabular-nums">
              {loadingLive ? '…' : formatFCFA(liveData?.cash_theorique ?? 0)}
            </p>
          </div>
          {/* Mobile Money */}
          <div className="bg-xa-bg border border-xa-border rounded-xl p-4">
            <p className="text-xs font-semibold text-xa-muted uppercase tracking-wider mb-2">
              Mobile Money
            </p>
            <p className="text-xl font-bold text-xa-text tabular-nums">
              {loadingLive ? '…' : formatFCFA(liveData?.par_mode['momo'] ?? 0)}
            </p>
          </div>
          {/* Carte */}
          <div className="bg-xa-bg border border-xa-border rounded-xl p-4">
            <p className="text-xs font-semibold text-xa-muted uppercase tracking-wider mb-2">
              Carte
            </p>
            <p className="text-xl font-bold text-xa-text tabular-nums">
              {loadingLive ? '…' : formatFCFA(liveData?.par_mode['carte'] ?? 0)}
            </p>
          </div>
          {/* CA Total */}
          <div className="bg-xa-bg border border-xa-border rounded-xl p-4">
            <p className="text-xs font-semibold text-xa-muted uppercase tracking-wider mb-2">
              CA Total
            </p>
            <p className="text-xl font-bold text-xa-text tabular-nums">
              {loadingLive ? '…' : formatFCFA(liveData?.ca_theorique ?? 0)}
            </p>
            <p className="text-xs text-xa-muted mt-1">
              {loadingLive ? '' : `${liveData?.nb_transactions ?? 0} transaction(s)`}
            </p>
          </div>
        </div>

        {/* Cash réel compté */}
        <div>
          <label className="block text-xs font-semibold text-xa-muted uppercase tracking-wider mb-1.5">
            Cash réel compté (FCFA)
          </label>
          <input
            type="number"
            min="0"
            step="1"
            value={cashReel}
            onChange={(e) => setCashReel(e.target.value)}
            placeholder="0"
            className="w-full bg-xa-bg border border-xa-border rounded-xl px-4 py-3 text-2xl font-bold text-xa-text tabular-nums focus:outline-none focus:ring-2 focus:ring-xa-primary placeholder:text-xa-muted/50"
          />
        </div>

        {/* Écart */}
        {showEcart && (
          <div>
            {ecart === 0 ? (
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 text-green-700 text-sm font-semibold dark:bg-green-900/20">
                ✅ Caisse équilibrée
              </span>
            ) : ecart > 0 ? (
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold dark:bg-blue-900/20">
                📈 Surplus +{formatFCFA(ecart)}
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-100 text-red-700 text-sm font-semibold dark:bg-red-900/20">
                📉 Manque {formatFCFA(Math.abs(ecart))}
              </span>
            )}
          </div>
        )}

        {/* Note */}
        <div>
          <label className="block text-xs font-semibold text-xa-muted uppercase tracking-wider mb-1.5">
            Note (optionnelle)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Observations, commentaires…"
            rows={2}
            className="w-full bg-xa-bg border border-xa-border rounded-lg px-3 py-2 text-sm text-xa-text focus:outline-none focus:ring-2 focus:ring-xa-primary resize-none"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting || cashReel === '' || !selectedBoutiqueId || !date}
          className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-xa-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {submitting
            ? 'Enregistrement…'
            : liveData?.cloture_existante
            ? 'Mettre à jour'
            : 'Valider la clôture'}
        </button>
      </form>

      {/* Historique */}
      <div className="bg-xa-surface border border-xa-border rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-xa-border">
          <h2 className="text-sm font-semibold text-xa-text">
            Historique des clôtures{' '}
            <span className="text-xa-muted font-normal">(30 dernières)</span>
          </h2>
        </div>
        {historique.length === 0 ? (
          <div className="px-6 py-8 text-center text-xa-muted text-sm">
            Aucune clôture enregistrée.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-xa-border bg-xa-bg/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-xa-muted uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-xa-muted uppercase tracking-wider">
                    Boutique
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-xa-muted uppercase tracking-wider">
                    CA
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-xa-muted uppercase tracking-wider">
                    Espèces théor.
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-xa-muted uppercase tracking-wider">
                    Cash réel
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-xa-muted uppercase tracking-wider">
                    Écart
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-xa-muted uppercase tracking-wider">
                    Transactions
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-xa-muted uppercase tracking-wider">
                    Note
                  </th>
                </tr>
              </thead>
              <tbody>
                {historique.map((row) => {
                  const boutique = boutiques.find((b) => b.id === row.boutique_id);
                  const ecartVal = row.ecart;
                  return (
                    <tr
                      key={row.id || `${row.boutique_id}-${row.date}`}
                      className="border-b border-xa-border last:border-0 hover:bg-xa-bg/50 transition-colors"
                    >
                      <td className="px-4 py-3 text-xa-text font-medium whitespace-nowrap">
                        {formatDate(row.date)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{
                              backgroundColor:
                                boutique?.couleur_theme ?? 'var(--xa-muted)',
                            }}
                          />
                          <span className="text-xa-text">{row.boutique_nom}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-xa-text tabular-nums">
                        {formatFCFA(row.ca_theorique)}
                      </td>
                      <td className="px-4 py-3 text-right text-xa-text tabular-nums">
                        {formatFCFA(row.cash_theorique)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-xa-text tabular-nums">
                        {formatFCFA(row.cash_reel)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {ecartVal === 0 ? (
                          <span className="text-green-600 font-semibold">0</span>
                        ) : ecartVal > 0 ? (
                          <span className="text-blue-600 font-semibold">
                            +{formatFCFA(ecartVal)}
                          </span>
                        ) : (
                          <span className="text-xa-danger font-semibold">
                            {formatFCFA(ecartVal)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-xa-muted tabular-nums">
                        {row.nb_transactions}
                      </td>
                      <td className="px-4 py-3 text-xa-muted max-w-[160px] truncate">
                        {row.note ?? '—'}
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
