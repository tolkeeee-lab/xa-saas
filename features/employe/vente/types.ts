export interface VenteKpi {
  ca_jour: number;
  nb_ventes_jour: number;
  total_dettes: number;
  ca_mois: number;
}

export interface BoutiqueInfo {
  id: string;
  nom: string;
  ville: string | null;
  couleur_theme: string | null;
}

export interface EmployeInfo {
  id: string;
  nom: string;
  prenom: string;
  role: string;
}

export type VenteTab = 'ventes' | 'historique' | 'dettes';

export interface TransactionLigne {
  produit_id: string | null;
  nom_produit: string;
  quantite: number;
  prix_vente_unitaire: number;
  sous_total: number;
}

export interface Transaction {
  id: string;
  created_at: string;
  montant_total: number;
  benefice_total: number;
  mode_paiement: string;
  client_nom: string | null;
  employe_id: string | null;
  statut: string;
  lignes: TransactionLigne[];
}

export interface TopProduit {
  produit_id: string | null;
  nom_produit: string;
  total_qte: number;
  total_rev: number;
}

export type PeriodeKey = '7j' | '30j' | 'mois' | 'annee';

export interface TransactionGroupe {
  label: string;
  transactions: Transaction[];
  total_ca: number;
  nb_ventes: number;
}
