'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Boutique, ClotureCaisseJour } from '@/types/database';
import ClotureHeader from '@/features/cloture/components/ClotureHeader';
import ClotureTabs, { type ClotureTab } from '@/features/cloture/components/ClotureTabs';
import ClotureSummary from '@/features/cloture/components/ClotureSummary';
import CashCountInput from '@/features/cloture/components/CashCountInput';
import EcartPreview from '@/features/cloture/components/EcartPreview';
import ClotureHistoryList from '@/features/cloture/components/ClotureHistoryList';
import ClotureCard from '@/features/cloture/components/ClotureCard';
import ConfirmClotureModal from '@/features/cloture/modals/ConfirmClotureModal';
import ClotureDetailModal from '@/features/cloture/modals/ClotureDetailModal';

type Props = {
  boutiques: Boutique[];
  initialBoutiqueId: string;
  isOwner: boolean;
};

type StatsJour = {
  nb_transactions: number;
  ca_calcule: number;
  credits_accordes: number;
  retraits_valides: number;
  cash_theorique: number;
  cloture_existante: ClotureCaisseJour | null;
};

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function ClotureScreen({ boutiques, initialBoutiqueId, isOwner }: Props) {
  const [activeBoutiqueId, setActiveBoutiqueId] = useState(initialBoutiqueId);
  const [tab, setTab] = useState<ClotureTab>('aujourd_hui');
  const [date] = useState(todayISO());

  // Aujourd'hui state
  const [stats, setStats] = useState<StatsJour | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [cashCompte, setCashCompte] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Historique state
  const [historique, setHistorique] = useState<ClotureCaisseJour[]>([]);
  const [histLoading, setHistLoading] = useState(false);
  const [filterMois, setFilterMois] = useState('');
  const [filterStatut, setFilterStatut] = useState('');

  // Detail modal
  const [selectedCloture, setSelectedCloture] = useState<ClotureCaisseJour | null>(null);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(
    null,
  );

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  // ── Load stats jour ────────────────────────────────────────────────────────

  const loadStats = useCallback(async (boutiqueId: string, d: string) => {
    setStatsLoading(true);
    setStats(null);
    try {
      const res = await fetch(
        `/api/cloture/stats-jour?boutique_id=${encodeURIComponent(boutiqueId)}&date=${encodeURIComponent(d)}`,
      );
      const json = (await res.json()) as StatsJour & { error?: string };
      if (!res.ok) throw new Error(json.error ?? 'Erreur');
      setStats(json);
      if (json.cloture_existante) {
        setCashCompte(String(json.cloture_existante.cash_compte));
      } else {
        setCashCompte('');
      }
    } catch {
      setStats(null);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStats(activeBoutiqueId, date);
  }, [activeBoutiqueId, date, loadStats]);

  // ── Load historique ────────────────────────────────────────────────────────

  const loadHistorique = useCallback(
    async (boutiqueId: string, mois: string, statut: string) => {
      setHistLoading(true);
      try {
        const params = new URLSearchParams({ boutique_id: boutiqueId, page: '1' });
        if (mois) params.set('mois', mois);
        if (statut) params.set('statut', statut);
        const res = await fetch(`/api/cloture?${params.toString()}`);
        const json = (await res.json()) as { data?: ClotureCaisseJour[]; error?: string };
        setHistorique(json.data ?? []);
      } catch {
        setHistorique([]);
      } finally {
        setHistLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (tab === 'historique') {
      void loadHistorique(activeBoutiqueId, filterMois, filterStatut);
    }
  }, [tab, activeBoutiqueId, filterMois, filterStatut, loadHistorique]);

  // ── Derived ─────────────────────────────────────────────────────────────────

  const cashCompteNum = cashCompte !== '' ? parseInt(cashCompte, 10) : null;
  const ecart =
    stats && cashCompteNum !== null ? cashCompteNum - stats.cash_theorique : 0;

  function handleClotureSuccess() {
    setConfirmOpen(false);
    showToast('Clôture enregistrée !', 'success');
    void loadStats(activeBoutiqueId, date);
  }

  function handleValidated() {
    setSelectedCloture(null);
    showToast('Clôture validée !', 'success');
    void loadHistorique(activeBoutiqueId, filterMois, filterStatut);
    void loadStats(activeBoutiqueId, date);
  }

  return (
    <div className="min-h-screen bg-xa-bg">
      <ClotureHeader
        boutiques={boutiques}
        activeBoutiqueId={activeBoutiqueId}
        onBoutiqueChange={(id) => {
          setActiveBoutiqueId(id);
          setCashCompte('');
        }}
        date={date}
      />

      <ClotureTabs active={tab} onChange={setTab} />

      {/* ── Aujourd'hui ── */}
      {tab === 'aujourd_hui' && (
        <div>
          {statsLoading && (
            <p className="text-center text-xa-muted text-sm py-10">Chargement…</p>
          )}

          {!statsLoading && stats && (
            <>
              {stats.cloture_existante ? (
                /* Already closed today */
                <div className="p-4">
                  <p className="text-sm text-xa-muted mb-3 text-center">
                    La caisse a été clôturée aujourd&apos;hui.
                  </p>
                  <ClotureCard
                    cloture={stats.cloture_existante}
                    onClick={() => setSelectedCloture(stats.cloture_existante)}
                  />
                </div>
              ) : (
                /* Form */
                <>
                  <ClotureSummary
                    nbTransactions={stats.nb_transactions}
                    caCalcule={stats.ca_calcule}
                    creditsAccordes={stats.credits_accordes}
                    retraitsValides={stats.retraits_valides}
                  />

                  <CashCountInput value={cashCompte} onChange={setCashCompte} />

                  <EcartPreview
                    cashTheorique={stats.cash_theorique}
                    cashCompte={cashCompteNum}
                  />

                  <div className="px-4 pb-6">
                    <button
                      type="button"
                      disabled={cashCompte === ''}
                      onClick={() => setConfirmOpen(true)}
                      className="w-full py-4 rounded-2xl bg-xa-primary text-white text-base font-bold disabled:opacity-40 transition-opacity"
                    >
                      Clôturer le jour
                    </button>
                  </div>
                </>
              )}
            </>
          )}

          {!statsLoading && !stats && (
            <p className="text-center text-xa-muted text-sm py-10">
              Impossible de charger les stats.
            </p>
          )}
        </div>
      )}

      {/* ── Historique ── */}
      {tab === 'historique' && (
        <div className="p-4 flex flex-col gap-4">
          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            <input
              type="month"
              value={filterMois}
              onChange={(e) => setFilterMois(e.target.value)}
              className="rounded-xl border border-xa-border bg-xa-surface text-xa-text text-sm px-3 py-2 flex-1 min-w-0"
              placeholder="Mois"
            />
            <select
              value={filterStatut}
              onChange={(e) => setFilterStatut(e.target.value)}
              className="rounded-xl border border-xa-border bg-xa-surface text-xa-text text-sm px-3 py-2"
            >
              <option value="">Tous statuts</option>
              <option value="a_valider">À valider</option>
              <option value="equilibree">Équilibrée</option>
              <option value="manque">Manque</option>
              <option value="excedent">Excédent</option>
            </select>
          </div>

          {histLoading ? (
            <p className="text-center text-xa-muted text-sm py-10">Chargement…</p>
          ) : (
            <ClotureHistoryList
              key={`${activeBoutiqueId}-${filterMois}-${filterStatut}`}
              initialData={historique}
              filters={{
                boutique_id: activeBoutiqueId,
                mois: filterMois || undefined,
                statut: filterStatut || undefined,
              }}
              onSelectCloture={setSelectedCloture}
            />
          )}
        </div>
      )}

      {/* ── Modals ── */}
      {confirmOpen && stats && cashCompteNum !== null && (
        <ConfirmClotureModal
          boutiqueId={activeBoutiqueId}
          date={date}
          cashCompte={cashCompteNum}
          cashTheorique={stats.cash_theorique}
          ecart={ecart}
          nbTransactions={stats.nb_transactions}
          caCalcule={stats.ca_calcule}
          onClose={() => setConfirmOpen(false)}
          onSuccess={handleClotureSuccess}
        />
      )}

      {selectedCloture && (
        <ClotureDetailModal
          cloture={selectedCloture}
          isOwner={isOwner}
          onClose={() => setSelectedCloture(null)}
          onValidated={handleValidated}
        />
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-2xl shadow-lg text-white text-sm font-medium z-50 transition-all ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-red-500'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
