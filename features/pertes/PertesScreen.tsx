'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import type { Boutique, PerteDeclaration } from '@/types/database';
import PertesHeader from '@/features/pertes/components/PertesHeader';
import PertesTabs, { type PertesTab } from '@/features/pertes/components/PertesTabs';
import PertesList from '@/features/pertes/components/PertesList';
import DeclarerPerteModal from '@/features/pertes/modals/DeclarerPerteModal';
import PerteDetailModal from '@/features/pertes/modals/PerteDetailModal';
import ContesterPerteModal from '@/features/pertes/modals/ContesterPerteModal';

type Props = {
  boutiques: Boutique[];
  initialBoutiqueId: string;
  isOwner: boolean;
};

type Counts = {
  toutes: number;
  a_valider: number;
  validees: number;
  contestees: number;
};

export default function PertesScreen({ boutiques, initialBoutiqueId, isOwner }: Props) {
  const [activeBoutiqueId, setActiveBoutiqueId] = useState(initialBoutiqueId);
  const [tab, setTab] = useState<PertesTab>('toutes');
  const [search, setSearch] = useState('');
  const [motifFilter, setMotifFilter] = useState('');

  const [pertes, setPertes] = useState<PerteDeclaration[]>([]);
  const [loading, setLoading] = useState(false);
  const [counts, setCounts] = useState<Counts>({ toutes: 0, a_valider: 0, validees: 0, contestees: 0 });

  const [declarerOpen, setDeclarerOpen] = useState(false);
  const [selectedPerte, setSelectedPerte] = useState<PerteDeclaration | null>(null);
  const [contesterPerte, setContesterPerte] = useState<PerteDeclaration | null>(null);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  const loadPertes = useCallback(
    async (boutiqueId: string, currentTab: PertesTab, q: string, motif: string) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ boutique_id: boutiqueId, page: '1' });

        if (currentTab === 'a_valider') {
          params.set('statut', 'declaree');
        } else if (currentTab === 'contestees') {
          params.set('statut', 'contestee');
        } else if (currentTab === 'validees') {
          params.set('tab', 'validees');
        }

        if (q.trim()) params.set('q', q.trim());
        if (motif) params.set('motif', motif);

        const res = await fetch(`/api/pertes?${params.toString()}`);
        const json = (await res.json()) as {
          data?: PerteDeclaration[];
          counts?: Counts;
          error?: string;
        };

        setPertes(json.data ?? []);
        if (json.counts) setCounts(json.counts);
      } catch {
        setPertes([]);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadPertes(activeBoutiqueId, tab, search, motifFilter);
  }, [activeBoutiqueId, tab, motifFilter, loadPertes]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      void loadPertes(activeBoutiqueId, tab, search, motifFilter);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleDeclarationSuccess() {
    setDeclarerOpen(false);
    showToast('Perte déclarée avec succès !', 'success');
    void loadPertes(activeBoutiqueId, tab, search, motifFilter);
  }

  function handleContestSuccess() {
    setContesterPerte(null);
    setSelectedPerte(null);
    showToast('Perte contestée', 'success');
    void loadPertes(activeBoutiqueId, tab, search, motifFilter);
  }

  return (
    <div className="min-h-screen bg-xa-bg">
      <PertesHeader
        boutiques={boutiques}
        activeBoutiqueId={activeBoutiqueId}
        onBoutiqueChange={(id) => setActiveBoutiqueId(id)}
        search={search}
        onSearchChange={setSearch}
        motifFilter={motifFilter}
        onMotifFilterChange={setMotifFilter}
      />

      <PertesTabs active={tab} onChange={setTab} counts={counts} />

      {/* CTA button */}
      <div className="px-4 pt-4">
        <button
          type="button"
          onClick={() => setDeclarerOpen(true)}
          className="w-full py-4 rounded-2xl bg-xa-primary text-white text-base font-bold flex items-center justify-center gap-2 shadow-sm"
        >
          <Plus size={20} />
          Déclarer une perte
        </button>
      </div>

      <PertesList
        pertes={pertes}
        loading={loading}
        onSelect={setSelectedPerte}
      />

      {/* Modals */}
      {declarerOpen && (
        <DeclarerPerteModal
          boutiqueId={activeBoutiqueId}
          onClose={() => setDeclarerOpen(false)}
          onSuccess={handleDeclarationSuccess}
        />
      )}

      {selectedPerte && !contesterPerte && (
        <PerteDetailModal
          perte={selectedPerte}
          isOwner={isOwner}
          onClose={() => setSelectedPerte(null)}
          onContester={() => setContesterPerte(selectedPerte)}
          onRefresh={() => {
            showToast('Action effectuée !', 'success');
            void loadPertes(activeBoutiqueId, tab, search, motifFilter);
          }}
        />
      )}

      {contesterPerte && (
        <ContesterPerteModal
          perteId={contesterPerte.id}
          produitNom={contesterPerte.produit_nom}
          onClose={() => setContesterPerte(null)}
          onSuccess={handleContestSuccess}
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
