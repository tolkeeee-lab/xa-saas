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
