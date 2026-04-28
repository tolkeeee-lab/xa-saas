import type { CartItem } from '@/features/caisse/v4/hooks/useCart';

export type { CartItem };

export type VenteResult = {
  transaction_id: string;
  numero_facture: string;
  created_at: string;
  lignes: {
    produit_id: string;
    nom: string;
    quantite: number;
    prix_unitaire: number;
    sous_total: number;
    emoji?: string;
  }[];
  montant_total: number;
  remise_pct: number;
  remise_montant: number;
  sous_total: number;
  mode_paiement: string;
  montant_recu?: number;
  monnaie_rendue?: number;
  client_nom?: string;
  client_telephone?: string;
  boutique_nom: string;
  boutique_ville?: string | null;
  caissier_nom?: string;
};
