'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient as createBrowserClient } from '@/lib/supabase-browser';
import type { ProduitPublic } from '@/types/database';
import type { BoutiqueActiveId, SortMode, ProduitAvecStatut, StockKpis } from '../types';

interface UseStockDataOptions {
  boutiqueIds: string[];
  boutiqueActive: BoutiqueActiveId;
}

export interface StockDataResult {
  produits: ProduitPublic[];
  loading: boolean;
  reload: () => void;
  updateProduitStock: (produitId: string, newStock: number) => void;
  filteredProduits: ProduitAvecStatut[];
  categories: string[];
  kpis: StockKpis;
}

function getStatut(p: ProduitPublic): ProduitAvecStatut['statut'] {
  if (p.stock_actuel <= 0) return 'rupt';
  if (p.stock_actuel <= p.seuil_alerte * 0.5) return 'crit';
  if (p.stock_actuel <= p.seuil_alerte) return 'low';
  return 'ok';
}

export function useStockData(
  { boutiqueIds, boutiqueActive }: UseStockDataOptions,
  search: string,
  catActive: string,
  sortMode: SortMode,
): StockDataResult {
  const [produits, setProduits] = useState<ProduitPublic[]>([]);
  const [loading, setLoading] = useState(true);

  const activeBoutiqueIds = useMemo(() => {
    if (boutiqueActive === 'all') return boutiqueIds;
    return boutiqueIds.includes(boutiqueActive) ? [boutiqueActive] : boutiqueIds.slice(0, 1);
  }, [boutiqueIds, boutiqueActive]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const activeBoutiqueIdsKey = activeBoutiqueIds.join(',');

  const load = useCallback(async () => {
    if (activeBoutiqueIds.length === 0) {
      setProduits([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const supabase = createBrowserClient();
    const { data } = await supabase
      .from('produits')
      .select(
        'id, boutique_id, nom, categorie, description, prix_vente, stock_actuel, seuil_alerte, unite, actif, date_peremption, created_at, updated_at',
      )
      .in('boutique_id', activeBoutiqueIds)
      .eq('actif', true)
      .order('nom', { ascending: true });
    setProduits((data ?? []) as ProduitPublic[]);
    setLoading(false);
  }, [activeBoutiqueIdsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    void load();
  }, [load]);

  const updateProduitStock = useCallback((produitId: string, newStock: number) => {
    setProduits((prev) =>
      prev.map((p) => (p.id === produitId ? { ...p, stock_actuel: newStock } : p)),
    );
  }, []);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(produits.map((p) => p.categorie ?? 'Général').filter(Boolean)));
    return cats.sort();
  }, [produits]);

  const filteredProduits = useMemo<ProduitAvecStatut[]>(() => {
    let list = produits;

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.nom.toLowerCase().includes(q) ||
          (p.categorie ?? '').toLowerCase().includes(q),
      );
    }

    // Category filter
    if (catActive && catActive !== 'Toutes') {
      list = list.filter((p) => (p.categorie ?? 'Général') === catActive);
    }

    // Sort
    const withStatut: ProduitAvecStatut[] = list.map((p) => ({ ...p, statut: getStatut(p) }));

    switch (sortMode) {
      case 'az':
        return withStatut.sort((a, b) => a.nom.localeCompare(b.nom));
      case 'stock':
        return withStatut.sort((a, b) => a.stock_actuel - b.stock_actuel);
      case 'valeur':
        return withStatut.sort(
          (a, b) => b.prix_vente * b.stock_actuel - a.prix_vente * a.stock_actuel,
        );
      default:
        return withStatut;
    }
  }, [produits, search, catActive, sortMode]);

  const kpis = useMemo<StockKpis>(() => {
    const produitCount = produits.length;
    const alerteCount = produits.filter(
      (p) => p.stock_actuel <= 0 || p.stock_actuel <= p.seuil_alerte,
    ).length;
    const valeurStock = produits.reduce((acc, p) => acc + p.stock_actuel * p.prix_vente, 0);
    // legacy fields kept for backward-compat
    const total = produits.reduce((acc, p) => acc + p.stock_actuel, 0);
    const faibles = produits.filter(
      (p) => p.stock_actuel > 0 && p.stock_actuel <= p.seuil_alerte,
    ).length;
    const ruptures = produits.filter((p) => p.stock_actuel <= 0).length;
    return { produits: produitCount, alertes: alerteCount, valeurStock, total, faibles, ruptures };
  }, [produits]);

  return {
    produits,
    loading,
    reload: load,
    updateProduitStock,
    filteredProduits,
    categories,
    kpis,
  };
}
 
