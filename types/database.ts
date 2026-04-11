export type Profile = {
  id: string;
  role: 'super_admin' | 'proprio';
  nom_complet: string | null;
  telephone: string | null;
  created_at: string;
  updated_at: string;
};

export type Boutique = {
  id: string;
  proprietaire_id: string;
  nom: string;
  ville: string;
  quartier: string | null;
  code_unique: string;
  pin_caisse: string;
  couleur_theme: string;
  actif: boolean;
  created_at: string;
  updated_at: string;
};

export type Employe = {
  id: string;
  boutique_id: string;
  proprietaire_id: string;
  nom: string;
  prenom: string;
  telephone: string | null;
  role: 'caissier' | 'gerant';
  pin: string;
  actif: boolean;
  created_at: string;
  updated_at: string;
};

export type Produit = {
  id: string;
  boutique_id: string;
  nom: string;
  description: string | null;
  prix_achat: number;
  prix_vente: number;
  stock_actuel: number;
  seuil_alerte: number;
  unite: string;
  actif: boolean;
  created_at: string;
  updated_at: string;
};

// ProduitPublic — sans prix_achat, pour la caisse
export type ProduitPublic = Omit<Produit, 'prix_achat'>;

export type Transaction = {
  id: string;
  local_id: string | null;
  boutique_id: string;
  employe_id: string | null;
  montant_total: number;
  benefice_total: number;
  montant_recu: number;
  monnaie_rendue: number;
  mode_paiement: 'cash' | 'momo' | 'dette';
  client_nom: string | null;
  statut: 'validee' | 'annulee';
  sync_statut: 'local' | 'synced' | 'conflict';
  created_at: string;
  updated_at: string;
};

export type TransactionLigne = {
  id: string;
  transaction_id: string;
  produit_id: string | null;
  nom_produit: string;
  quantite: number;
  prix_vente_unitaire: number;
  prix_achat_unitaire: number;
  sous_total: number;
  created_at: string;
};

export type Dette = {
  id: string;
  boutique_id: string;
  type: 'fournisseur' | 'client';
  nom_entite: string;
  montant: number;
  montant_paye: number;
  statut: 'non_paye' | 'partiel' | 'paye';
  date_echeance: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'> &
          Partial<Pick<Profile, 'created_at' | 'updated_at'>>;
        Update: Partial<Omit<Profile, 'id'>>;
      };
      boutiques: {
        Row: Boutique;
        Insert: Omit<Boutique, 'id' | 'created_at' | 'updated_at'> &
          Partial<Pick<Boutique, 'id' | 'created_at' | 'updated_at'>>;
        Update: Partial<Omit<Boutique, 'id'>>;
      };
      employes: {
        Row: Employe;
        Insert: Omit<Employe, 'id' | 'created_at' | 'updated_at'> &
          Partial<Pick<Employe, 'id' | 'created_at' | 'updated_at'>>;
        Update: Partial<Omit<Employe, 'id'>>;
      };
      produits: {
        Row: Produit;
        Insert: Omit<Produit, 'id' | 'created_at' | 'updated_at'> &
          Partial<Pick<Produit, 'id' | 'created_at' | 'updated_at'>>;
        Update: Partial<Omit<Produit, 'id'>>;
      };
      transactions: {
        Row: Transaction;
        Insert: Omit<Transaction, 'id' | 'created_at' | 'updated_at'> &
          Partial<Pick<Transaction, 'id' | 'created_at' | 'updated_at'>>;
        Update: Partial<Omit<Transaction, 'id'>>;
      };
      transaction_lignes: {
        Row: TransactionLigne;
        Insert: Omit<TransactionLigne, 'id' | 'created_at'> &
          Partial<Pick<TransactionLigne, 'id' | 'created_at'>>;
        Update: Partial<Omit<TransactionLigne, 'id'>>;
      };
      dettes: {
        Row: Dette;
        Insert: Omit<Dette, 'id' | 'created_at' | 'updated_at'> &
          Partial<Pick<Dette, 'id' | 'created_at' | 'updated_at'>>;
        Update: Partial<Omit<Dette, 'id'>>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
