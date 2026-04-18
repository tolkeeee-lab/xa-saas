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
  categorie: string;
  description: string | null;
  prix_achat: number;
  prix_vente: number;
  stock_actuel: number;
  seuil_alerte: number;
  unite: string;
  actif: boolean;
  date_peremption: string | null;
  created_at: string;
  updated_at: string;
};

export type Transfert = {
  id: string;
  produit_id: string | null;
  boutique_source_id: string | null;
  boutique_destination_id: string | null;
  quantite: number;
  note: string | null;
  statut: 'en_transit' | 'livre';
  created_at: string;
};

// ProduitPublic — sans prix_achat, pour la caisse
export type ProduitPublic = Omit<Produit, 'prix_achat'>;

export type Transaction = {
  id: string;
  local_id: string | null;
  boutique_id: string;
  employe_id: string | null;
  client_id?: string | null;
  montant_total: number;
  benefice_total: number;
  montant_recu: number;
  monnaie_rendue: number;
  mode_paiement: 'especes' | 'momo' | 'carte' | 'credit';
  client_nom: string | null;
  statut: 'validee' | 'annulee';
  sync_statut: 'local' | 'synced' | 'conflict';
  created_at: string;
  updated_at: string;
};

export type Client = {
  id: string;
  proprietaire_id: string;
  nom: string;
  telephone: string | null;
  points: number;
  total_achats: number;
  nb_visites: number;
  actif: boolean;
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
  client_nom: string;
  client_telephone: string | null;
  montant: number;
  montant_rembourse: number;
  description: string | null;
  statut: 'en_attente' | 'paye' | 'en_retard';
  date_echeance: string | null;
  created_at: string;
};

export type Fournisseur = {
  id: string;
  proprietaire_id: string;
  nom: string;
  specialite: string | null;
  delai_livraison: string | null;
  note: number;
  telephone: string | null;
  created_at: string;
};

export type CommandeFournisseur = {
  id: string;
  fournisseur_id: string;
  boutique_id: string;
  montant: number;
  statut: 'en_attente' | 'en_cours' | 'recu';
  note: string | null;
  created_at: string;
};

export type ChargeFixe = {
  id: string;
  proprietaire_id: string;
  boutique_id: string | null;
  libelle: string;
  categorie: 'loyer' | 'salaire' | 'fournisseur' | 'autre';
  montant: number;
  periodicite: 'mensuel' | 'hebdo' | 'annuel';
  actif: boolean;
  created_at: string;
  updated_at: string;
};

export type DetteProprio = {
  id: string;
  proprietaire_id: string;
  libelle: string;
  creancier: string;
  montant: number;
  montant_rembourse: number;
  date_echeance: string | null;
  statut: 'en_cours' | 'rembourse' | 'en_retard';
  notes: string | null;
  actif: boolean;
  created_at: string;
  updated_at: string;
};

export type CaisseTerminal = {
  id: string;
  boutique_id: string;
  terminal_id: string;
  label: string | null;
  first_seen_at: string;
  last_seen_at: string;
  last_ip: string | null;
  statut: 'actif' | 'revoque';
  created_at: string;
};

export type ClotureCaisse = {
  id: string;
  boutique_id: string;
  proprietaire_id: string;
  date: string;
  ca_theorique: number;
  cash_theorique: number;
  cash_reel: number;
  ecart: number;
  nb_transactions: number;
  par_mode: Record<string, number>;
  note: string | null;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'> &
          Partial<Pick<Profile, 'created_at' | 'updated_at'>>;
        Update: Partial<Omit<Profile, 'id'>>;
        Relationships: [];
      };
      boutiques: {
        Row: Boutique;
        Insert: Omit<Boutique, 'id' | 'created_at' | 'updated_at'> &
          Partial<Pick<Boutique, 'id' | 'created_at' | 'updated_at'>>;
        Update: Partial<Omit<Boutique, 'id'>>;
        Relationships: [];
      };
      employes: {
        Row: Employe;
        Insert: Omit<Employe, 'id' | 'created_at' | 'updated_at'> &
          Partial<Pick<Employe, 'id' | 'created_at' | 'updated_at'>>;
        Update: Partial<Omit<Employe, 'id'>>;
        Relationships: [];
      };
      produits: {
        Row: Produit;
        Insert: Omit<Produit, 'id' | 'created_at' | 'updated_at' | 'categorie' | 'date_peremption'> &
          Partial<Pick<Produit, 'id' | 'created_at' | 'updated_at' | 'categorie' | 'date_peremption'>>;
        Update: Partial<Omit<Produit, 'id'>>;
        Relationships: [];
      };
      transactions: {
        Row: Transaction;
        Insert: Omit<Transaction, 'id' | 'created_at' | 'updated_at' | 'local_id' | 'employe_id' | 'client_nom' | 'client_id'> &
          Partial<Pick<Transaction, 'id' | 'created_at' | 'updated_at' | 'local_id' | 'employe_id' | 'client_nom' | 'client_id'>>;
        Update: Partial<Omit<Transaction, 'id'>>;
        Relationships: [];
      };
      transaction_lignes: {
        Row: TransactionLigne;
        Insert: Omit<TransactionLigne, 'id' | 'created_at'> &
          Partial<Pick<TransactionLigne, 'id' | 'created_at'>>;
        Update: Partial<Omit<TransactionLigne, 'id'>>;
        Relationships: [];
      };
      dettes: {
        Row: Dette;
        Insert: Omit<Dette, 'id' | 'created_at'> &
          Partial<Pick<Dette, 'id' | 'created_at'>>;
        Update: Partial<Omit<Dette, 'id'>>;
        Relationships: [];
      };
      fournisseurs: {
        Row: Fournisseur;
        Insert: Omit<Fournisseur, 'id' | 'created_at'> &
          Partial<Pick<Fournisseur, 'id' | 'created_at'>>;
        Update: Partial<Omit<Fournisseur, 'id'>>;
        Relationships: [];
      };
      commandes_fournisseur: {
        Row: CommandeFournisseur;
        Insert: Omit<CommandeFournisseur, 'id' | 'created_at'> &
          Partial<Pick<CommandeFournisseur, 'id' | 'created_at'>>;
        Update: Partial<Omit<CommandeFournisseur, 'id'>>;
        Relationships: [];
      };
      transferts: {
        Row: Transfert;
        Insert: Omit<Transfert, 'id' | 'created_at'> &
          Partial<Pick<Transfert, 'id' | 'created_at'>>;
        Update: Partial<Omit<Transfert, 'id'>>;
        Relationships: [];
      };
      charges_fixes: {
        Row: ChargeFixe;
        Insert: Omit<ChargeFixe, 'id' | 'created_at' | 'updated_at'> &
          Partial<Pick<ChargeFixe, 'id' | 'created_at' | 'updated_at'>>;
        Update: Partial<Omit<ChargeFixe, 'id'>>;
        Relationships: [];
      };
      dettes_proprio: {
        Row: DetteProprio;
        Insert: Omit<DetteProprio, 'id' | 'created_at' | 'updated_at'> &
          Partial<Pick<DetteProprio, 'id' | 'created_at' | 'updated_at'>>;
        Update: Partial<Omit<DetteProprio, 'id'>>;
        Relationships: [];
      };
      clotures_caisse: {
        Row: ClotureCaisse;
        Insert: Omit<ClotureCaisse, 'id' | 'ecart' | 'created_at'> &
          Partial<Pick<ClotureCaisse, 'id' | 'created_at'>>;
        Update: Partial<Omit<ClotureCaisse, 'id' | 'ecart'>>;
        Relationships: [];
      };
      clients: {
        Row: Client;
        Insert: Omit<Client, 'id' | 'created_at' | 'updated_at' | 'points' | 'total_achats' | 'nb_visites' | 'actif'> &
          Partial<Pick<Client, 'id' | 'created_at' | 'updated_at' | 'points' | 'total_achats' | 'nb_visites' | 'actif'>>;
        Update: Partial<Omit<Client, 'id'>>;
        Relationships: [];
      };
      caisse_terminals: {
        Row: CaisseTerminal;
        Insert: Omit<CaisseTerminal, 'id' | 'first_seen_at' | 'last_seen_at' | 'created_at'> &
          Partial<Pick<CaisseTerminal, 'id' | 'first_seen_at' | 'last_seen_at' | 'created_at'>>;
        Update: Partial<Omit<CaisseTerminal, 'id' | 'boutique_id' | 'terminal_id' | 'first_seen_at' | 'created_at'>>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
  };
};
