'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Boutique, ProduitPublic } from '@/types/database';
import ProduitCard from './ProduitCard';
import Panier, { type CartItem, type PayMode } from './Panier';
import TicketCaisse, { type TicketData } from './TicketCaisse';

const CATEGORIES = ['Tous', 'Épicerie', 'Boissons', 'Hygiène', 'Frais', 'Boulangerie'];

interface CaissePosProps {
  boutiques: Boutique[];
  produits: ProduitPublic[];
  userId: string;
}

export default function CaissePos({ boutiques, produits: initialProduits }: CaissePosProps) {
  const [boutiqueActive, setBoutiqueActive] = useState(boutiques[0]?.id ?? '');
  const [produits, setProduits] = useState<ProduitPublic[]>(initialProduits);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [payMode, setPayMode] = useState<PayMode>('especes');
  const [categorie, setCategorie] = useState('Tous');
  const [recherche, setRecherche] = useState('');
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingProduits, setFetchingProduits] = useState(false);

  // Re-fetch products when boutique changes
  useEffect(() => {
    if (!boutiqueActive) return;
    setFetchingProduits(true);
    fetch(`/api/produits?boutique_id=${boutiqueActive}`)
      .then((r) => r.json())
      .then((data: ProduitPublic[]) => {
        setProduits(Array.isArray(data) ? data : []);
        setCart([]);
      })
      .finally(() => setFetchingProduits(false));
  }, [boutiqueActive]);

  const produitsFiltres = useMemo(() => {
    return produits.filter((p) => {
      const matchCat = categorie === 'Tous' || p.categorie === categorie;
      const matchSearch = p.nom.toLowerCase().includes(recherche.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [produits, categorie, recherche]);

  const addToCart = useCallback(
    (produit: ProduitPublic) => {
      setCart((prev) => {
        const existing = prev.find((i) => i.produit_id === produit.id);
        if (existing) {
          if (existing.qty >= existing.stock_actuel) return prev;
          return prev.map((i) =>
            i.produit_id === produit.id ? { ...i, qty: i.qty + 1 } : i,
          );
        }
        return [
          ...prev,
          {
            produit_id: produit.id,
            nom: produit.nom,
            prix_vente: produit.prix_vente,
            qty: 1,
            stock_actuel: produit.stock_actuel,
            unite: produit.unite,
          },
        ];
      });
    },
    [],
  );

  const updateCart = useCallback((produitId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((i) => (i.produit_id === produitId ? { ...i, qty: i.qty + delta } : i))
        .filter((i) => i.qty > 0);
    });
  }, []);

  async function validerVente() {
    if (cart.length === 0) return;
    setLoading(true);

    const sousTotal = cart.reduce((s, i) => s + i.prix_vente * i.qty, 0);
    const remise = sousTotal >= 50000 ? Math.round(sousTotal * 0.05) : 0;
    const montant_total = sousTotal - remise;

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boutique_id: boutiqueActive,
          lignes: cart.map((i) => ({
            produit_id: i.produit_id,
            quantite: i.qty,
            prix_unitaire: i.prix_vente,
          })),
          mode_paiement: payMode,
          montant_total,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error ?? 'Erreur lors de la validation');
        return;
      }

      const boutique = boutiques.find((b) => b.id === boutiqueActive);
      setTicket({
        ...data,
        boutique_nom: boutique?.nom ?? 'Boutique',
      } as TicketData);

      // Refresh product list to reflect updated stocks
      const updated = await fetch(`/api/produits?boutique_id=${boutiqueActive}`).then((r) =>
        r.json(),
      );
      if (Array.isArray(updated)) setProduits(updated);
    } finally {
      setLoading(false);
    }
  }

  function nouvelleVente() {
    setCart([]);
    setTicket(null);
  }

  const activeBoutique = boutiques.find((b) => b.id === boutiqueActive);

  if (ticket) {
    return (
      <div className="h-[calc(100vh-120px)]">
        <TicketCaisse ticket={ticket} onNouvelleVente={nouvelleVente} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* Top bar: boutique selector + caisse info */}
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <select
          value={boutiqueActive}
          onChange={(e) => setBoutiqueActive(e.target.value)}
          className="px-3 py-2 rounded-lg border border-xa-border bg-xa-surface text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary"
        >
          {boutiques.map((b) => (
            <option key={b.id} value={b.id}>
              {b.nom}
            </option>
          ))}
        </select>
        {activeBoutique && (
          <span className="text-xs text-xa-muted">
            Caisse principale — {activeBoutique.nom}
          </span>
        )}
      </div>

      {/* Main grid: catalogue | panier */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-[1fr_290px] gap-0 overflow-hidden rounded-xl border border-xa-border">
        {/* Catalogue */}
        <div className="flex flex-col overflow-hidden">
          {/* Filters */}
          <div className="px-4 py-3 border-b border-xa-border flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategorie(cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  categorie === cat
                    ? 'bg-xa-primary text-white'
                    : 'bg-xa-bg text-xa-muted hover:text-xa-text'
                }`}
              >
                {cat}
              </button>
            ))}
            <input
              type="text"
              placeholder="Rechercher…"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              className="ml-auto px-3 py-1 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-xs focus:outline-none focus:ring-2 focus:ring-xa-primary"
            />
          </div>

          {/* Product grid */}
          <div className="flex-1 overflow-y-auto p-3">
            {fetchingProduits ? (
              <div className="flex justify-center py-12">
                <div className="w-6 h-6 rounded-full border-2 border-xa-primary border-t-transparent animate-spin" />
              </div>
            ) : produitsFiltres.length === 0 ? (
              <p className="text-center text-xa-muted text-sm py-12">Aucun produit trouvé</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {produitsFiltres.map((p) => (
                  <ProduitCard key={p.id} produit={p} onAdd={() => addToCart(p)} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Panier */}
        <Panier
          items={cart}
          onUpdate={updateCart}
          payMode={payMode}
          onPayModeChange={setPayMode}
          onValider={validerVente}
          loading={loading}
          boutiqueName={activeBoutique?.nom ?? ''}
        />
      </div>
    </div>
  );
}
