import type { Boutique, ProduitPublic } from '@/types/database';

export type { Boutique, ProduitPublic };

/** Active boutique selector — 'all' for consolidated view */
export type BoutiqueActiveId = string | 'all';

export type SortMode = 'az' | 'stock' | 'valeur';

export type StockTabId = 'vue' | 'alertes' | 'perimes' | 'inventaires' | 'transferts' | 'pertes';

export interface StockTab {
  id: StockTabId;
  label: string;
  icon: string;
  badge?: number;
}

export const STOCK_TABS: StockTab[] = [
  { id: 'vue', label: 'Vue', icon: 'Eye' },
  { id: 'alertes', label: 'Alertes', icon: 'Bell' },
  { id: 'perimes', label: 'Périmés', icon: 'Clock' },
  { id: 'inventaires', label: 'Inventaires', icon: 'ClipboardList' },
  { id: 'transferts', label: 'Transferts', icon: 'ArrowLeftRight' },
  { id: 'pertes', label: 'Pertes', icon: 'Trash2' },
];

/** Computed status for a product */
export type ProduitStatut = 'ok' | 'low' | 'crit' | 'rupt';

export interface ProduitAvecStatut extends ProduitPublic {
  statut: ProduitStatut;
}

export interface StockKpis {
  produits: number;
  alertes: number;
  valeurStock: number;
  /** @deprecated use produits */
  total: number;
  /** @deprecated use alertes */
  faibles: number;
  /** @deprecated */
  ruptures: number;
}

/** Payload for the stock entry/exit modal */
export type ModalState =
  | { type: 'entree'; produit: ProduitPublic; boutiqueId: string }
  | null;
