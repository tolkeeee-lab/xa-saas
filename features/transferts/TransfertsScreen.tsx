'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import type { Boutique, TransfertStock } from '@/types/database';
import TransfertsHeader from '@/features/transferts/components/TransfertsHeader';
import TransfertsTabs, { type TransfertsTab } from '@/features/transferts/components/TransfertsTabs';
import TransfertsList from '@/features/transferts/components/TransfertsList';
import NouveauTransfertModal from '@/features/transferts/modals/NouveauTransfertModal';
import RecevoirTransfertModal from '@/features/transferts/modals/RecevoirTransfertModal';
import TransfertDetailModal from '@/features/transferts/modals/TransfertDetailModal';

type ProduitInfo = {
  id: string;
  nom: string;
  categorie?: string | null;
};

type Counts = {
  a_recevoir: number;
  envoyes: number;
  recus: number;
  annules: number;
};

type DetailResponse = {
  data: TransfertStock;
  boutique_source: { id: string; nom: string; couleur_theme: string } | null;
  boutique_destination: { id: string; nom: string; couleur_theme: string } | null;
  produit: { id: string; nom: string; unite: string | null; categorie: string | null } | null;
  canReceive: boolean;
  canCancel: boolean;
};

type Props = {
  boutiques: Boutique[];
  produits: ProduitInfo[];
};

export default function TransfertsScreen({ boutiques, produits: initialProduits }: Props) {
  const [tab, setTab] = useState<TransfertsTab>('a_recevoir');
  const [sourceFilter, setSourceFilter] = useState('');
  const [destFilter, setDestFilter] = useState('');
  const [search, setSearch] = useState('');

  const [transferts, setTransferts] = useState<TransfertStock[]>([]);
  const [produits] = useState<ProduitInfo[]>(initialProduits);
  const [loading, setLoading] = useState(false);
  const [counts, setCounts] = useState<Counts>({ a_recevoir: 0, envoyes: 0, recus: 0, annules: 0 });

  const [nouveauOpen, setNouveauOpen] = useState(false);
  const [selectedTransfert, setSelectedTransfert] = useState<TransfertStock | null>(null);
  const [detailData, setDetailData] = useState<DetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [recevoirTransfert, setRecevoirTransfert] = useState<TransfertStock | null>(null);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  const loadTransferts = useCallback(
    async (currentTab: TransfertsTab, src: string, dest: string) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ tab: currentTab, page: '1' });
        if (src) params.set('source_id', src);
        if (dest) params.set('dest_id', dest);

        const res = await fetch(`/api/transferts?${params.toString()}`);
        const json = (await res.json()) as {
          data?: TransfertStock[];
          counts?: Counts;
          error?: string;
        };

        setTransferts(json.data ?? []);
        if (json.counts) setCounts(json.counts);
      } catch {
        setTransferts([]);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadTransferts(tab, sourceFilter, destFilter);
  }, [tab, sourceFilter, destFilter, loadTransferts]);

  async function handleSelectTransfert(t: TransfertStock) {
    setSelectedTransfert(t);
    setDetailLoading(true);
    setDetailData(null);
    try {
      const res = await fetch(`/api/transferts/${t.id}`);
      if (res.ok) {
        const json = (await res.json()) as DetailResponse;
        setDetailData(json);
      }
    } catch {
      // use base data
    } finally {
      setDetailLoading(false);
    }
  }

  function handleSuccess() {
    showToast('Transfert créé avec succès.', 'success');
    void loadTransferts(tab, sourceFilter, destFilter);
  }

  function handleRecevoirSuccess() {
    showToast('Transfert reçu avec succès.', 'success');
    setRecevoirTransfert(null);
    setSelectedTransfert(null);
    setDetailData(null);
    void loadTransferts(tab, sourceFilter, destFilter);
  }

  function handleRefresh() {
    void loadTransferts(tab, sourceFilter, destFilter);
  }

  const filteredTransferts = search
    ? transferts.filter((t) => {
        const p = produits.find((pr) => pr.id === t.produit_id);
        return p?.nom.toLowerCase().includes(search.toLowerCase());
      })
    : transferts;

  return (
    <div className="flex flex-col min-h-screen bg-xa-bg">
      <TransfertsHeader
        boutiques={boutiques}
        sourceFilter={sourceFilter}
        destFilter={destFilter}
        search={search}
        onSourceChange={setSourceFilter}
        onDestChange={setDestFilter}
        onSearchChange={setSearch}
      />

      <TransfertsTabs active={tab} onChange={setTab} counts={counts} />

      <div className="flex-1 overflow-y-auto pb-24">
        <TransfertsList
          transferts={filteredTransferts}
          boutiques={boutiques}
          produits={produits}
          loading={loading}
          onSelect={handleSelectTransfert}
        />
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-xa-bg/80 backdrop-blur-sm border-t border-xa-border z-10">
        <button
          type="button"
          onClick={() => setNouveauOpen(true)}
          disabled={boutiques.length < 2}
          className="w-full max-w-sm mx-auto flex items-center justify-center gap-2 bg-xa-primary text-white font-semibold rounded-2xl py-3 text-sm shadow-lg disabled:opacity-50 min-h-[44px]"
        >
          <Plus size={18} />
          Nouveau transfert
        </button>
        {boutiques.length < 2 && (
          <p className="text-xs text-xa-muted text-center mt-1">
            Vous avez besoin d&apos;au moins 2 boutiques pour créer un transfert.
          </p>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white transition-all ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Modals */}
      {nouveauOpen && (
        <NouveauTransfertModal
          boutiques={boutiques}
          onClose={() => setNouveauOpen(false)}
          onSuccess={handleSuccess}
        />
      )}

      {selectedTransfert && !recevoirTransfert && (
        <TransfertDetailModal
          transfert={selectedTransfert}
          boutiques={boutiques}
          produitNom={
            detailData?.produit?.nom ??
            produits.find((p) => p.id === selectedTransfert.produit_id)?.nom
          }
          canReceive={detailData?.canReceive ?? false}
          canCancel={detailData?.canCancel ?? false}
          onClose={() => { setSelectedTransfert(null); setDetailData(null); }}
          onRecevoir={() => setRecevoirTransfert(selectedTransfert)}
          onRefresh={handleRefresh}
        />
      )}

      {recevoirTransfert && (
        <RecevoirTransfertModal
          transfert={recevoirTransfert}
          boutiques={boutiques}
          produitNom={
            detailData?.produit?.nom ??
            produits.find((p) => p.id === recevoirTransfert.produit_id)?.nom
          }
          onClose={() => setRecevoirTransfert(null)}
          onSuccess={handleRecevoirSuccess}
        />
      )}

      {/* Detail loading indicator */}
      {detailLoading && selectedTransfert && !detailData && (
        <div className="xa-modal-backdrop">
          <div className="xa-modal-box">
            <div className="xa-modal-body flex items-center justify-center py-8">
              <div className="text-xa-muted text-sm">Chargement…</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

