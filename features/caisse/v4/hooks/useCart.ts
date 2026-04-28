'use client';

import { useReducer, useCallback } from 'react';
import type { ProduitPublic } from '@/types/database';

// ─── Types ────────────────────────────────────────────────────────────────────

export type CartItem = {
  produit_id: string;
  nom: string;
  emoji: string;
  unite: string;
  prix_vente: number;
  qty: number;
  stock_actuel: number;
};

type CartState = CartItem[];

type CartAction =
  | { type: 'ADD_ITEM'; payload: { produit: ProduitPublic; emoji: string } }
  | { type: 'SET_QTY'; payload: { produit_id: string; qty: number } }
  | { type: 'UPDATE_QTY'; payload: { produit_id: string; delta: number } }
  | { type: 'REMOVE_ITEM'; payload: { produit_id: string } }
  | { type: 'CLEAR' };

// ─── Reducer ──────────────────────────────────────────────────────────────────

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { produit, emoji } = action.payload;
      const existing = state.find((i) => i.produit_id === produit.id);
      if (existing) {
        if (existing.qty >= produit.stock_actuel) return state;
        return state.map((i) =>
          i.produit_id === produit.id ? { ...i, qty: i.qty + 1 } : i,
        );
      }
      return [
        ...state,
        {
          produit_id: produit.id,
          nom: produit.nom,
          emoji,
          unite: produit.unite,
          prix_vente: produit.prix_vente,
          qty: 1,
          stock_actuel: produit.stock_actuel,
        },
      ];
    }
    case 'UPDATE_QTY': {
      const { produit_id, delta } = action.payload;
      return state
        .map((i) => {
          if (i.produit_id !== produit_id) return i;
          const newQty = i.qty + delta;
          if (newQty <= 0) return null;
          if (newQty > i.stock_actuel) return i;
          return { ...i, qty: newQty };
        })
        .filter((i): i is CartItem => i !== null);
    }
    case 'SET_QTY': {
      const { produit_id, qty } = action.payload;
      if (qty <= 0) return state.filter((i) => i.produit_id !== produit_id);
      return state.map((i) =>
        i.produit_id === produit_id
          ? { ...i, qty: Math.min(qty, i.stock_actuel) }
          : i,
      );
    }
    case 'REMOVE_ITEM':
      return state.filter((i) => i.produit_id !== action.payload.produit_id);
    case 'CLEAR':
      return [];
    default:
      return state;
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCart() {
  const [items, dispatch] = useReducer(cartReducer, []);

  const addItem = useCallback((produit: ProduitPublic, emoji: string) => {
    dispatch({ type: 'ADD_ITEM', payload: { produit, emoji } });
  }, []);

  const updateQty = useCallback((produit_id: string, delta: number) => {
    dispatch({ type: 'UPDATE_QTY', payload: { produit_id, delta } });
  }, []);

  const setQty = useCallback((produit_id: string, qty: number) => {
    dispatch({ type: 'SET_QTY', payload: { produit_id, qty } });
  }, []);

  const removeItem = useCallback((produit_id: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { produit_id } });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR' });
  }, []);

  const totalItems = items.reduce((s, i) => s + i.qty, 0);
  const nbProduits = items.length;

  return { items, addItem, updateQty, setQty, removeItem, clearCart, totalItems, nbProduits };
}
