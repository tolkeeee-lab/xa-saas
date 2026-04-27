import type { Boutique, ProduitPublic } from '@/types/database';

export type { Boutique, ProduitPublic };

/** Active boutique selector — 'all' for consolidated view */
export type BoutiqueActiveId = string | 'all';

export type SortMode = 'az' | 'stock' | 'valeur';

export type StockTabId = 'vue' | 'alertes' | 'perimes' | 'inventaires' | 'transferts' | 'pertes';

export interface StockTab {
  id: StockTabId;
  label: string;
  badge?: number;
}

export const STOCK_TABS: StockTab[] = [
  { id: 'vue', label: 'Vue' },
  { id: 'alertes', label: 'Alertes' },
  { id: 'perimes', label: 'Périmés' },
  { id: 'inventaires', label: 'Inventaires' },
  { id: 'transferts', label: 'Transferts' },
  { id: 'pertes', label: 'Pertes' },
];

/** Computed status for a product */
export type ProduitStatut = 'ok' | 'low' | 'crit' | 'rupt';

export interface ProduitAvecStatut extends ProduitPublic {
  statut: ProduitStatut;
}

export interface StockKpis {
  total: number;
  faibles: number;
  ruptures: number;
}

/** Payload for the stock entry/exit modal */
export type ModalState =
  | { type: 'entree'; produit: ProduitPublic; boutiqueId: string }
  | null;
