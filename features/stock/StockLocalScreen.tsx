'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase-browser';
import type { Boutique, Produit, ProduitPublic, CategorieProduit } from '@/types/database';
import StockHeader from './components/StockHeader';
import StockTabs, { type StockTab } from './components/StockTabs';
import StockList from './components/StockList';
import ReceptionModal from './modals/ReceptionModal';
import SortieModal from './modals/SortieModal';
import TransfertModal from './modals/TransfertModal';
import HistoriqueModal from './modals/HistoriqueModal';
import NouveauProduitModal from './modals/NouveauProduitModal';

type ModalState =
  | { type: 'reception'; produit: Produit }
  | { type: 'sortie'; produit: Produit }
  | { type: 'transfert'; produit: Produit }
  | { type: 'historique'; produit: Produit }
  | { type: 'nouveau' }
  | null;

type Props = {
  boutiques: Boutique[];
  initialBoutiqueId: string;
};

export default function StockLocalScreen({ boutiques, initialBoutiqueId }: Props) {
  const supabase = createClient();

  const [activeBoutiqueId, setActiveBoutiqueId] = useState(initialBoutiqueId);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [categories, setCategories] = useState<CategorieProduit[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<StockTab>('tous');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<ModalState>(null);

  // ─── Load produits + categories ────────────────────────────────────────────

  const loadProduits = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('produits')
      .select('*')
      .eq('boutique_id', activeBoutiqueId)
      .eq('actif', true)
      .order('nom');
    setProduits((data ?? []) as Produit[]);
    setLoading(false);
  }, [supabase, activeBoutiqueId]);

  const loadCategories = useCallback(async () => {
    const { data } = await supabase
      .from('categories_produits')
      .select('*')
      .order('ordre');
    setCategories((data ?? []) as CategorieProduit[]);
  }, [supabase]);

  useEffect(() => {
    loadProduits();
    loadCategories();
  }, [loadProduits, loadCategories]);

  // ─── Filtered + tabs ───────────────────────────────────────────────────────

  const now = useMemo(() => new Date().toISOString(), []);

  const filteredBySearch = useMemo(() => {
    if (!search.trim()) return produits;
    const q = search.toLowerCase();
    return produits.filter((p) => p.nom.toLowerCase().includes(q) || (p.categorie ?? '').toLowerCase().includes(q));
  }, [produits, search]);

  const tabProduits = useMemo<Record<StockTab, Produit[]>>(() => ({
    tous: filteredBySearch,
    bas: filteredBySearch.filter((p) => p.stock_actuel > 0 && p.stock_actuel <= p.seuil_alerte),
    rupture: filteredBySearch.filter((p) => p.stock_actuel <= 0),
    perime: filteredBySearch.filter((p) => p.date_peremption != null && p.date_peremption < now),
  }), [filteredBySearch, now]);

  const counts = useMemo<Record<StockTab, number>>(() => ({
    tous: tabProduits.tous.length,
    bas: tabProduits.bas.length,
    rupture: tabProduits.rupture.length,
    perime: tabProduits.perime.length,
  }), [tabProduits]);

  const displayedProduits = tabProduits[tab];

  // ─── Helpers to update produit stock locally ────────────────────────────────

  function updateProduitStock(produitId: string, newStock: number) {
    setProduits((prev) =>
      prev.map((p) => (p.id === produitId ? { ...p, stock_actuel: newStock } : p)),
    );
  }

  // ─── Active boutique object ─────────────────────────────────────────────────

  const activeBoutique = boutiques.find((b) => b.id === activeBoutiqueId);

  return (
    <div className="xa-stock-local relative min-h-screen bg-xa-bg">
      {/* Header */}
      <StockHeader
        boutiques={boutiques}
        activeBoutiqueId={activeBoutiqueId}
        onBoutiqueChange={(id) => {
          setActiveBoutiqueId(id);
          setSearch('');
          setTab('tous');
        }}
        search={search}
        onSearchChange={setSearch}
      />

      {/* Tabs */}
      <div className="px-4 py-2">
        <StockTabs active={tab} counts={counts} onChange={setTab} />
      </div>

      {/* List */}
      {loading ? (
        <div className="flex flex-col gap-3 px-4 pb-24">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-xa-surface border border-xa-border animate-pulse" />
          ))}
        </div>
      ) : (
        <StockList
          produits={displayedProduits}
          tab={tab}
          onAction={(produit, action) => setModal({ type: action, produit })}
          onEditProduit={() => { /* edit produit — future */ }}
          onAddProduct={() => setModal({ type: 'nouveau' })}
        />
      )}

      {/* FAB — Nouveau produit */}
      <button
        type="button"
        onClick={() => setModal({ type: 'nouveau' })}
        aria-label="Nouveau produit"
        className="fixed bottom-6 right-4 flex items-center justify-center rounded-full text-white shadow-lg z-30"
        style={{
          width: 56,
          height: 56,
          background: 'var(--xa-primary)',
          boxShadow: '0 4px 16px rgba(0,200,83,.35)',
        }}
      >
        <Plus size={24} />
      </button>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}

      {modal?.type === 'reception' && (
        <ReceptionModal
          produit={modal.produit}
          boutiqueId={activeBoutiqueId}
          onClose={() => setModal(null)}
          onSuccess={(newStock) => {
            updateProduitStock(modal.produit.id, newStock);
            setModal(null);
          }}
        />
      )}

      {modal?.type === 'sortie' && (
        <SortieModal
          produit={modal.produit}
          boutiqueId={activeBoutiqueId}
          onClose={() => setModal(null)}
          onSuccess={(newStock) => {
            updateProduitStock(modal.produit.id, newStock);
            setModal(null);
          }}
        />
      )}

      {modal?.type === 'transfert' && activeBoutique && (
        <TransfertModal
          produit={modal.produit}
          boutiqueSource={activeBoutique}
          autresBoutiques={boutiques}
          onClose={() => setModal(null)}
          onSuccess={(newStock) => {
            updateProduitStock(modal.produit.id, newStock);
            setModal(null);
          }}
        />
      )}

      {modal?.type === 'historique' && (
        <HistoriqueModal
          produit={modal.produit}
          boutiqueId={activeBoutiqueId}
          onClose={() => setModal(null)}
        />
      )}

      {modal?.type === 'nouveau' && (
        <NouveauProduitModal
          boutiques={boutiques}
          defaultBoutiqueId={activeBoutiqueId}
          categories={categories}
          onClose={() => setModal(null)}
          onSuccess={(produit: ProduitPublic) => {
            setModal(null);
            // Reload after adding new product
            void loadProduits();
          }}
          onCategoryCreated={(cat: CategorieProduit) => {
            setCategories((prev) => [...prev, cat]);
          }}
        />
      )}
    </div>
  );
}
