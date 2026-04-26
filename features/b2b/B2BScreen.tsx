'use client';

import { useState, useCallback } from 'react';
import { ShoppingBag } from 'lucide-react';
import type { Boutique, ProduitCatalogueAdmin } from '@/types/database';
import B2BHeader from '@/features/b2b/components/B2BHeader';
import B2BTabs from '@/features/b2b/components/B2BTabs';
import B2BCatalogueGrid from '@/features/b2b/components/B2BCatalogueGrid';
import B2BCommandesList from '@/features/b2b/components/B2BCommandesList';
import B2BPanier from '@/features/b2b/components/B2BPanier';
import ConfirmOrderModal from '@/features/b2b/modals/ConfirmOrderModal';
import CommandeDetailModal from '@/features/b2b/modals/CommandeDetailModal';

type Tab = 'catalogue' | 'commandes';
type Toast = { msg: string; type: 'ok' | 'err' } | null;

type Props = {
  boutiques: Boutique[];
  initialBoutiqueId: string;
  initialCatalogue: ProduitCatalogueAdmin[];
  initialCategories: string[];
};

export default function B2BScreen({
  boutiques,
  initialBoutiqueId,
  initialCatalogue,
  initialCategories,
}: Props) {
  const [tab, setTab] = useState<Tab>('catalogue');
  const [panier, setPanier] = useState<Map<string, number>>(new Map());
  const [panierOpen, setPanierOpen] = useState(false);
  const [activeBoutiqueId, setActiveBoutiqueId] = useState(initialBoutiqueId);
  const [search, setSearch] = useState('');
  const [filterCategorie, setFilterCategorie] = useState('');
  const [confirmOrderOpen, setConfirmOrderOpen] = useState(false);
  const [detailCommandeId, setDetailCommandeId] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast>(null);

  const showToast = useCallback((msg: string, type: 'ok' | 'err') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const addToCart = useCallback((id: string) => {
    setPanier((prev) => {
      const next = new Map(prev);
      next.set(id, (next.get(id) ?? 0) + 1);
      return next;
    });
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setPanier((prev) => {
      const next = new Map(prev);
      const qty = (next.get(id) ?? 0) - 1;
      if (qty <= 0) next.delete(id);
      else next.set(id, qty);
      return next;
    });
  }, []);

  const setQty = useCallback((id: string, qty: number) => {
    setPanier((prev) => {
      const next = new Map(prev);
      if (qty <= 0) next.delete(id);
      else next.set(id, qty);
      return next;
    });
  }, []);

  const handleTabChange = useCallback((t: Tab) => {
    setTab(t);
    if (t === 'commandes') setPanierOpen(false);
  }, []);

  const filteredCatalogue = initialCatalogue.filter((p) => {
    if (filterCategorie && p.categorie !== filterCategorie) return false;
    if (search && !p.nom.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const panierCount = Array.from(panier.values()).reduce((a, b) => a + b, 0);
  const activeBoutique = boutiques.find((b) => b.id === activeBoutiqueId) ?? boutiques[0];

  return (
    <div className="min-h-screen bg-xa-bg">
      <B2BHeader
        boutiques={boutiques}
        activeBoutiqueId={activeBoutiqueId}
        onBoutiqueChange={setActiveBoutiqueId}
        search={search}
        onSearchChange={setSearch}
        filterCategorie={filterCategorie}
        onFilterCategorie={setFilterCategorie}
        categories={initialCategories}
        panierCount={panierCount}
        onPanierOpen={() => setPanierOpen(true)}
      />

      <B2BTabs active={tab} onChange={handleTabChange} commandesEnCours={0} />

      {tab === 'catalogue' && (
        <B2BCatalogueGrid
          produits={filteredCatalogue}
          panier={panier}
          onAdd={addToCart}
          onRemove={removeFromCart}
          loading={false}
        />
      )}

      {tab === 'commandes' && (
        <B2BCommandesList
          activeBoutiqueId={activeBoutiqueId}
          onSelectCommande={setDetailCommandeId}
        />
      )}

      {/* Sticky cart button when panier is closed */}
      {panierCount > 0 && !panierOpen && (
        <button
          type="button"
          onClick={() => setPanierOpen(true)}
          className="fixed bottom-4 right-4 z-50 bg-xa-primary text-white rounded-full p-3 shadow-lg flex items-center gap-2"
        >
          <ShoppingBag size={20} />
          <span className="font-semibold text-sm">{panierCount}</span>
        </button>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-16 right-4 z-50 px-4 py-2 rounded-xl shadow-lg text-white text-sm font-medium ${
            toast.type === 'ok' ? 'bg-xa-primary' : 'bg-red-500'
          }`}
        >
          {toast.msg}
        </div>
      )}

      {panierOpen && (
        <B2BPanier
          panier={panier}
          catalogue={initialCatalogue}
          onClose={() => setPanierOpen(false)}
          onQtyChange={setQty}
          onConfirm={() => {
            setPanierOpen(false);
            setConfirmOrderOpen(true);
          }}
          boutiqueName={activeBoutique.nom}
        />
      )}

      {confirmOrderOpen && activeBoutique && (
        <ConfirmOrderModal
          panier={panier}
          catalogue={initialCatalogue}
          boutique={activeBoutique}
          onClose={() => setConfirmOrderOpen(false)}
          onSuccess={(commandeId) => {
            setConfirmOrderOpen(false);
            setPanier(new Map());
            showToast('Commande soumise avec succès !', 'ok');
            setDetailCommandeId(commandeId);
          }}
        />
      )}

      {detailCommandeId && (
        <CommandeDetailModal
          commandeId={detailCommandeId}
          onClose={() => setDetailCommandeId(null)}
        />
      )}
    </div>
  );
}
