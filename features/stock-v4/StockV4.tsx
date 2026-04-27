'use client';

import { useState, useEffect } from 'react';
import type { Boutique } from '@/types/database';
import type { BoutiqueActiveId, StockTabId, ModalState, SortMode } from './types';
import { useStockData } from './hooks/useStockData';
import StockHeader from './components/StockHeader';
import StockTabBar from './components/StockTabBar';
import VueTab from './components/tabs/VueTab';
import AlertesTab from './components/tabs/AlertesTab';
import PerimesTab from './components/tabs/PerimesTab';
import InventairesTab from './components/tabs/InventairesTab';
import TransfertsTab from './components/tabs/TransfertsTab';
import PertesTab from './components/tabs/PertesTab';
import EntreeStockModal from './components/EntreeStockModal';
import './stock-v4.css';

const BOUTIQUE_STORAGE_KEY = 'xa-stock-boutique-active';

interface StockV4Props {
  boutiques: Boutique[];
  userId: string;
}

export default function StockV4({ boutiques }: StockV4Props) {
  // ── Boutique ─────────────────────────────────────────────────────────────────
  const [boutiqueActive, setBoutiqueActive] = useState<BoutiqueActiveId>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(BOUTIQUE_STORAGE_KEY);
      if (stored === 'all') return 'all';
      if (stored && boutiques.some((b) => b.id === stored)) return stored;
    }
    return boutiques.length > 1 ? 'all' : (boutiques[0]?.id ?? 'all');
  });

  function handleBoutiqueChange(id: BoutiqueActiveId) {
    setBoutiqueActive(id);
    if (typeof window !== 'undefined') {
      localStorage.setItem(BOUTIQUE_STORAGE_KEY, id);
    }
  }

  // ── Tab ───────────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<StockTabId>('vue');

  // ── Search / sort / cat ───────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('az');
  const [catActive, setCatActive] = useState('Toutes');

  // ── Stock data ────────────────────────────────────────────────────────────────
  const boutiqueIds = boutiques.map((b) => b.id);
  const { filteredProduits, categories, kpis, loading, updateProduitStock, reload } = useStockData(
    { boutiqueIds, boutiqueActive },
    search,
    catActive,
    sortMode,
  );

  // Alert badge: products with low/crit/rupt status
  const alerteBadge = filteredProduits.filter(
    (p) => p.statut === 'low' || p.statut === 'crit' || p.statut === 'rupt',
  ).length;

  // Périmés badge: products with DLC expired or within 7 days
  const perimeBadge = filteredProduits.filter((p) => {
    if (!p.date_peremption) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dlc = new Date(p.date_peremption);
    dlc.setHours(0, 0, 0, 0);
    const diffDays = Math.round((dlc.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  }).length;

  // Sync timestamp
  const [syncTime] = useState(() => Date.now());
  const [syncLabel, setSyncLabel] = useState('');
  useEffect(() => {
    function update() {
      const diffMin = Math.floor((Date.now() - syncTime) / 60000);
      setSyncLabel(diffMin < 1 ? 'à l\'instant' : `il y a ${diffMin} min`);
    }
    update();
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
  }, [syncTime]);

  // ── Modal ─────────────────────────────────────────────────────────────────────
  const [modal, setModal] = useState<ModalState>(null);

  function handleModalSuccess(newStock: number) {
    if (modal?.type === 'entree') {
      updateProduitStock(modal.produit.id, newStock);
    }
    setModal(null);
  }

  return (
    <div className="xa-stock-v4">
      {/* Header: logo, title, boutique switcher */}
      <StockHeader
        boutiques={boutiques}
        boutiqueActive={boutiqueActive}
        onBoutiqueChange={handleBoutiqueChange}
      />

      {/* Sync bar */}
      <div className="v4-sync-bar">
        <span className="v4-sync-dot" />
        <span>☁ Synchronisé</span>
        {syncLabel ? <span className="v4-sync-time">{syncLabel}</span> : null}
      </div>

      {/* Consolidated banner */}
      {boutiqueActive === 'all' && boutiques.length > 1 && (
        <div className="v4-banner-all">
          <span>🏪</span>
          <span>Vue consolidée — {boutiques.length} boutiques</span>
        </div>
      )}

      {/* Tab bar */}
      <StockTabBar
        active={activeTab}
        onChange={setActiveTab}
        alerteBadge={alerteBadge}
        perimeBadge={perimeBadge}
      />

      {/* Active panel */}
      <div className="v4-panel">
        {activeTab === 'vue' && (
          <VueTab
            produits={filteredProduits}
            kpis={kpis}
            loading={loading}
            search={search}
            onSearchChange={(v) => setSearch(v)}
            sortMode={sortMode}
            onSortChange={setSortMode}
            catActive={catActive}
            onCatChange={setCatActive}
            categories={categories}
            boutiqueActive={boutiqueActive}
            boutiques={boutiques}
            onOpenModal={setModal}
          />
        )}
        {activeTab === 'alertes' && (
          <AlertesTab
            produits={filteredProduits}
            loading={loading}
            boutiqueActive={boutiqueActive}
            boutiques={boutiques}
            onOpenModal={setModal}
          />
        )}
        {activeTab === 'perimes' && (
          <PerimesTab
            produits={filteredProduits}
            loading={loading}
            boutiqueActive={boutiqueActive}
            boutiques={boutiques}
            onRefresh={reload}
          />
        )}
        {activeTab === 'inventaires' && (
          <InventairesTab boutiques={boutiques} boutiqueActive={boutiqueActive} />
        )}
        {activeTab === 'transferts' && (
          <TransfertsTab boutiques={boutiques} boutiqueActive={boutiqueActive} />
        )}
        {activeTab === 'pertes' && (
          <PertesTab boutiques={boutiques} boutiqueActive={boutiqueActive} />
        )}
      </div>

      {/* Entry/exit modal */}
      {modal?.type === 'entree' && (
        <EntreeStockModal
          produit={modal.produit}
          boutiqueId={modal.boutiqueId}
          onClose={() => setModal(null)}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
}
